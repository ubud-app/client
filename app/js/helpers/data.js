'use strict';

import {Model, Collection, Events} from 'backbone';
import _ from 'underscore';
import SocketIO from 'socket.io-client';

class ResponseError extends Error {
    constructor (response) {
        super(response.message || 'Unknown Response Error');
        this.error = response.error;
        this.attributes = response.attributes;
        this.reference = response.reference;
    }
}

class DataHelper {
    /*
     * static _user;
     * static _session;
     * static _state; // 0=disconnected 1=connecting 2=connected 3=authenticating 4=ready
     * static _io;
     * static _methodMap;
     *
     * static DISCONNECTED;
     * static CONNECTING;
     * static CONNECTED;
     * static AUTHENTICATING;
     * static READY;
     */

    static initialize ({endpoint, SessionModel, UserModel, DocumentCollection}) {
        DataHelper._user = null;
        DataHelper._session = null;
        DataHelper._state = 0; // 0=disconnected
        DataHelper._io = null;
        DataHelper._methodMap = {
            create: 'create',
            update: 'update',
            patch: 'update',
            delete: 'delete',
            read: 'get'
        };

        DataHelper.DISCONNECTED = 0;
        DataHelper.CONNECTING = 1;
        DataHelper.CONNECTED = 2;
        DataHelper.AUTHENTICATING = 3;
        DataHelper.READY = 4;

        return new Promise(function (resolve) {
            if (!SessionModel) {
                throw new Error('Cant\'t initialize: SessionModel not given!');
            }
            if (!UserModel) {
                throw new Error('Cant\'t initialize: UserModel not given!');
            }

            // DataHelper.on('all', function () {
            // 	console.log(arguments);
            // });

            // setup session object
            DataHelper._session = new SessionModel().load();
            DataHelper._session.on('change:id', () => {
                DataHelper.trigger(DataHelper._session.id ? 'auth:loggedIn' : 'auth:loggedOut');
            });

            // setup user object
            DataHelper._user = new UserModel({id: DataHelper._session.get('userId')});
            DataHelper.once('socket:ready', () => {
                DataHelper._user.fetch();
            });
            DataHelper._session.on('change:userId', () => {
                DataHelper._user.id = DataHelper._session.get('userId');
                if (DataHelper._user.id) {
                    DataHelper._user.fetch();
                }
            });

            // setup document collection
            DataHelper._documents = new DocumentCollection();
            DataHelper.once('socket:ready', () => {
                DataHelper._documents.fetch();
            });

            // setup logout app reload
            DataHelper.once('socket:ready', function () {
                DataHelper.once('auth:loggedOut', function () {
                    location.reload();
                });
            });

            // ready to connect
            DataHelper._setState(DataHelper.CONNECTING);
            DataHelper._io = SocketIO(endpoint);
            DataHelper._io.on('connect', () => {
                DataHelper._setState(DataHelper.CONNECTED);

                if (DataHelper._session.id) {
                    resolve(DataHelper._authenticate());
                }

                resolve(false);
            });
            DataHelper._io.on('update', data => {
                DataHelper.trigger('update', data);
            });
            DataHelper._io.on('disconnect', () => {
                DataHelper._setState(DataHelper.DISCONNECTED);
            });
            DataHelper._io.on('error', (error) => {
                DataHelper.trigger('socket:error', error); // @todo use in UI
            });
        });
    }

    static _setState (id) {
        DataHelper._state = id;
        DataHelper.trigger('socket:' + ['disconnected', 'connecting', 'connected', 'authenticating', 'ready'][id]);
        DataHelper.trigger('socket:state', ['disconnected', 'connecting', 'connected', 'authenticating', 'ready'][id]);
    }

    static getState () {
        return DataHelper._state;
    }

