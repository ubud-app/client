'use strict';

import io from 'socket.io-client';
import {Collection, Model, Events} from 'backbone';
import {extend} from 'underscore';

import ConfigurationHelper from '../configuration';
import DataHelperDatabase from './database';

import * as Sentry from '@sentry/browser';
import {result} from 'underscore';
import UAParser from 'ua-parser-js';


class ResponseError extends Error {
    constructor (response = {}) {
        super(response.message || 'Unknown Response Error');
        this.error = response.error;
        this.attributes = response.attributes;
        this.reference = response.reference;
        this.extra = response.extra;
    }
}


class DataHelper {
    static async initialize ({endpoint, SessionModel, UserModel, ComponentCollection, DocumentCollection}) {
        this.endpoint = endpoint;

        this._user = null;
        this._session = null;
        this._state = 0; // 0=disconnected
        this._states = ['disconnected', 'connecting', 'connected', 'authenticating', 'ready'];
        this._io = null;
        this._log = [];
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

        // setup component collection
        this._components = new ComponentCollection();
        this._components.fetch();

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

        // ready to connect
        this.log('initialize', {endpoint: this.endpoint});
        this._setState(DataHelper.CONNECTING);
        this._io = io(this.endpoint);
        this._io.on('connect', () => {
            this.log('connected');
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
            this.log('disconnect');
            this._setState(DataHelper.DISCONNECTED);
        });
        this._io.on('error', (error) => {
            this.log('error', {error: error.toString()});
            this.trigger('socket:error', error);
        });
        this._io.on('connect_error', (error) => {
            this.log('error', {error: error.toString()});
        });
        this._io.on('connect_timeout', () => {
            this.log('timeout');
        });
        this._io.on('reconnect_error', (error) => {
            this.log('error', {error: error.toString()});
        });
        this._io.on('reconnect_timeout', () => {
            this.log('timeout');
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


    static async login ({email, password, acceptedTerms = false}) {
        this.log('authenticating.login');
        DataHelper._setState(DataHelper.AUTHENTICATING);

        const user = new UAParser();

        try {
            const session = await DataHelper.request('sessions/create', {
                email,
                password,
                name: user.getBrowser().name + ' (' + user.getOS().name + ' ' + user.getOS().version + ')',
                acceptedTerms: acceptedTerms || null
            });

            this._session.set(session);
            this.log('authenticating.ok');
            DataHelper._setState(DataHelper.READY);
        }
        catch (err) {
            this.log('authenticating.err', {error: err.toString()});
            DataHelper._setState(DataHelper.CONNECTED);
            throw err;
        }
    }

    static async logout () {
        await Promise.all([
            DataHelper._session.id ? DataHelper._session.destroy() : Promise.resolve(),
            DataHelperDatabase.clearDatabase()
        ]);

        this.log('logout');
        DataHelper._setState(DataHelper.CONNECTED);
    }

    static async _authenticate () {
        this.log('authenticating.token');
        this._setState(DataHelper.AUTHENTICATING);

        try {
            await this.request('auth', this._session.toJSON());

            this._setState(this.READY);
            this._session.fetch();
            this.log('authenticating.ok');
            this.on('update', this.logoutListener);
        }
        catch (err) {
            this._session.clear();
            this._setState(this.CONNECTED);
            this.log('authenticating.err', {error: err.toString()});
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

        this.identifier = this.identifier || Math.random().toString(36).substr(2);
        Sentry.configureScope(scope => {
            scope.setTag('transaction_id',  this.identifier);
        });

        const body = Object.assign({__ident: this.identifier}, data);
        return new Promise((resolve, reject) => {
            this._io.emit(event, body, (response) => {
                if (response.error && response.error === 401 && !this.isLoggedIn() && event !== 'sessions/create' && event !== 'auth') {
                    this.log('autoLogout');
                    this._setState(this.CONNECTED);
                    return this.request(event, data);
                }
                if (response.error && response.error === 401) {
                    this.log('autoLogout');
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
        /* eslint-disable require-atomic-updates */
        const resource = (result(model, 'url') || result(model, 'urlRoot')).split('/')[0];

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

                DataHelper._syncEvents(false, true, {model, response, options});
            }
            catch(error) {
                DataHelper._syncEvents(false, false, {model, error, options});
                throw error;
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

            DataHelper._syncEvents(false, true, {model, response, options});
        }
        catch (error) {
            DataHelper._syncEvents(false, false, {model, error, options});
            throw error;
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
        /* eslint-enable require-atomic-updates */
    }

    static _syncEvents (syncing, synced, {model, response, error, options}) {
        if(model instanceof Collection) {
            model.each(model => model._syncing = syncing);
        }
        model._syncing = syncing;

        if(model instanceof Collection) {
            model.each(model => model._synced = synced);
        }
        model._synced = synced;

        if(model instanceof Collection) {
            model.each(model => model.trigger(response ? 'sync' : 'error', model, response || error, options));
        }

        model.trigger(error ? 'error' : 'sync', model, error || response, options);
    }

    static live (model) {
        model._liveListeners = model._liveListeners || 0;
        model._liveListeners += 1;

        if (!model.isSynced() && !model.isSyncing() && Object.keys(model.toJSON()).length <= 1) {
            model.fetch();
        }
        else if(!model.isSynced() && !model.isSyncing()) {
            setTimeout(() => {
                if(!model.isSynced() && !model.isSyncing()) {
                    model.fetch();
                }
            }, 100);
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

            this.off('update', model._liveListener);
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
                d.name === result(model, 'url')
            ) {
                model.add(d.data);
            }
            else if (
                d.action === 'created' &&
                model instanceof Collection &&
                model.id &&
                d.name === result(model, 'url') &&
                typeof model.addFilter === 'function' &&
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

    static getComponents () {
        return this._components;
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


    static log (key, replacements) {
        const message = ConfigurationHelper.getString('header.status.' + key, replacements);
        this._log.push([new Date().getTime(), message]);

        if(this._log.length > 10) {
            this._log.splice(10, this._log.length - 10);
        }

        DataHelper.trigger('log', message);
    }

    static getLogs () {
        return this._log;
    }
}

extend(DataHelper, Events);
export default DataHelper;
