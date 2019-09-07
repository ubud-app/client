'use strict';

import {Events} from 'backbone';
import {extend} from 'underscore';
const prefix = 'club.ubud.client.';


/**
 * StoreHelper
 *
 * Helper to load and get stuff from localStorage. Allows to save/load
 * plain JavaScript Objects as well by using JSON.stringify internally.
 *
 * @class StoreHelper
 * @author Sebastian Pekarek
 */
class StoreHelper {

    /**
     * Get object by given key.
     *
     * @param {String} key Key to get value from.
     * @returns {Object}
     */
    static get (key) {
        try {
            return JSON.parse(this.storage[prefix + key]);
        }
        catch (err) {
            return null;
        }
    }

    /**
     * Set object in localStorage with the given key.
     *
     * @param {String} key Key to get value from.
     * @param {Object} value Key to get value from.
     * @returns {StoreHelper}
     */
    static set (key, value) {
        const oldValue = this.storage[prefix + key];
        const newValue = JSON.stringify(value);

        try {
            this.storage[prefix + key] = newValue;
        }
        catch (err) {
            // ignore any errors (private mode?)
        }

        if (oldValue !== newValue) {
            StoreHelper.trigger('change:' + key, value);
            StoreHelper.trigger('change', {key, value});
        }

        return this;
    }

    /**
     * Remove object from localStorage with the given key.
     *
     * @param {String} key Key to get value from.
     * @returns {StoreHelper}
     */
    static delete (key) {
        this.storage.removeItem(prefix + key);
        return this;
    }

    /**
     * Delete all values in StoreHelper
     *
     * @returns {StoreHelper}
     */
    static reset () {
        Object.keys(this.storage)
            .filter(k => k.substr(0, prefix.length) === prefix)
            .forEach(k => {
                delete this.storage[k];
            });

        return this;
    }
}


/* Browsers: User localStorage */
/* istanbul ignore if */
if (typeof localStorage === 'object') {
    StoreHelper.storage = localStorage;
}

/* Otherwise use simple variable */
else {
    StoreHelper.storage = {
        removeItem (key) {
            delete StoreHelper.storage[key];
        }
    };
}

extend(StoreHelper, Events);
export default StoreHelper;
