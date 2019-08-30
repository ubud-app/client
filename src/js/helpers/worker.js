'use strict';

import {Events} from 'backbone';
import {extend} from 'underscore';
import {captureException} from '@sentry/browser';


let updateAvailable = false;

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
            captureException(err);
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

                    updateAvailable = true;
                    WorkerHelper.trigger('updateAvailable');
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
            captureException(err);
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

                captureException(err);
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

    static isUpdateAvailable () {
        return updateAvailable;
    }
}

extend(WorkerHelper, Events);
export default WorkerHelper;
