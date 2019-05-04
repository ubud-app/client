'use strict';


const tinybind = require('tinybind');
const Backbone = require('backbone');
const AutoNumeric = require('autonumeric');
const {DateTime} = require('luxon');

const View = require('../views/_');
const ConfigurationHelper = require('../helpers/configuration');


const rivetsListenerStore = [];
tinybind.adapters[':'] = {
    observe: function (obj, keypath, callback) {
        if(
            ['isSynced', 'isSyncing'].indexOf(keypath) > -1 &&
            (obj instanceof Backbone.Collection || obj instanceof Backbone.Model)
        ) {
            rivetsListenerStore.push([obj, keypath, callback, () => obj.off('request cache sync error', callback)]);
            obj.on('request cache sync error', callback);
        }
        else if (obj instanceof Backbone.Collection) {
            const m = () => callback(obj[keypath]);
            rivetsListenerStore.push([obj, keypath, callback, () => obj.off('add remove reset', m)]);
            obj.on('add remove reset', m);
        }
        else if (obj instanceof Backbone.Model) {
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
        if(
            ['isSynced', 'isSyncing'].indexOf(keypath) > -1 &&
            (obj instanceof Backbone.Collection || obj instanceof Backbone.Model)
        ) {
            return obj[keypath]();
        }
        else if (obj instanceof Backbone.Collection) {
            return obj[keypath];
        }
        else if (obj instanceof Backbone.Model) {
            return obj.get(keypath);
        }
        else {
            throw new Error('TemplateHelper: unsupported use of adapter (observe):' + keypath);
        }
    },
    set: function (obj, keypath, value) {
        if (obj instanceof Backbone.Collection) {
            obj[keypath] = value;
        }
        else if (obj instanceof Backbone.Model) {
            obj.set(keypath, value);
        }
    }
};

tinybind.formatters.log = obj => {
    console.log('💁', obj); // eslint-disable-line no-console
};
tinybind.formatters.string = (string, replacements) => {
    return ConfigurationHelper.getString(string, replacements);
};
tinybind.formatters.date = (l, format = DateTime.DATE_FULL) => {
    return l && l instanceof DateTime ? l.toLocaleString(format) : '';
};
tinybind.formatters.time = (l, format = DateTime.TIME_SIMPLE) => {
    return l && l instanceof DateTime ? l.toLocaleString(format) : '';
};
tinybind.formatters.datetime = (l, format = DateTime.DATETIME_SHORT) => {
    if(l instanceof DateTime) {
        return l.toLocaleString(format);
    }
    else if(typeof l === 'string') {
        return DateTime.fromISO(l).toLocaleString(format);
    }

    return '';
};
tinybind.formatters.currency = v => {
    return !isNaN(v) && isFinite(v) ? AutoNumeric.format(v / 100, ConfigurationHelper.getAutoNumericCurrencyConfig()) : '';
};
tinybind.formatters.percentage = v => {
    return !isNaN(v) && isFinite(v) ? AutoNumeric.format(v, ConfigurationHelper.getAutoNumericPercentageConfig()) : '';
};
tinybind.formatters.append = (a, b) => {
    return String(a || '') + String(b || '');
};
tinybind.formatters.prepend = (a, b) => {
    return String(b || '') + String(a || '');
};
tinybind.formatters.fallback = (a, b) => {
    return String(a || '') || String(b || '');
};

tinybind.binders['style-*'] = function (el, value) {
    el.style.setProperty(this.args[0], value);
};

tinybind.binders.required = function (el, value) {
    el.required = !!value;
};

tinybind.binders['currency-value'] = {
    routine: function (el, value) {
        if (this.autonumeric && value !== this.autonumeric.getNumber() * 100) {
            this.autonumeric.set((value || 0) / 100);
        }
    },
    getValue: function () {
        return Math.round(
            this.autonumeric.getNumber() * 100
        );
    },
    bind: function (el) {
        this.autonumeric = new AutoNumeric(el, ConfigurationHelper.getAutoNumericCurrencyConfig());

        if (!this.callback) {
            this.callback = () => {
                this.publish();
            }
        }

        el.addEventListener('input', this.callback);
    },
    unbind: function (el) {
        el.removeEventListener(this.event, this.callback);

        try {
            this.autonumeric.remove();
        }
        catch(err) {
            // ignore this
        }
    }
};

tinybind.binders['datetime-value'] = {
    routine: function (el, value) {
        const iso = DateTime.fromISO(value);
        const datetime = value ? iso.minus({seconds: iso.second}).toISO().split('.')[0] : null;
        if(datetime !== el.value) {
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
            }
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
class TemplateHelper {

    /**
     * Renders the given template in the given
     * view with tinybind.js
     *
     * @param {object} options
     * @param {View} options.view
     * @param {string} options.template
     * @param {object} [options.data]
     */
    static render (options) {
        if (!(options.view instanceof View)) {
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

        const tinybindView = tinybind.bind(options.view.el, data);
        options.view.on('remove', () => {
            tinybindView.unbind();
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
        return AutoNumeric.format(value, config || ConfigurationHelper.getAutoNumericCurrencyConfig());
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
}

module.exports = TemplateHelper;
