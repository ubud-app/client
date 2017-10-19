'use strict';

import {extend} from 'underscore';
import Handlebars from 'hbsfy/runtime';
import translate from 'counterpart';
import Raven from 'raven-js';
import moment from 'moment';
import numbro from 'numbro';

export default class StringHelper {
	static string (key, _options) {
		return translate(key, extend({
			scope: 'dwimm'
		}, _options));
	}

	static number (document, amount) {

	}

	static currency (document, amount) {
		return numbro(
			amount / Math.pow(10, parseInt(document.get('settings').currencyDecimalPlaces || 2, 10))
		).formatForeignCurrency(
			document.get('settings').currencySymbol || '$',
			document.get('settings').currencyFormat || '0,0[.]00'
		);
	}

	static percentage () {

	}
}

Handlebars.registerHelper('string', StringHelper.string);
Handlebars.registerHelper('number', StringHelper.formatNumber);
Handlebars.registerHelper('currency', StringHelper.formatCurrency);
Handlebars.registerHelper('percentage', StringHelper.formatPercentage);

const lang = window.navigator.userLanguage || window.navigator.language;

translate.registerTranslations('de', require('../../strings/de.json'));
translate.registerTranslations('en', require('../../strings/en.json'));

require('moment/locale/de');

moment.locale(lang);
translate.setLocale(lang);

translate.onTranslationNotFound(function(locale, key) {
	const err = new Error('StringHelper: Key `' + key + '` not found in locale `' + locale + '`!');
	console.warn(err.toString());
	Raven.captureException(err);
});
translate.onError(function(err) {
	console.error(err);
	Raven.captureException(err);
});