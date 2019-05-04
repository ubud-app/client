'use strict';

const View = require('./_');
const AppHelper = require('../helpers/app');
const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const LoginTemplate = require('../../templates/login.html');

/**
 * @module views/login
 * @class LoginView
 * @augments View
 */
const LoginView = View.extend({
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
            }
        };

        this.listenToAndCall(DataHelper, 'socket:state', () => {
            this.data.meta.disabled = DataHelper.state() !== 'connected';
        });

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
            password: this.data.form.password
        }).catch(() => {
            this.error();
        });
    },

    error () {
        this.data.meta.error = true;
        this.data.meta.disabled = false;

        setTimeout(() => {
            this.data.meta.error = false;
        }, 1000);
    }
});

module.exports = LoginView;