    static login (email, password) {
        DataHelper._setState(DataHelper.AUTHENTICATING);

        const UAParser = require('ua-parser-js');
        const user = new UAParser();

        return DataHelper.send('sessions/create', {
            email,
            password,
            name: user.getBrowser().name + ' (' + user.getOS().name + ' ' + user.getOS().version + ')'
        })
            .then(session => {
                this._session.set(session);
                DataHelper._setState(DataHelper.READY);
                this.on('update', this.logoutListener);
                return Promise.resolve();
            })
            .catch(e => {
                DataHelper._setState(DataHelper.CONNECTED);
                throw e;
            });
    }

    static logoutListener(d) {
        if (d.action === 'deleted' && this._session && this._session.id && d.id === this._session.id) {
            location.reload();
        }
    }

    static logout () {
        if (!DataHelper._session.id) {
            location.reload();
            return;
        }

        DataHelper._session.destroy()
            .then(function () {
                location.reload();
            });
    }

    static _authenticate () {
        DataHelper._setState(DataHelper.AUTHENTICATING);
        return DataHelper.send('auth', DataHelper._session.toJSON())
            .then(function () {
                DataHelper._setState(DataHelper.READY);
                DataHelper.on('update', DataHelper.logoutListener);
                return Promise.resolve(true);
            })
            .catch(err => {
                DataHelper._session.clear();
                DataHelper._setState(DataHelper.CONNECTED);
                return Promise.resolve(err);
            });
    }

    static send (event, data) {
        return new Promise((resolve, reject) => {
            DataHelper._io.emit(event, data, (response) => {
                if (response.error && response.error === 401) {
                    DataHelper._session.clear();
                    DataHelper._setState(DataHelper.CONNECTED);
                }
                if (response.error) {
                    return reject(new ResponseError(response));
                }

                resolve(response);
            });
        });
    }

    static sync (method, model, options) {
        const resource = (_.result(model, 'url') || _.result(model, 'urlRoot')).split('/')[0];

        let body = {};
        options = options || {};

        method = DataHelper._methodMap[method];
        if (method === 'get' && model instanceof Collection) {
            method = 'list';
        }
        model.syncing = true;

        if (['create', 'update', 'patch'].indexOf(method) > -1) {
            body = options.attrs || model.toJSON(options);
        }
        if (model instanceof Model && model.id) {
            body.id = model.id;
        }
        if (model instanceof Collection && model.id) {
            body.id = model.id;
        }

        return DataHelper.send(resource + '/' + method, body)
            .then(function (body) {
                model.set(body);
                delete model.syncing;
                model.trigger('sync', model, body, options);
            })
            .catch(function (err) {
                delete model.syncing;
                model.trigger('error', model, err, options);
                throw err;
            });
    }

    static live (model, view) {
        model._liveListeners = model._liveListeners || 0;
        model._liveListeners += 1;

        if (_.size(model.toJSON()) <= 1 && !model.syncing) {
            model.fetch();
        }

        view.once('remove', () => {
            model._liveListeners -= 1;
            if (model._liveListeners > 0 || !model._liveListener) {
                return;
            }

            this.off('updade', model._liveListener);
            delete model._liveListener;
        });

        if (model._liveListeners > 1 && model._liveListener) {
            return;
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
            if (d.action === 'updated' && model instanceof Model && d.id === model.id) {
                model.set(d.data);
            }
            if (d.action === 'deleted' && model instanceof Model && d.id === model.id) {
                model.trigger('destroy', model.collection || null, {});
            }
            if (d.action === 'deleted' && model instanceof Collection && d.name === model.url) {
                model.remove(d.id);
            }
        };
        this.on('update', model._liveListener);
    }

    static wait (model) {
        if ((model.length > 0 || _.size(model.toJSON()) > 1) && !model.syncing) {
            return Promise.resolve(model);
        }
        if (!model.syncing) {
            model.fetch();
        }

        return new Promise(cb => {
            model.once('sync', () => {
                cb(model);
            });
        });
    }

    static getUser () {
        return DataHelper._user;
    }

    static getDocuments () {
        return DataHelper._documents;
    }
}

_.extend(DataHelper, Events);
export default DataHelper;