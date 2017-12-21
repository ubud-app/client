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
            numbro.culture(document.get('settings').language);
        }

        const precision = parseInt(document.get('settings').currencyPrecision, 10) || 2;
        return numbro(
            amount / Math.pow(10, precision)
        ).formatCurrency('0,0[.]' + Array(precision + 1).join('0'));
    }

    static parseCurrency(document, text) {
        if (document.get('settings').language) {
            numbro.culture(document.get('settings').language);
        }

        const precision = parseInt(document.get('settings').currencyPrecision, 10) || 2;
        return Math.round(numbro().unformat(text) * Math.pow(10, precision));
    }

    static percentage(p) {
        return numbro(p).format('0.0%');
    }
}

Handlebars.registerHelper('string', StringHelper.string);
Handlebars.registerHelper('number', StringHelper.formatNumber);
Handlebars.registerHelper('currency', StringHelper.formatCurrency);
Handlebars.registerHelper('percentage', StringHelper.formatPercentage);

const lang = window.navigator.userLanguage || window.navigator.language;

translate.registerTranslations('de', require('../../strings/de.json'));
translate.registerTranslations('en', require('../../strings/de.json'));

numbro.culture('de-DE', require('numbro/dist/languages/de-DE.min'));
require('moment/locale/de');

moment.locale(lang);
translate.setLocale(lang);

translate.onTranslationNotFound(function (locale, key) {
    const err = new Error('StringHelper: Key `' + key + '` not found in locale `' + locale + '`!');
    console.log('StringHelper: Translation not found (' + err.toString() + ')');
    Raven.captureException(err);
});
translate.onError(function (err) {
    console.log(err);
    Raven.captureException(err);
});