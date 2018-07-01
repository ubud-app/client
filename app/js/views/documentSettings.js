'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';
import DocumentSettingsTemplate from '../../templates/documentSettings.handlebars';
import DocumentSettingsAccountsView from './documentSettingsAccounts';
import DocumentSettingsPluginsView from './documentSettingsPlugins';
import DocumentSettingsUsersView from './documentSettingsUsers';

/**
 * @module views/documentSettings
 * @class DocumentSettingsView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'document-settings app_layout--page',
    events: {
        'click .document-settings_destroy': 'destroyDocument'
    },

    documentId: null,

    _initialize(options) {
        this.documentId = options.documentId;
    },

    async render() {
        AppHelper.title('documentSettings.title');

        const documents = await DataHelper.getDocuments().wait();
        this.model = documents.get(this.documentId);
        if (!this.model) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        this.model.live(this);
        this.$el.html(DocumentSettingsTemplate({document: this.model.toJSON()}));


        // Document Name
        const $name = this.$el.find('.document-settings_input--name');
        this.listenToAndCall(this.model, 'change:name', () => {
            $name.val(this.model.get('name'));
        });
        $name.change(() => {
            this.model.save({
                name: $name.val()
            });
        });

        // Document Region
        const $region = this.$el.find('.document-settings_input--region');
        this.listenToAndCall(this.model, 'change:settings', () => {
            $region.val(this.model.get('settings').language);
        });
        $region.change(() => {
            const settings = Object.assign(this.model.get('settings'), {
                language: $region.val()
            });
            this.model.save({settings});
        });


        // Accounts
        new DocumentSettingsAccountsView({model: this.model}).appendTo(this, '.document-settings_accounts');


        // Plugins
        let plugins;
        const me = await DataHelper.getUser().live(this).wait();
        const $pluginsWrap = this.$('.document-settings_plugins-wrap');
        this.listenToAndCall(me, 'change:isAdmin', () => {
            $pluginsWrap.toggleClass('document-settings_plugins-wrap--hidden', !me.get('isAdmin'));

            if(me.get('isAdmin') && !plugins) {
                plugins = new DocumentSettingsPluginsView({model: this.model})
                    .appendTo(this, '.document-settings_plugins');
            }
            else if(!me.get('isAdmin') && plugins) {
                plugins.remove();
                plugins = null;
            }
        });


        // Users
        new DocumentSettingsUsersView({model: this.model}).appendTo(this, '.document-settings_users');

        const $usersWrap = this.$('.document-settings_users-wrap');
        this.listenToAndCall(me, 'change:isAdmin', () => {
            $usersWrap.toggleClass('document-settings_users-wrap--hidden', !me.get('isAdmin'));
        });


        // Destroy
        this.listenToOnce(this.model, 'destroy', function () {
            AppHelper.navigate('/', {trigger: true, replace: true});
        });
    },

    destroyDocument() {
        if (!confirm(StringHelper.string('documentSettings.dangerous.destroy.confirm'))) {
            return;
        }

        this.model.destroy();
    }
});
