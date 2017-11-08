'use strict';

export default class StoreHelper {
    static get(key) {
        try {
            return JSON.parse(localStorage['hmwimm-' + key]);
        }
        catch (err) {
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage['hmwimm-' + key] = JSON.stringify(value);
            return true;
        }
        catch (err) {
            return false;
        }
    }

    static reset() {
        for (let i in localStorage) {
            if (i.indexOf('hmwimm-') === 0) {
                try {
                    delete localStorage[i];
                }
                catch (error) {
                    // do nothing
                }
            }
        }

        return StoreHelper;
    }
}
