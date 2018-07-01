'use strict';

import {extend} from 'underscore';
import Handlebars from 'hbsfy/runtime';
import translate from 'counterpart';
import Raven from 'raven-js';
import moment from 'moment';
import numbro from 'numbro';

export default class StringHelper {
    static string(key, _options) {
        return translate(key, extend({
            scope: 'dwimm'
        }, _options));
    }

    static currency(document, amount) {
        if (document.get('settings').language) {
            numbro.setLanguage(document.get('settings').language);
        }

        const precision = parseInt(document.get('settings').currencyPrecision, 10) || 2;
        return numbro(
            amount / Math.pow(10, precision)
        ).formatCurrency('0,0[.]' + Array(precision + 1).join('0'));
    }

    static parseCurrency(document, text) {
        if (document.get('settings').language) {
            numbro.setLanguage(document.get('settings').language);
        }

        const precision = parseInt(document.get('settings').currencyPrecision, 10) || 2;
        return Math.round(numbro.unformat(text) * Math.pow(10, precision));
    }

    static percentage(p) {
        return numbro(p).format('0.0%');
    }
}

Handlebars.registerHelper('string', StringHelper.string);
Handlebars.registerHelper('number', StringHelper.formatNumber);
Handlebars.registerHelper('currency', StringHelper.formatCurrency);
Handlebars.registerHelper('percentage', StringHelper.formatPercentage);


// Load Languages
const lang = window.navigator.userLanguage || window.navigator.language;
const supportedLanguages = [
    ['de', require('../../strings/de.json'), require('moment/locale/de')],
    ['en', require('../../strings/en.json'), require('moment/locale/en-gb')]
];

// Register Languages
supportedLanguages.forEach(([language, strings]) => {
    translate.registerTranslations(language, strings);
});

// Load numbro formatters
[
    require('numbro/dist/languages/de-DE.min'),
    require('numbro/dist/languages/en-GB.min'),
    require('numbro/dist/languages/ru-RU.min'),
    require('numbro/dist/languages/fr-FR.min'),
    require('numbro/dist/languages/it-IT.min'),
    require('numbro/dist/languages/es-ES.min')
].forEach(def => numbro.registerLanguage(def));


// Set Language: Moment
moment.locale(lang);

// Set Language: Counterpart
const languageCode = lang.split('-')[0];
if(supportedLanguages.find(([lang]) => languageCode === lang.split('-')[0])) {
    translate.setLocale(languageCode);
}else{
    translate.setLocale('en');
}


translate.onTranslationNotFound(function (locale, key) {
    const err = new Error('StringHelper: Key `' + key + '` not found in locale `' + locale + '`!');
    console.log('StringHelper: Translation not found (' + err.toString() + ')');
    Raven.captureException(err);
});
translate.onError(function (err) {
    console.log(err);
    Raven.captureException(err);
});