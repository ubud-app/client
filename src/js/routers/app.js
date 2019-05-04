'use strict';

const Backbone = require('backbone');
const _ = require('underscore');
const AppView = require('../views/app');
const StoreHelper = require('../helpers/store');

/**
 * @module routers/app
 * @class AppRouter
 * @augments Backbone.Router
 * @author Sebastian Pekarek
 */
module.exports = Backbone.Router.extend({
    routes: {
        'admin': 'adminRedirect',
        'admin/': 'adminDashboard',
        'admin/updates': 'adminUpdates',
        'admin/users': 'adminUsers',
        'admin/plugins': 'adminPlugins',
        'admin/backups': 'adminBackups',

        'account/devices': 'accountDevices',
        'account/authentication': 'accountAuthentication',
        'logout': 'logout',

        '': 'documentRedirect',
        ':document': 'sectionRedirect',
        ':document/': 'sectionRedirect',
        ':document/budget': 'budget',
        ':document/transactions': 'transactions',
        ':document/reports': 'reports',

        ':document/settings': 'documentSettings',
        ':document/settings/general': 'documentGeneralSettings',
        ':document/settings/accounts': 'documentAccountSettings',
        ':document/settings/accounts/:account': 'documentAccountDetailSettings',
        ':document/settings/plugins': 'documentPluginSettings',
        ':document/settings/permissions': 'documentPermissionSettings',
        ':document/settings/notifications': 'documentNotificationSettings',

        // Error 404
        '*path': 'notFound'
    },


    initialize ({AppHelper}) {
        Object.keys(this)
            .filter(k => _.isFunction(this[k]))
            .forEach(k => {
                _.bindAll(this, k);
            });

        this.on('route', () => {
            const parts = location.hash.substr(1).split('/');
            if(parts.length >= 2 && AppHelper.getDocumentId()) {
                StoreHelper.set('recent', [parts[0], parts[1]]);
            }
        });

        this.view = new AppView();
        this.view.render();
    },


    notFound () {
        this.documentRedirect();
    },


    async documentRedirect () {
        const recent = StoreHelper.get('recent');
        if(recent) {
            this.navigate(recent.join('/'), {trigger: true});
            return;
        }

        const DataHelper = require('../helpers/data');
        const documents = DataHelper.getDocuments();
        if(!documents.length) {
            await document.wait();
        }

        if(documents.length >= 1) {
            this.navigate(documents.first().id + '/budget', {trigger: true});
            return;
        }

        location.reload();
    },
    sectionRedirect (documentId) {
        const recent = StoreHelper.get('recent');
        if(recent) {
            this.navigate(documentId + '/' + recent[1], {trigger: true});
        } else {
            this.navigate(documentId + '/budget', {trigger: true});
        }
    },

    budget (documentId) {
        const BudgetView = require('../views/budget');
        this.view.renderView(new BudgetView({
            documentId
        }));
    },
    transactions (documentId) {
        const TransactionsView = require('../views/transactions');
        this.view.renderView(new TransactionsView({
            documentId
        }));
    },
    reports (documentId) {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'paper-plane',
            text: `Document ${documentId.substr(0, 8)}: Reports`
        }));
    },

    documentSettings (documentId) {
        const DocumentSettingsView = require('../views/documentSettings');
        this.view.renderView(new DocumentSettingsView({
            documentId
        }));
    },
    documentGeneralSettings (documentId) {
        const DocumentSettingsGeneralView = require('../views/documentSettingsGeneral');
        this.view.renderView(new DocumentSettingsGeneralView({
            documentId
        }));
    },
    documentAccountSettings (documentId) {
        const DocumentSettingsAccountView = require('../views/documentSettingsAccount');
        this.view.renderView(new DocumentSettingsAccountView({
            documentId
        }));
    },
    documentAccountDetailSettings (documentId, accountId) {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: `Document ${documentId.substr(0, 8)}: Account Settings of ${accountId.substr(0, 8)}`
        }));
    },
    documentPluginSettings (documentId) {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: `Document ${documentId.substr(0, 8)}: PluginSettings`
        }));
    },
    documentPermissionSettings (documentId) {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: `Document ${documentId.substr(0, 8)}: PermissionSettings`
        }));
    },
    documentNotificationSettings (documentId) {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: `Document ${documentId.substr(0, 8)}: NotificationSettings`
        }));
    },

    adminRedirect () {
        this.navigate('admin/', {trigger: true});
    },
    adminDashboard () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Dashboard'
        }));
    },
    adminUpdates () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Updates'
        }));
    },
    adminUsers () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Users'
        }));
    },
    adminPlugins () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Plugins'
        }));
    },
    adminBackups () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Backups'
        }));
    },

    accountDevices () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: 'Account Devices'
        }));
    },
    accountAuthentication () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: 'Account Authentication'
        }));
    },
    logout () {
        const PlaceHolderView = require('../views/placeholder');
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: 'Logout'
        }));
    },
});
