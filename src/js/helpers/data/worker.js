'use strict';

const SCHEMA_VERSION = 2;
//const statusStrings = ['init', 'error', 'blocked', 'upgrade', 'upgrading', 'ready', 'closed'];

export default class DataWorker {
    constructor (self, config) {
        this.error = null;
        this.status = 0;
        this.database = null;
        this.config = config;

        this.db = self;
        this.onConnected = [];

        self.addEventListener('message', e => {
            let data;

            try {
                data = JSON.parse(e.data);
            }
            catch (err) {
                // ignore this
            }

            this.handleRequest(data[1], data[2]).then(response => {
                (e.source || self).postMessage(JSON.stringify([data[0], 0, response]));
            }).catch(err => {
                (e.source || self).postMessage(JSON.stringify([data[0], 1, {
                    error: String(err),
                    stack: err.stack || null
                }]));
            });
        }, false);


        if (!this.db.indexedDB) {
            this.setStatus(1);
            this.setError(new Error('This Browser is unsupported, please use a modern browser…'));
            return;
        }

        this.openDatabase().then(() => {
            this.setStatus(5);
        }).catch(err => {
            this.setError(err);
            this.setStatus(1);
        });
    }

    setStatus (id) {
        if (this.status === id) {
            return;
        }

        this.status = id;

        if (id === 5) {
            this.onConnected.forEach(f => f());
        }
    }

    setError (error) {
        this._error = error;
    }

    async openDatabase () {
        return new Promise((resolve, reject) => {
            let req;

            try {
                req = this.db.indexedDB.open('club.ubud.client.db', SCHEMA_VERSION);
            }
            catch (err) {

                /* Browser specific Error */
                if (err.toString().indexOf('UnknownError') > -1) {
                    reject(null);
                    return;
                }

                reject(err);
            }

            /* istanbul ignore next */
            req.onerror = error => {
                reject(error);
            };

            req.onsuccess = () => {
                this.database = req.result;
                resolve();
            };

            req.onupgradeneeded = () => {
                this.database = req.result;
                this.setStatus(4);

                this.upgradeDatabase();
            };

            /* istanbul ignore next */
            req.onblocked = () => {
                this.setStatus(2);
            };

            req.onversionchange = () => {
                this.database.close();
                this.setStatus(3);
            };
        });
    }

    upgradeDatabase () {
        this.config.stores.forEach(store => {
            try {
                this.database.deleteObjectStore(store);
            }
            catch (err) {

                /* Unknown Error */
                if (err.name !== 'NotFoundError') {
                    this.setStatus(1);
                    this.setError(err);
                }
            }

            const objectStore = this.database.createObjectStore(store);
            objectStore.createIndex('id', 'id', {unique: false});
        });
    }

    async handleRequest (type, data) {
        if (type === 'getModel') {
            return this.getModel(data.type, data.id);
        }
        else if (type === 'setModel') {
            return this.setModel(data.type, data.data);
        }
        else if (type === 'deleteModel') {
            return this.deleteModel(data.type, data.data);
        }
        else if (type === 'getCollection') {
            return this.getCollection(data.type, data.filters);
        }
        else if (type === 'setCollection') {
            return this.setCollection(data.type, data.cache, data.response);
        }
        else if (type === 'clear') {
            return this.clear();
        }
        else {
            return new Error(`Unable to answer worker request: unsupported request type ${type}`);
        }
    }

    async shouldAbort () {
        if (this.status === 5) {
            return false;
        }
        if ([1, 2, 6].indexOf(this.status) > -1) {
            return true;
        }

        return new Promise(cb => {
            const done = () => {
                const i = this.onConnected.indexOf(done);
                if (i > -1) {
                    this.onConnected.splice(i, 1);
                    cb(this.status !== 5);
                    return;
                }
            };

            this.onConnected.push(done);
            setTimeout(done, 2000);
        });
    }

    async transaction (type, action, mode = 'readonly') {
        if (await this.shouldAbort()) {
            return null;
        }

        return new Promise((resolve, reject) => {
            let transaction;
            try {
                transaction = this.database.transaction([type], mode);
            }
            catch (err) {
                if (err.toString().indexOf('The database connection is closing') > -1) {
                    this.setStatus(6);
                }

                reject(err);
                return;
            }

            const store = transaction.objectStore(type);
            const req = action(store);
            req.onerror = err => {
                reject(err);
            };
            req.onsuccess = () => {
                resolve(req.result || null);
            };
        });
    }

    async getModel (type, id) {
        return this.transaction(type, store => store.get(id));
    }

    async setModel (type, data) {
        return this.transaction(type, store => store.put(data, data.id), 'readwrite');
    }

    async deleteModel (type, id) {
        return this.transaction(type, store => store.delete(id), 'readwrite');
    }

    async getCollection (type, filters) {
        if (await this.shouldAbort()) {
            return null;
        }

        return new Promise((resolve, reject) => {
            let transaction;
            try {
                transaction = this.database.transaction([type]);
            }
            catch (err) {
                if (err.toString().indexOf('The database connection is closing')) {
                    this.setStatus(6);
                }

                reject(err);
                return;
            }

            const store = transaction.objectStore(type);
            const req = store.openCursor();
            const result = [];

            req.onerror = err => {
                reject(err);
            };
            req.onsuccess = e => {
                try {
                    const cursor = e.target.result;

                    if (cursor) {
                        const data = cursor.value;

                        if (!filters.find(f => !this._getCollectionFilterMatches(f, data))) {
                            result.push(data);
                        }

                        cursor.continue();
                    }
                    else {
                        resolve(result);
                    }
                }
                catch (err) {
                    reject(err);
                }
            };
        });
    }

    _getCollectionFilterMatches (filter, data) {
        let value = data[filter[1]] !== undefined ? data[filter[1]] : data[filter[1] + 'Id'];

        if (filter[1] === 'month' && !data.month && data.time) {
            value = data.time.substr(0, 7);
        }

        //console.log(filter, value, data);

        if (filter[0] === '>=') {
            return !!filter[2].find(v => {
                //console.log('Comparator:', value, '>=', v, '=', value >= v);
                return value >= v;
            });
        }
        else if (filter[0] === '=') {
            return filter[2].indexOf(value) > -1;
        }
        else {
            throw new Error(`Unsupported filter: ${filter[0]}`);
        }
    }

    async setCollection (type, cached, response) {
        if (await this.shouldAbort()) {
            return null;
        }

        const promises = [];

        // update models with response data
        response.forEach(data =>
            promises.push(this.setModel(type, data))
        );

        // delete models which are not in response any more
        (cached || [])
            .filter(c => !response.find(r => r.id === c.id))
            .forEach(data => this.deleteModel(type, data.id));
    }

    async clear () {
        if (await this.shouldAbort()) {
            return;
        }

        const transaction = this.database.transaction(this.config.stores, 'readwrite');
        return Promise.all(this.config.stores.map(
            store => this.clearStore(transaction, store)
        ));
    }

    async clearStore (transaction, storeName) {
        return new Promise((resolve, reject) => {
            try {
                const store = transaction.objectStore(storeName);
                const req = store.openCursor();

                req.onerror = err => {
                    reject(err);
                };
                req.onsuccess = e => {
                    try {
                        const cursor = e.target.result;
                        if (!cursor) {
                            resolve();
                            return;
                        }

                        store.delete(cursor.key);
                        cursor.continue();
                    }
                    catch (err) {
                        reject(err);
                    }
                };
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
