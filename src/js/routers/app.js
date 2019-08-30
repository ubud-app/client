'use strict';

import Backbone from 'backbone';
import _ from 'underscore';
import AppView from '../views/app';
import StoreHelper from '../helpers/store';
import DataHelper from '../helpers/data';

import BudgetView from '../views/budget';
import DocumentSettingsAccountAddManualView from '../views/documentSettingsAccountAddManual';
import DocumentSettingsAccountAddView from '../views/documentSettingsAccountAddManual';
import DocumentSettingsAccountDetailsView from '../views/documentSettingsAccountDetails';
import DocumentSettingsAccountView from '../views/documentSettingsAccount';
import DocumentSettingsGeneralView from '../views/documentSettingsGeneral';
import DocumentSettingsPermissionsView from '../views/documentSettingsPermissions';
import DocumentSettingsPluginAddDetailsView from '../views/documentSettingsPluginAddDetails';
import DocumentSettingsPluginAddSetupView from '../views/documentSettingsPluginAddSetup';
import DocumentSettingsPluginAddView from '../views/documentSettingsPluginAdd';
import DocumentSettingsPluginDetailsView from '../views/documentSettingsPluginDetails';
import DocumentSettingsPluginView from '../views/documentSettingsPlugin';
import DocumentSettingsView from '../views/documentSettings';
import ErrorView from '../views/error';
import PlaceHolderView from '../views/placeholder';
import TransactionsView from '../views/transactions';
import PluginModel from '../models/plugin';
import PluginInstanceModel from '../models/pluginInstance';


/**
 * @module routers/app
 * @class AppRouter
 * @augments Backbone.Router
 * @author Sebastian Pekarek
 */
const AppRouter = Backbone.Router.extend({
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

        ':document/settings/accounts/add': 'documentAccountSettingsAdd',
        ':document/settings/accounts/add/current(?q=:q)': 'documentAccountSettingsAddCurrent',
        ':document/settings/accounts/add/cash': 'documentAccountSettingsAddCash',
        ':document/settings/accounts/add/other': 'documentAccountSettingsAddOther',

        ':document/settings/accounts/:account': 'documentAccountDetailSettings',
        ':document/settings/plugins': 'documentPluginSettings',
        ':document/settings/plugins/add(?q=:q)': 'documentPluginSettingsAdd',
        ':document/settings/plugins/add/*id': 'documentPluginSettingsAddDetails',
        ':document/settings/plugins/:id': 'documentPluginDetailSettings',
        ':document/settings/plugins/:id/setup': 'documentPluginSettingsAddConfig',
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
            if (parts.length >= 2 && AppHelper.getDocumentId()) {
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
        const documents = DataHelper.getDocuments();
        if (!documents.length) {
            await document.wait();
        }

        const recent = StoreHelper.get('recent');
        if (recent && documents.get(recent[0])) {
            this.navigate(recent.join('/'), {trigger: true});
            return;
        }

        if (documents.length >= 1) {
            this.navigate(documents.first().id + '/budget', {trigger: true});
            return;
        }

        location.reload();
    },
    sectionRedirect (documentId) {
        const recent = StoreHelper.get('recent');
        if (recent) {
            this.navigate(documentId + '/' + recent[1], {trigger: true});
        }
        else {
            this.navigate(documentId + '/budget', {trigger: true});
        }
    },

    budget (documentId) {
        this.view.renderView(new BudgetView({
            documentId
        }));
    },
    transactions (documentId) {
        this.view.renderView(new TransactionsView({
            documentId
        }));
    },
    reports (documentId) {
        this.view.renderView(new PlaceHolderView({
            icon: 'paper-plane',
            text: `Document ${documentId.substr(0, 8)}: Reports`
        }));
    },

    documentSettings (documentId) {
        this.view.renderView(new DocumentSettingsView({
            documentId
        }));
    },
    documentGeneralSettings () {
        this.view.renderView(new DocumentSettingsGeneralView());
    },
    documentAccountSettings () {
        this.view.renderView(new DocumentSettingsAccountView());
    },
    documentAccountDetailSettings (documentId, accountId) {
        this.view.renderView(new DocumentSettingsAccountDetailsView({
            documentId,
            accountId
        }));
    },
    documentAccountSettingsAdd () {
        this.view.renderView(new DocumentSettingsAccountAddView());
    },
    documentAccountSettingsAddCash () {
        this.view.renderView(new DocumentSettingsAccountAddManualView({
            type: 'cash'
        }));
    },
    documentAccountSettingsAddOther () {
        this.view.renderView(new DocumentSettingsAccountAddView({
            type: 'other'
        }));
    },
    documentAccountSettingsAddCurrent (documentId, q) {
        this.view.renderView(new DocumentSettingsPluginAddView({type: 'account', q}));
    },

    documentPluginSettings (documentId) {
        this.view.renderView(new DocumentSettingsPluginView({
            documentId
        }));
    },
    documentPluginDetailSettings (documentId, pluginId) {
        this.view.renderView(new DocumentSettingsPluginDetailsView({
            documentId,
            pluginId
        }));
    },
    documentPluginSettingsAdd (documentId, q) {
        this.view.renderView(new DocumentSettingsPluginAddView({q}));
    },
    documentPluginSettingsAddDetails (documentId, pluginId) {
        this.view.renderView(new DocumentSettingsPluginAddDetailsView({
            model: new PluginModel({id: pluginId})
        }));
    },
    documentPluginSettingsAddConfig (documentId, pluginId) {
        this.view.renderView(new DocumentSettingsPluginAddSetupView({
            model: new PluginInstanceModel({id: pluginId})
        }));
    },

    documentPermissionSettings (documentId) {
        this.view.renderView(new DocumentSettingsPermissionsView({
            documentId
        }));
    },
    documentNotificationSettings (documentId) {
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: `Document ${documentId.substr(0, 8)}: NotificationSettings`
        }));
    },

    adminRedirect () {
        this.navigate('admin/', {trigger: true});
    },
    adminDashboard () {
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Dashboard'
        }));
    },
    adminUpdates () {
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Updates'
        }));
    },
    adminUsers () {
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Users'
        }));
    },
    adminPlugins () {
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Plugins'
        }));
    },
    adminBackups () {
        this.view.renderView(new PlaceHolderView({
            icon: 'database',
            text: 'Admin Backups'
        }));
    },

    accountDevices () {
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: 'Account Devices'
        }));
    },
    accountAuthentication () {
        this.view.renderView(new PlaceHolderView({
            icon: 'cog',
            text: 'Account Authentication'
        }));
    },
    logout () {
        DataHelper.logout()
            .then(() => {
                this.navigate('');
                StoreHelper.reset();
                location.reload();
            })
            .catch(error => {
                new ErrorView({error}).appendTo(this.view);
            });
    }
});

export default AppRouter;
