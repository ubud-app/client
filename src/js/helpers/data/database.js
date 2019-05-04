'use strict';


const {extend} = require('underscore');
const {Events} = require('backbone');
const WorkerHelper = require('../worker');


class DataHelperDatabase {
    static async initialize () {
        await this._getWorker();
    }

    static async getModel (type, id) {
        return this.request('getModel', {
            type,
            id
        });
    }

    static async setModel (type, data) {
        return this.request('setModel', {
            type,
            data
        });
    }

    static async getCollection (type, filters) {
        return this.request('getCollection', {
            type,
            filters: filters.map(f => f[1])
        });
    }

    static async setCollection (type, cache = [], response = []) {
        return this.request('setCollection', {
            type,
            cache,
            response
        });
    }


    static async request (type, data = {}) {
        const id = Math.round(Math.random() * 999999);
        //const time = new Date().getTime();

        // console.log('📟 DataHelper Database: → %s: %s', id, type, data);

        await this._getWorker();
        this.worker.postMessage(JSON.stringify([id, type, data]));

        return new Promise((resolve, reject) => {
            DataHelperDatabase.once('message:' + id, (isError, response) => {
                // console.log('📟 DataHelper Database: ← %s: %o (took %s ms)', id, response, new Date().getTime() - time);

                if(isError) {
                    const e = new Error(response.error);
                    e.stack = response.stack;
                    reject(e);
                } else {
                    resolve(response || null);
                }
            });
        });
    }

    static async _getWorker () {

        // WebWorker: we don't terminate them at all
        if (this.worker && this.worker instanceof Worker) {
            return this.worker;
        }

        // Service Worker
        if (
            this.worker &&
            typeof ServiceWorker !== 'undefined' &&
            this.worker instanceof ServiceWorker &&
            ['activating', 'activated'].indexOf(this.worker.state) > -1
        ) {
            return this.worker;
        }

        this.worker = await this._getActiveWorker();

        if (this.worker instanceof Worker) {
            this.worker.addEventListener('message', this.onWorkerMessage, false);
        }
        if (typeof ServiceWorker !== 'undefined' && this.worker instanceof ServiceWorker) {
            navigator.serviceWorker.addEventListener('message', this.onWorkerMessage, false);
        }
    }

    static async _getActiveWorker () {
        const serviceWorker = await WorkerHelper.getWorkerRegistration(250);
        if (serviceWorker && serviceWorker.active) {
            return serviceWorker.active;
        }

        if (typeof Worker === 'undefined') {
            throw new Error('Browser doesn\'t support WebWorkers!');
        }

        return new Worker('/webworker.js');
    }

    static onWorkerMessage (e) {
        try {
            const d = JSON.parse(e.data);
            DataHelperDatabase.trigger('message:' + d[0], d[1], d[2]);
        }
        catch(err) {
            // ignore
        }
    }
}

extend(DataHelperDatabase, Events);
module.exports = DataHelperDatabase;
