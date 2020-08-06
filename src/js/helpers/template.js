'use strict';


import rivets from 'rivets';
import {Collection, Model} from 'backbone';
import AutoNumeric from 'autonumeric';
import {DateTime} from 'luxon';
import filesize from 'filesize';

import AppHelper from './app';
import BaseView from '../views/_';
import ConfigurationHelper from './configuration';
import DataHelper from './data';


const rivetsListenerStore = [];
rivets.adapters[':'] = {
    observe: function (obj, keypath, callback) {
        if (
            ['isSynced', 'isSyncing'].indexOf(keypath) > -1 &&
            (obj instanceof Collection || obj instanceof Model)
        ) {
            rivetsListenerStore.push([obj, keypath, callback, () => obj.off('request cache sync error', callback)]);
            obj.on('request cache sync error', callback);
        }
        else if (obj instanceof Collection) {
            const m = () => callback(obj[keypath]);
            rivetsListenerStore.push([obj, keypath, callback, () => obj.off('add remove reset', m)]);
            obj.on('add remove reset', m);
        }
        else if (obj instanceof Model) {
            rivetsListenerStore.push([obj, keypath, callback, () => obj.off('change:' + keypath, callback)]);
            obj.on('change:' + keypath, callback);
        }
        else {
            throw new Error('TemplateHelper: unsupported use of adapter (observe):' + keypath);
        }
    },
    unobserve: function (obj, keypath, callback) {
        const b = rivetsListenerStore.find(b => b[0] === obj && b[1] === keypath && b[2] === callback);
        if (b && b[3]) {
            b[3]();
        }
    },
    get: function (obj, keypath) {
        if (
            ['isSynced', 'isSyncing'].indexOf(keypath) > -1 &&
            (obj instanceof Collection || obj instanceof Model)
        ) {
            return obj[keypath]();
        }
        else if (obj instanceof Collection) {
            return obj[keypath];
        }
        else if (obj instanceof Model) {
            return obj.get(keypath);
        }
        else {
            throw new Error('TemplateHelper: unsupported use of adapter (observe):' + keypath);
        }
    },
    set: function (obj, keypath, value) {
        if (obj instanceof Collection) {
            obj[keypath] = value;
        }
        else if (obj instanceof Model) {
            obj.set(keypath, value);
        }
    }
};

rivets.formatters.log = obj => {
    console.log('💁', obj); // eslint-disable-line no-console
};
rivets.formatters.string = (string, replacements) => {
    return ConfigurationHelper.getString(string, replacements);
};
rivets.formatters.date = (l, format = DateTime.DATE_FULL) => {
    return l && l instanceof DateTime ? l.toLocaleString(format) : '';
};
rivets.formatters.time = (l, format = DateTime.TIME_SIMPLE) => {
    return l && l instanceof DateTime ? l.toLocaleString(format) : '';
};
rivets.formatters.datetime = (l, format = DateTime.DATETIME_SHORT) => {
    if (l instanceof DateTime) {
        return l.toLocaleString(format);
    }
    else if (typeof l === 'string') {
        return DateTime.fromISO(l).toLocaleString(format);
    }

    return '';
};
rivets.formatters.currency = v => {
    return !isNaN(v) && isFinite(v) ? AutoNumeric.format(v / 100, TemplateHelper.getAutoNumericCurrencyConfig()) : '';
};
rivets.formatters.percentage = v => {
    return !isNaN(v) && isFinite(v) ? AutoNumeric.format(v, ConfigurationHelper.getAutoNumericPercentageConfig()) : '';
};
rivets.formatters.filesize = v => {
    return !isNaN(v) && isFinite(v) ? filesize(v, ConfigurationHelper.getCurrentLanguage()) : '';
};
rivets.formatters.isNegative = v => {
    return typeof v === 'number' && v < 0;
};
rivets.formatters.append = (a, b) => {
    return String(a || '') + String(b || '');
};
rivets.formatters.prepend = (a, b) => {
    return String(b || '') + String(a || '');
};
rivets.formatters.fallback = (a, b) => {
    return String(a || '') || String(b || '');
};
rivets.formatters.is = (a, b) => {
    return a === b;
};

