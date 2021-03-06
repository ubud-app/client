'use strict';

import $ from 'zepto';
import BaseView from './_';
import gravatar from 'js-gravatar';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import WorkerHelper from '../helpers/worker';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import HeaderSettingsTemplate from '../../templates/headerSettings.html';


/**
 * HeaderSettingsView
 *
 * @module views/headerSettings
 * @class HeaderSettingsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const HeaderSettingsView = BaseView.extend({
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
                hidden: true,
                address: location.host
            },
            user: {
                hidden: true,
                model: DataHelper.getUser()
            },
            version: {
                info: null,
                update: null
            }
        };

        const user = DataHelper.getUser();
        this.live(user);

        this.listenToAndCall(user, 'change:admin', () => {
            this.$el.toggleClass('header-settings--noadmin', !user.get('admin') || !user.get('admin').isAdmin);
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

        const components = DataHelper.getComponents();
        this.listenTo(WorkerHelper, 'updateAvailable', () => this.updateVersionStrings(components));
        this.listenToAndCall(components, 'add remove sync', () => this.updateVersionStrings(components));
        this.live(components);

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

        await new Promise(cb => {
            setTimeout(cb, 300);
        });
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

        const url = gravatar({
            email: user.get('email'),
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
    },

    updateVersionStrings (components) {
        const server = components.find(c => c.id === 'server');
        this.data.version.info = ConfigurationHelper.getString('header.version.info', {
            server: server && server.get('installed') ? server.get('installed') : '',
            client: ConfigurationHelper.getVersion()
        });

        if(server && server.get('updateAvailable')) {
            this.data.version.update = ConfigurationHelper.getString('header.version.server', {
                available: server.get('available')
            });
        }
        else if(WorkerHelper.isUpdateAvailable()) {
            this.data.version.update = ConfigurationHelper.getString('header.version.client');
        }
        else {
            this.data.version.update = null;
        }
    }
});

export default HeaderSettingsView;
