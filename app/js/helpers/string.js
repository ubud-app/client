'use strict';

import {extend} from 'underscore';
import Handlebars from 'hbsfy/runtime';
import translate from 'counterpart';
import Raven from 'raven-js';

export default class StringHelper {
	static string (key, _options) {
		return translate(key, extend({
			scope: 'dwimm'
		}, _options));
	}

	static formatNumber () {

	}

	static formatCurrency () {

	}

	static formatPercentage () {

	}
}

Handlebars.registerHelper('string', StringHelper.string);
Handlebars.registerHelper('number', StringHelper.formatNumber);
Handlebars.registerHelper('currency', StringHelper.formatCurrency);
Handlebars.registerHelper('percentage', StringHelper.formatPercentage);

translate.registerTranslations('de', require('../../strings/de.json'));
translate.registerTranslations('en', require('../../strings/en.json'));

translate.onTranslationNotFound(function(locale, key) {
	const err = new Error('StringHelper: Key `' + key + '` not found in locale `' + locale + '`!');
	console.warn(err.toString());
	Raven.captureException(err);
});
translate.onError(function(err) {
	console.error(err);
	Raven.captureException(err);
});