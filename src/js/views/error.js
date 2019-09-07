'use strict';

import BaseView from './_';
import $ from 'zepto';
import * as Sentry from '@sentry/browser';

import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';
import ErrorTemplate from '../../templates/error.html';


/**
 * ErrorView
 *
 * @module views/Error
 * @class ErrorView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const ErrorView = BaseView.extend({
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
                error: String(this.error),
                stacktrace: this.error && this.error.stack ? this.error.stack.substr(0) : null,
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

        console.log('---------');                                               // eslint-disable-line no-console
        console.log('Got Error via ErrorView:');                                // eslint-disable-line no-console
        console.log(this.error);                                                // eslint-disable-line no-console
        console.log('Sentry Reference:', this.data.error.reference.toString()); // eslint-disable-line no-console
        console.log('---------');                                               // eslint-disable-line no-console

        return this;
    },

    closeHandler (e) {
        if ($(e.target).is('.error') || $(e.target).is('.error__wrap')) {
            this.remove();
        }
    }
});

export default ErrorView;
