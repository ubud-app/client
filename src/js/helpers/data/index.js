'use strict';

const io = require('socket.io-client');
const {Collection, Model, Events} = require('backbone');
const DataHelperDatabase = require('./database');

const Sentry = require('@sentry/browser');
const _ = require('underscore');

class ResponseError extends Error {
    constructor (response = {}) {
        super(response.message || 'Unknown Response Error');
        this.error = response.error;
        this.attributes = response.attributes;
        this.reference = response.reference;
    }
}

class DataHelper {
    static async initialize ({endpoint, SessionModel, UserModel, DocumentCollection}) {
        this.endpoint = endpoint;

        this._user = null;
        this._session = null;
        this._state = 0; // 0=disconnected
        this._states = ['disconnected', 'connecting', 'connected', 'authenticating', 'ready'];
        this._io = null;
        this._methodMap = {
            create: 'create',
            update: 'update',
            patch: 'update',
            delete: 'delete',
            read: 'get'
        };

        this.DISCONNECTED = 0;
        this.CONNECTING = 1;
        this.CONNECTED = 2;
        this.AUTHENTICATING = 3;
        this.READY = 4;


        // setup session object
        this._session = new SessionModel().load();
        this._session.on('change:id', () => {
            this.trigger(this._session.id ? 'auth:loggedIn' : 'auth:loggedOut');
        });

        // setup user object
        this._user = new UserModel({id: this._session.get('userId')});
        this.once('socket:ready', () => {
            if (this._user.id) {
                this._user.fetch();
            }
        });
        this._session.on('change:userId', () => {
            this._user.id = this._session.get('userId');

            if (this._user.id) {
                this._user.fetch();
            }
        });

        // setup document collection
        this._documents = new DocumentCollection();
        this._documents.fetch();
        this._session.on('change:userId', () => {
            if (this._user.id) {
                this._documents.fetch();
            }
            else {
                this._documents.set([]);
            }
        });

        // setup logout app reload
        this.once('socket:ready', () => {
            this.once('auth:loggedOut', () => {
                // @todo clear database
            });
        });

        // ready to connect
        this._setState(DataHelper.CONNECTING);
        this._io = io(this.endpoint);
        this._io.on('connect', () => {
            this._setState(DataHelper.CONNECTED);

            if (this._session.id) {
                this._authenticate().catch(err => {
                    Sentry.captureException(err);
                });
            }
        });
        this._io.on('update', data => {
            this.trigger('update', data);
        });
        this._io.on('disconnect', () => {
            this._setState(DataHelper.DISCONNECTED);
        });
        this._io.on('error', (error) => {
            this.trigger('socket:error', error); // @todo use in UI
        });

        // wait for database or connection
        await Promise.race([
            DataHelperDatabase.initialize(),
            new Promise(resolve => {
                this.once('auth:loggedIn', () => {
                    resolve();
                });
            })
        ]);
    }

    static _setState (id) {
        DataHelper._state = id;
        DataHelper.trigger('socket:' + this._states[id]);
        DataHelper.trigger('socket:state', this._states[id]);
    }

    static state () {
        return this._states[DataHelper._state];
    }

    static isLoggedIn () {
        return !!DataHelper._session.id;
    }


    static async login ({email, password}) {
        DataHelper._setState(DataHelper.AUTHENTICATING);

        const UAParser = require('ua-parser-js');
        const user = new UAParser();

        try {
            const session = await DataHelper.request('sessions/create', {
                email,
                password,
                name: user.getBrowser().name + ' (' + user.getOS().name + ' ' + user.getOS().version + ')'
            });

            this._session.set(session);
            DataHelper._setState(DataHelper.READY);
        }
        catch (err) {
            DataHelper._setState(DataHelper.CONNECTED);
            throw err;
        }
    }

    static async logout () {
        await Promise.all([
            DataHelper._session.id ? DataHelper._session.destroy() : Promise.resolve(),
            DataHelperDatabase.clearDatabase()
        ]);

        DataHelper._setState(DataHelper.CONNECTED);
    }

    static async _authenticate () {
        this._setState(DataHelper.AUTHENTICATING);

        try {
            await this.request('auth', this._session.toJSON());

            this._setState(this.READY);
            this._session.fetch();
            this.on('update', this.logoutListener);
        }
        catch (err) {
            this._session.clear();
            this._setState(this.CONNECTED);
            return err;
        }
    }

    static async request (event, data) {
        if (this.state() !== 'ready' && event !== 'sessions/create' && event !== 'sessions/delete' && event !== 'auth') {
            await new Promise(resolve => {
                this.once('socket:ready', () => {
                    resolve();
                });
            });
        }

        return new Promise((resolve, reject) => {
            this._io.emit(event, data, (response) => {
                if (response.error && response.error === 401 && !this.isLoggedIn() && event !== 'sessions/create' && event !== 'auth') {
                    this._setState(this.CONNECTED);
                    return this.request(event, data);
                }
                if (response.error && response.error === 401) {
                    this._session.clear();
                    this._setState(this.CONNECTED);
                }
                if (response.error) {
                    return reject(new ResponseError(response));
                }

                resolve(response);
            });
        });
    }

