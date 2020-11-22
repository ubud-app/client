'use strict';

/**
 * @module serviceworker
 * @author Sebastian Pekarek
 */

/* eslint-env serviceworker */

/* eslint-disable node/no-unpublished-import */
import '@babel/register';
import '@babel/polyfill';
/* eslint-enable node/no-unpublished-import */

import DataWorker from './helpers/data/worker';

// worker-config is replaced with actual config path during build
// eslint-disable-next-line node/no-missing-import
import config from 'worker-config';

new DataWorker(self, config);

class Serviceworker {
    static async installCache () {

        // Should be fine as config.version is set during built time
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const cache = await caches.open(config.version);
        await cache.addAll(config.cache);
    }

    static async serve (request) {
        let response;

        // Production & GET: Offline first
        if (config.production && request.method === 'GET') {
            response = await caches.match(request);
            if (response) {
                return response;
            }
        }

        // Try to fetch it
        try {
            response = await fetch(request);
        }
        catch (err) {
            if (request.url.indexOf('sentry') > -1 && request.url.indexOf('/security/')) {
                return new Response(null, {
                    status: 201
                });
            }

            throw err;
        }

        if (
            request.method === 'GET' &&
            request.url.indexOf(location.protocol + '//' + location.host) > -1 &&
            (request.url.indexOf('/favicons/') > -1 || request.url.indexOf('/browserconfig.xml') > -1)
        ) {
            const responseCopy = response.clone();

            // Should be fine as config.version is set during built time
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            caches.open(config.version)
                .then(cache =>
                    cache.put(request, responseCopy)
                );
        }

        return response;
    }

    static async clear () {
        const keys = await caches.keys();

        await Promise.all(
            keys
                .filter(key => key !== config.version)
                .map(key => caches.delete(key))
        );
    }
}

self.addEventListener('install', event => {
    event.waitUntil(Serviceworker.installCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(Serviceworker.clear().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    event.respondWith(Serviceworker.serve(event.request));
});
