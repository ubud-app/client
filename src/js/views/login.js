'use strict';

import BaseView from './_';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import LoginTemplate from '../../templates/login.html';
import ConfigurationHelper from '../helpers/configuration';

/**
 * @module views/login
 * @class LoginView
 * @augments BaseView
 */
const LoginView = BaseView.extend({
    className: 'login',

    render () {
        LoginView._instance = this;
        this.data = {
            meta: {
                icons: this.getIconHTML(),
                year: new Date().getFullYear(),
                disabled: true
            },
            form: {
                username: '',
                password: ''
            },
            terms: {
                rendered: false,
                visible: false,
                checked: false,
                content: '',
                version: null
            }
        };

        this.listenToAndCall(DataHelper, 'socket:state', this.updateDisabledState);

        TemplateHelper.render({
            view: this,
            template: LoginTemplate,
            data: this.data
        });

        this.$('.login_form-input--email').focus();

        this.once('remove', () => {
            LoginView._instance = null;
        });
        this.listenToOnce(DataHelper, 'auth:loggedIn', () => {
            this.remove();
        });
    },

    /**
     * Checks, if it's required to show the LoginView right now.
     * Resolves, when we have a valid session. Should not reject
     * in any case but fatal errors.
     *
     * @returns {Promise}
     */
    async check () {
        if (DataHelper.isLoggedIn()) {
            this.handleLogout();
            return;
        }

        if (!LoginView._instance) {
            this.appendTo(AppHelper.view());
        }

        // resolve promise on login
        return new Promise(resolve => {
            this.listenToOnce(DataHelper, 'auth:loggedIn', () => {
                this.handleLogout();
                resolve();
            });
        });
    },

    /**
     * Listens for logout events and views
     * the login view when required
     *
     * @returns {*}
     */
    handleLogout () {
        DataHelper.on('auth:loggedOut', () => {
            this.appendTo(AppHelper.view());
        });
    },

    /**
     * Returns some HTML to render random icons. Required
     * for the background icons…
     *
     * @returns {String}
     */
    getIconHTML () {
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
    submit (e) {
        e.preventDefault();

        this.data.meta.disabled = true;

        if (!this.data.form.username || !this.data.form.username) {
            this.error();
            return;
        }

        DataHelper.login({
            email: this.data.form.username,
            password: this.data.form.password,
            acceptedTerms: this.data.terms.checked ? this.data.terms.version : null
        }).catch((error) => {
            if(error && error.attributes && error.attributes.acceptedTerms) {
                this.data.terms.visible = true;
                this.data.terms.content = ConfigurationHelper.getString('login.terms.content', {
                    tos: error.extra.tos.defaultUrl,
                    privacy: error.extra.privacy.defaultUrl
                });

                this.updateDisabledState();
                this.data.terms.version = error.extra.version;
                return;
            }

            this.error();
        });
    },

    updateDisabledState () {
        this.data.meta.disabled = DataHelper.state() !== 'connected' || (this.data.terms.visible && !this.data.terms.checked);
    },

    error () {
        this.data.meta.error = true;
        this.data.meta.disabled = false;

        setTimeout(() => {
            this.data.meta.error = false;
        }, 1000);
    }
});

export default LoginView;