    static async sync (method, model, options) {
        const resource = (_.result(model, 'url') || _.result(model, 'urlRoot')).split('/')[0];

        let body = {};
        options = options || {};

        model._syncing = true;
        method = DataHelper._methodMap[method];
        if (method === 'get' && model instanceof Collection) {
            method = 'list';
        }

        if ((method !== 'create' || resource !== 'session') && !DataHelper.isLoggedIn()) {
            await new Promise(resolve => {
                this.once('auth:loggedIn', () => {
                    resolve();
                });
            });
        }

        if (['create', 'update', 'patch'].indexOf(method) > -1) {
            body = options.attrs || model.toJSON(options);
        }
        if (model instanceof Model && model.id) {
            body.id = model.id;
        }
        if (model instanceof Collection) {
            body.id = model._filter.map(f => f[0].map(p => p.join(':')).join('/')).join('/');
        }

        let cache = null,
            response = null;

        const promises = [
            (async () => {
                if(method === 'list' && DataHelper._state !== 4) {
                    await new Promise(cb => setTimeout(cb, 1000));

                    if(response) {
                        return;
                    }
                }
                if(method === 'get' || method === 'list') {
                    cache = await (
                        model instanceof Model && model.id ?
                            DataHelperDatabase.getModel(model.dbStore, model.id) :
                            DataHelperDatabase.getCollection(model.dbStore, model._filter)
                    );

                    if (!response && cache) {
                        model.set(cache);
                        model.trigger('cache', model, cache, options);
                    }
                }
            })(),
            (async () => {
                if(method !== 'get' && method !== 'list' && DataHelper._state !== 4) {
                    throw new Error(`Unable to ${method} ${resource}: Connection state is ${DataHelper.state()}!`);
                }

                response = await DataHelper.request(resource + '/' + method, body);
                model.set(response);
            })()
        ];

        if(method !== 'get' && method !== 'list') {
            try {
                await promises[1];

                model._syncing = false;
                model._synced = true;
                model.trigger('sync', model, response, options);
            }
            catch(err) {
                model._syncing = false;
                model._synced = false;

                model.trigger('error', model, err, options);
                throw err;
            }

            DataHelperDatabase.setModel(model.dbStore, response).catch(err => {
                Sentry.captureException(err);
            });
            return;
        }


        try {
            await Promise.race(promises);

            /*if((!cache || cache.length === 0) && !response && DataHelper.state() <= 1) {
                // do nothing, we're offline…
                return;
            }*/
            if((!cache || cache.length === 0) && !response) {
                await Promise.all(promises);
            }

            model._syncing = false;
            model._synced = true;
            model.trigger('sync', model, response, options);
        }
        catch (err) {
            model._syncing = false;
            model._synced = false;

            model.trigger('error', model, err, options);
            throw err;
        }


        Promise
            .all(promises)
            .then(() => {
                if (model instanceof Model && model.id) {
                    return DataHelperDatabase.setModel(model.dbStore, response);
                }
                else if (model instanceof Collection) {
                    return DataHelperDatabase.setCollection(model.dbStore, cache || [], response);
                }
            })
            .catch(err => {
                Sentry.captureException(err);
            });
    }

    static live (model) {
        model._liveListeners = model._liveListeners || 0;
        model._liveListeners += 1;

        if (!model.isSynced() && !model.isSyncing()) {
            model.fetch();
        }

        let stopped = 0;
        const stop = () => {
            if(stopped) {
                return;
            }

            stopped = 1;
            model._liveListeners -= 1;
            if (model._liveListeners > 0 || !model._liveListener) {
                return;
            }

            this.off('updade', model._liveListener);
            delete model._liveListener;
        };

        if (model._liveListeners > 1 && model._liveListener) {
            return stop;
        }

        model._liveListener = function (d) {
            if (
                d.action === 'created' &&
                model instanceof Collection &&
                !model.id &&
                d.name === _.result(model, 'url')
            ) {
                model.add(d.data);
            }
            else if (
                d.action === 'created' &&
                model instanceof Collection &&
                model.id &&
                d.name === _.result(model, 'url') &&
                _.isFunction(model.addFilter) &&
                model.addFilter(new model.model(d.data))
            ) {
                model.add(d.data);
            }
            else if (d.action === 'updated' && model instanceof Model && d.id === model.id) {
                model.set(d.data);
            }
            else if (d.action === 'deleted' && model instanceof Model && d.id === model.id) {
                model.trigger('destroy', model.collection || null, {});
            }
            else if (d.action === 'deleted' && model instanceof Collection && d.name === model.url) {
                model.remove(d.id);
            }
        };

        this.on('update', model._liveListener);
        return stop;
    }

    static getSession () {
        return this._session;
    }

    static getUser () {
        return this._user;
    }

    static getDocuments () {
        return this._documents;
    }

    static isSyncing (object) {
        return object._syncing || false;
    }

    static isSynced (object) {
        return object._synced || false;
    }

    static async wait (object) {
        if (object._synced && !object._syncing) {
            return Promise.resolve(object);
        }
        if (!object._syncing) {
            await object.fetch();
            return Promise.resolve(object);
        }

        return new Promise(cb => {
            object.once('sync cache', () => {
                cb(object);
            });
        });
    }
}

_.extend(DataHelper, Events);
module.exports = DataHelper;
