'use strict';

require('babel-core/register');
require('babel-polyfill');

import $ from 'jquery';
import BaseView from './_';
import DataHelper from '../helpers/data';
import LoginTemplate from '../../templates/login.handlebars';

/**
 * @module views/login
 * @class LoginView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'login',
    events: {
        'submit .login_form': 'submit'
    },

    render() {
        this.$el.html(LoginTemplate({
            icons: this.getIconHTML(),
            year: new Date().getFullYear()
        }));

        this.$('.login_form-input--email').focus();
    },

    /**
     * Checks, if it's required to show the LoginView right now.
     * Resolves, when we have a valid session. Should not reject
     * in any case but fatal errors.
     *
     * @returns {Promise}
     */
    async check(settings) {
        const loggedIn = await DataHelper.initialize(settings);
        if (loggedIn) {
            return Promise.resolve();
        }

        this.appendTo($('body'));

        // resolve promise on login
        return new Promise(resolve => {
            this.listenToOnce(DataHelper, 'auth:loggedIn', () => {
                this.remove();
                resolve();
            });
        });
    },

    /**
     * Returns some HTML to render random icons. Required
     * for the background icons…
     *
     * @returns {String}
     */
    getIconHTML() {
        let icons = [];
        let hex;

        for (let i = 0xe800; i <= 0xe820; i += 1) {
            hex = i.toString(16);
            icons.push('<span>&#x' + hex + ';</span>');
            icons.push('<span>&#x' + hex + ';</span>');
        }

        icons = icons.sort(() => (Math.random() - 0.5));
        icons.splice(43, icons.length - 43);

        return icons.join('');
    },

    /**
     * Runs the login procedure…
     *
     * @param {Event} e
     */
    submit: function (e) {
        e.preventDefault();

        const $submit = this.$('.login_submit');
        $submit.prop('disabled', true);

        const $email = this.$('.login_form-input--email');
        const email = $email.val();
        const $password = this.$('.login_form-input--password');
        const password = $password.val();
        if (!email || !password) {
            this.error();
            return;
        }

        DataHelper.login(email, password).catch(this.error);
    },

    error: function () {
        const $form = this.$('.login_form-box').addClass('login_form-box--error');
        this.$('.login_submit').prop('disabled', false);

        setTimeout(() => {
            $form.removeClass('login_form-box--error');
        }, 900);
    }
});
