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


        // Accounts
        new DocumentSettingsAccountsView({model: this.model}).appendTo(this, '.document-settings_accounts');


        // Plugins
        new DocumentSettingsPluginsView({model: this.model}).appendTo(this, '.document-settings_plugins');


        // Users
        new DocumentSettingsUsersView({model: this.model}).appendTo(this, '.document-settings_users');

        const me = await DataHelper.getUser().live(this).wait();
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
