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
	static _user = null;
	static _session = null;
	static _state = 0; // 0=disconnected 1=connecting 2=connected 3=authenticating 4=ready
	static _io = null;
	static _methodMap = {
		create: 'create',
		update: 'update',
		patch: 'update',
		delete: 'delete',
		read: 'get'
	};

	static DISCONNECTED = 0;
	static CONNECTING = 1;
	static CONNECTED = 2;
	static AUTHENTICATING = 3;
	static READY = 4;

	static initialize ({endpoint, SessionModel, UserModel, DocumentCollection}) {
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
			DataHelper._session = new SessionModel();
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
				if(DataHelper._user.id) {
					DataHelper._user.fetch();
				}
			});

			// setup document collection
			DataHelper._documents = new DocumentCollection();
			DataHelper.once('socket:ready', () => {
				DataHelper._documents.fetch();
			});

			// setup logout app reload
			DataHelper.once('socket:ready', function() {
				DataHelper.once('auth:loggedOut', function() {
					location.reload();
				});
			});

			// ready to connect
			DataHelper._setState(1);
			DataHelper._io = SocketIO(endpoint);
			DataHelper._io.on('connect', () => {
				DataHelper._setState(2);

				if (DataHelper._session.id) {
					resolve(DataHelper._authenticate());
				}

				resolve(false);
			});
			DataHelper._io.on('update', data => {
				DataHelper.trigger('update', data);
			});
			DataHelper._io.on('disconnect', () => {
				DataHelper._setState(0);
			});
			DataHelper._io.on('error', (error) => {
				DataHelper.trigger('socket:error', error); // @todo use in UI
			});
		});
	}

	static _setState (id) {
		DataHelper._state = id;
		DataHelper.trigger('socket:' + (['disconnected', 'connecting', 'connected', 'authenticating', 'ready'])[id]);
		DataHelper.trigger('socket:state', (['disconnected', 'connecting', 'connected', 'authenticating', 'ready'])[id]);
	}

	static getState () {
		return DataHelper._state;
	}

	static login (email, password) {
		DataHelper._setState(3);
		return DataHelper.send('sessions/create', {email, password, name: 'DWIMM Web'})
			.then(session => {
				this._session.set(session);
				DataHelper._setState(4);
				return Promise.resolve();
			})
			.catch(e => {
				DataHelper._setState(2);
				throw e;
			});
	}

	static logout() {
		if(!DataHelper._session.id) {
			location.reload();
			return;
		}

		DataHelper._session.destroy()
			.then(function() {
				location.reload();
			});
	}

	static _authenticate () {
		DataHelper._setState(3);
		return DataHelper.send('auth', DataHelper._session.toJSON())
			.then(function () {
				DataHelper._setState(4);
				return Promise.resolve(true);
			})
			.catch(() => {
				DataHelper._session.clear();
				DataHelper._setState(2);
				return Promise.resolve(false);
			});
	}

	static send (event, data) {
		return new Promise((resolve, reject) => {
			DataHelper._io.emit(event, data, (response) => {
				if(response.error && response.error === 401) {
					DataHelper._session.clear();
					DataHelper._setState(2);
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
		if(method === 'get' && model instanceof Collection) {
			method = 'list';
		}
		model.syncing = true;

		if(['create', 'update', 'patch'].indexOf(method) > -1) {
			body = options.attrs || model.toJSON(options);
		}
		if(model instanceof Model && model.id) {
			body.id = model.id;
		}

		return DataHelper.send(resource + '/' + method, body)
			.then(function(body) {
				model.set(body);
				delete model.syncing;
				model.trigger('sync', model, body, options);
			})
			.catch(function(err) {
				delete model.syncing;
				model.trigger('error', model, err, options);
				throw err;
			});
	}

	static live(model, view) {
		model._liveListeners = model._liveListeners || 0;
		model._liveListeners += 1;

		view.once('remove', () => {
			model._liveListeners -= 1;
			if(model._liveListeners > 0 || !model._liveListener) {
				return;
			}

			this.off('updade', model._liveListener);
			delete model._liveListener;
		});

		if(model._liveListeners > 1 && model._liveListener) {
			return;
		}

		model._liveListener = function(d) {
			if(d.action === 'created' && model instanceof Collection && d.name === model.url) {
				model.add(d.data);
			}
			if(d.action === 'updated' && model instanceof Model && d.id === model.id) {
				model.set(d.data);
			}
			if(d.action === 'deleted' && model instanceof Model && d.id === model.id) {
				model.trigger('destroy', model.collection || null, {});
			}
			if(d.action === 'deleted' && model instanceof Collection && d.name === model.url) {
				model.remove(d.id);
			}
		};
		this.on('update', model._liveListener);
	}

	static wait (model) {
		if(_.size(model.toJSON()) > 1 && !model.syncing) {
			return Promise.resolve(model);
		}
		if(!model.syncing) {
			model.fetch();
		}

		return new Promise(cb => {
			model.once('sync', () => {
				cb(model);
			});
		});
	}

	static getUser() {
		return DataHelper._user;
	}

	static getDocuments() {
		return DataHelper._documents;
	}
}

_.extend(DataHelper, Events);
export default DataHelper;