'use strict';


const config = window.__AppConfiguration;
if (!config) {
    throw new Error('Unable to start: no configuration given!');
}

const {Settings} = require('luxon');
Settings.defaultLocale = config.language;


/**
 * @module helpers/configuration
 * @class ConfigurationHelper
 * @author Sebastian Pekarek
 */
module.exports = class ConfigurationHelper {
    static getRootPath () {
        return '/' + config.language + '/';
    }

    static getBuildId () {
        return config.version.build;
    }

    static getVersion () {
        return config.version.name;
    }

    static getBuildCommit () {
        return config.version.commit;
    }

    static getBuildEnvironment () {
        return config.version.environment;
    }

    static getCurrentLanguage () {
        return config.language;
    }

    static getOtherLanguages () {
        return config.otherLanguages;
    }

    static getStrings () {
        return config.strings;
    }

    static getString (key, replacements) {
        let string = this.getRawString(key);
        Object.entries(replacements || {}).forEach(([key, value]) => {
            string = string.replace('{{' + key + '}}', value);
        });

        return string;
    }
    static getRawString (key) {
        if(config.strings[key]) {
            return config.strings[key];
        }

        let nested = this._getRawNestedString(config.strings, key.split('.'));
        if(nested) {
            return nested;
        }

        return `{${key}}`;
    }

    static _getRawNestedString (config, paths) {
        const child = config[paths.shift()];

        if(!paths.length) {
            return child;
        }
        else if(typeof child === 'object' && paths.length) {
            return this._getRawNestedString(child, paths);
        }
        else {
            return null;
        }
    }

    static getSentryDSN () {
        return config.sentry.dsn;
    }

    static getEndpoint () {
        return config.endpoint;
    }

    static getAutoNumericCurrencyConfig () {
        const DataHelper = require('./data');
        const AppHelper = require('./app');
        const document = DataHelper.getDocuments().get(AppHelper.getDocumentId()) || null;

        if(document && document.get('settings') && document.get('settings').currency) {
            return document.get('settings').currency;
        }

        return 'euro';
    }

    static getAutoNumericPercentageConfig () {
        return this.getString('autoNumeric.percentage');
    }
};
