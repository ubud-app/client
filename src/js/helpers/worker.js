'use strict';

const Backbone = require('backbone');
const Sentry = require('@sentry/browser');
const _ = require('underscore');

/**
 * @module helpers/worker
 * @class WorkerHelper
 * @author Sebastian Pekarek
 */
class WorkerHelper {
    static async initialize () {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/serviceworker.js', {
                scope: '/'
            });
        }
        catch (err) {
            this.registration = null;
            Sentry.captureException(err);
            return;
        }
        finally {
            this.trigger('registration', this.registration);
        }

        this.registration.onupdatefound = () => {
            const installingWorker = this.registration.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                    if (!navigator.serviceWorker.controller) {
                        return;
                    }

                    WorkerHelper.trigger('updateFound');
                    location.reload();
                }
            };
        };

        setInterval(() => {
            this.checkForUpdates();
        }, 1000 * 60 * 10);

        setTimeout(() => {
            this.checkForUpdates();
        }, 1000 * 5);
    }

    static checkForUpdates () {
        this._checkForUpdates().catch(err => {
            Sentry.captureException(err);
        });
    }

    static async _checkForUpdates () {
        if (!this.registration || typeof this.registration.update !== 'function') {
            return;
        }

        try {
            await this.registration.update();
        }
        catch (err) {
            if (
                err.toString().indexOf('Failed to update a ServiceWorker') > -1 ||
                err.toString().indexOf('The Service Worker system has shutdown') > -1 ||
                err.toString().indexOf('An unknown error occurred when fetching the script') > -1
            ) {
                // Browser specific errors, ignore them…
            }
            else {
                if (err instanceof Error) {
                    err.message = 'Unable to run update service worker: ' + err.worker;
                }

                Sentry.captureException(err);
            }
        }
    }

    static async getWorkerRegistration (timeout = 2000) {
        if (!('serviceWorker' in navigator)) {
            return null;
        }
        if(this.registration !== undefined) {
            return this.registration;
        }

        return Promise.race([
            new Promise(resolve => {
                this.once('registration', registration => {
                    resolve(registration);
                });
            }),
            new Promise(resolve => {
                setTimeout(() => {
                    resolve(null);
                }, timeout);
            })
        ]);
    }
}

_.extend(WorkerHelper, Backbone.Events);
module.exports = WorkerHelper;