rivets.binders['style-*'] = function (el, value) {
    el.style.setProperty(this.args[0], value);
};

rivets.binders.required = function (el, value) {
    el.required = !!value;
};

rivets.binders['value'] = {
    routine: function (el, value) {
        if (value !== el.value && el !== document.activeElement) {
            el.value = value || '';
        }
    },
    getValue: function (el) {
        return el.value;
    },
    bind: function (el) {
        if (!this.callback) {
            this.callback = () => {
                this.publish();
            };
        }

        el.addEventListener('input', this.callback);
    },
    unbind: function (el) {
        el.removeEventListener(this.event, this.callback);
    }
};

rivets.binders['currency-value'] = {
    routine: function (el, value) {
        if (this.autonumeric && value !== this.autonumeric.getNumber() * 100 && el !== document.activeElement) {
            this.autonumeric.set((value || 0) / 100);
        }
    },
    getValue: function () {
        return Math.round(this.autonumeric.getNumber() * 100);
    },
    bind: function (el) {
        this.autonumeric = new AutoNumeric(el, TemplateHelper.getAutoNumericCurrencyConfig());

        if (!this.callback) {
            this.callback = () => {
                this.publish();
            };
        }

        el.addEventListener('input', this.callback);
    },
    unbind: function (el) {
        el.removeEventListener(this.event, this.callback);

        try {
            this.autonumeric.remove();
        }
        catch (err) {
            // ignore this
        }
    }
};

rivets.binders['datetime-value'] = {
    routine: function (el, value) {
        const iso = DateTime.fromISO(value);
        const datetime = value ? iso.minus({seconds: iso.second}).toISO().split('.')[0] : null;
        if (datetime !== el.value && el !== document.activeElement) {
            el.value = datetime;
        }
    },
    getValue: function (el) {
        return DateTime.fromISO(el.value).toJSON();
    },
    bind: function (el) {
        if (!this.callback) {
            this.callback = () => {
                this.publish();
            };
        }

        el.addEventListener('input', this.callback);
    },
    unbind: function (el) {
        el.removeEventListener(this.event, this.callback);
    }
};


/**
 * TemplateHelper
 *
 * @class TemplateHelper
 * @author Sebastian Pekarek
 */
export default class TemplateHelper {

    /**
     * Renders the given template in the given
     * view with rivets.js
     *
     * @param {object} options
     * @param {BaseView} options.view
     * @param {string} options.template
     * @param {object} [options.data]
     */
    static render (options) {
        if (!(options.view instanceof BaseView)) {
            throw new Error('TemplateHelper.render: Unable to render: no view given!');
        }
        if (typeof options.template !== 'string') {
            throw new Error('TemplateHelper.render: Unable to render: no template given!');
        }

        const data = Object.assign(
            {view: {}},
            options.data || {}
        );


        // data.view
        for (const k in options.view) {
            if (typeof options.view[k] === 'function') {
                data.view[k] = function () {
                    return options.view[k].apply(options.view, arguments);
                };
            }
        }

        options.view.$el.html(options.template);

        const rivetsView = rivets.bind(options.view.el, data);
        options.view.on('remove', () => {
            rivetsView.unbind();
        });
    }


    /**
     * Formats the given value as a currency string.
     *
     * @param {Number} value
     * @param {Object|String} [config]
     * @returns {string}
     */
    static formatCurrency (value, config = null) {
        return AutoNumeric.format(value / 100, config || this.getAutoNumericCurrencyConfig());
    }

    /**
     * Formats the given value as a percentage string.
     *
     * @param {Number} value
     * @param {Object|String} [config]
     * @returns {string}
     */
    static formatPercentage (value, config = null) {
        return AutoNumeric.format(value, config || ConfigurationHelper.getAutoNumericPercentageConfig());
    }

    static getAutoNumericCurrencyConfig () {
        const document = DataHelper.getDocuments().get(AppHelper.getDocumentId()) || null;
        let predefined = 'euro';

        if (document && document.get('settings') && document.get('settings').currency) {
            predefined = document.get('settings').currency;
        }

        return [predefined, {
            emptyInputBehavior: 'zero'
        }];
    }
}
