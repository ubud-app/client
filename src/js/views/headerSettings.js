'use strict';

const $ = require('jquery');
const View = require('./_');
const gravatar = require('gravatar-url');

const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const HeaderSettingsTemplate = require('../../templates/headerSettings.html');


/**
 * HeaderSettingsView
 *
 * @module views/headerSettings
 * @class HeaderSettingsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'header-settings header-settings--hidden',
    events: {
        'click': 'closeHandler'
    },

    _initialize(options = {}) {
        this.avatarUrl = options.avatarUrl;
    },

    render () {
        this.data = {
            avatar: {
                url: this.avatarUrl,
                hidden: true
            },
            budget: {
                disabled: true,
                hidden: true,
                name: '',
                url: {
                    general: '#',
                    accounts: '#',
                    plugins: '#',
                    permissions: '#',
                    notifications: '#'
                }
            },
            admin: {
                hidden: true
            },
            user: {
                hidden: true
            },
            version: {
                name: ConfigurationHelper.getVersion(),
                build: ConfigurationHelper.getBuildId()
            }
        };

        const user = DataHelper.getUser();
        this.live(user);

        this.listenToAndCall(user, 'change:isAdmin', () => {
            this.$el.toggleClass('header-settings--noadmin', !user.get('isAdmin'));
        });
        if(this.data.avatar.url) {
            this.listenToAndCall(user, 'change:email', () => {
                this.updateAvatar(user);
            });
        }

        const documents = DataHelper.getDocuments();
        documents.wait().then(() => {
            const documentId = location.hash.substr(1).split('/')[0];
            const document = documents.get(documentId);

            if(documentId && document) {
                this.data.budget.disabled = false;
                this.data.budget.name = document.get('name');
                Object.keys(this.data.budget.url).forEach(k => {
                    this.data.budget.url[k] = '#' + documentId + '/settings/' + k;
                });
            } else {
                this.data.budget.disabled = true;
                this.data.budget.name = ConfigurationHelper.getString('header.settings.document.noDocument');
                Object.keys(this.data.budget.url).forEach(k => {
                    this.data.budget.url[k] = '#';
                });
            }
        });

        TemplateHelper.render({
            view: this,
            template: HeaderSettingsTemplate,
            data: this.data
        });

        setTimeout(() => {
            this.$el.removeClass('header-settings--hidden');
        }, 0);

        setTimeout(() => {
            this.data.avatar.hidden = false;
        }, 50);
        setTimeout(() => {
            this.data.budget.hidden = false;
        }, 100);
        setTimeout(() => {
            this.data.admin.hidden = false;
        }, 150);
        setTimeout(() => {
            this.data.user.hidden = false;
        }, 200);

        const AppHelper = require('../helpers/app');
        this.listenToOnce(AppHelper.router(), 'route', () => {
            this.hide();
        });

        return this;
    },

    async hide () {
        this.trigger('hide');

        this.data.avatar.hidden = true;
        this.data.budget.hidden = true;
        this.data.admin.hidden = true;
        this.data.user.hidden = true;

        this.$el.addClass('header-settings--hidden');

        await new Promise(cb => setTimeout(cb, 300));
        this.remove();
    },

    closeHandler (e) {
        if ($(e.target).is('.header-settings') || $(e.target).is('.header-settings__content')) {
            this.hide();
        }
    },

    async updateAvatar (user) {
        if(!user.get('email')) {
            this.data.avatar.url = null;
            return;
        }

        const url = gravatar(user.get('email'), {
            size: (window.devicePixelRatio || 1) * 96
        });

        await new Promise(resolve => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
        });

        this.data.avatar.url = url;
    },

    versionClick () {
        location.reload();
    }
});
