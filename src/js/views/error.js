'use strict';

const View = require('./_');
const $ = require('zepto');
const Sentry = require('@sentry/browser');

const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');
const ErrorTemplate = require('../../templates/error.html');


/**
 * ErrorView
 *
 * @module views/Error
 * @class ErrorView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    tagName: 'div',
    className: 'error',
    events: {
        click: 'closeHandler'
    },

    _initialize (options = {}) {
        this.headline = options.headline || ConfigurationHelper.getString('error.default.headline');
        this.message = options.message || ConfigurationHelper.getString('error.default.message');
        this.error = options.error;
    },

    render () {
        this.data = {
            error: {
                headline: this.headline,
                message: this.message,
                stacktrace: this.error && this.error.stack ? this.error.stack : null,
                reference: ''
            }
        };

        TemplateHelper.render({
            view: this,
            template: ErrorTemplate,
            data: this.data
        });

        Sentry.captureException(this.error);
        this.data.error.reference = Sentry.lastEventId();

        return this;
    },

    closeHandler (e) {
        if ($(e.target).is('.error') || $(e.target).is('.error__wrap')) {
            this.remove();
        }
    }
});
