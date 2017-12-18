'use strict';

import {Router as BackboneRouter} from 'backbone';
import * as _ from 'underscore';
import AppView from '../views/app';
import DataHelper from '../helpers/data';
import DashboardView from '../views/dashboard';
import BudgetsView from '../views/budgets';
import PlaceholderView from '../views/placeholder';
import DocumentSettingsView from '../views/documentSettings';
import DocumentAccountSettingsView from '../views/documentAccountSettings';
import AddAccountView from '../views/addAccount';
import AddAccountSearchBankView from '../views/addAccountSearchBank';
import DocumentPluginSettingsView from '../views/documentPluginSettings';
import TransactionsView from '../views/transactions';

export default BackboneRouter.extend({
    routes: {
        '': 'dashboard',
        ':document/budget': 'documentBudget',
        ':document/reports': 'documentReports',
        ':document/transactions': 'documentTransactions',
        ':document/settings': 'documentSettings',
        ':document/settings/accounts/new': 'addAccount',
        ':document/settings/accounts/new/bank': 'addAccountSearchBank',
        ':document/settings/accounts/new/cash': 'documentAccountSettingsCash',
        ':document/settings/accounts/new/other': 'documentAccountSettingsOther',
        ':document/settings/accounts/:accountId': 'documentAccountSettings',
        ':document/settings/plugins/:pluginId': 'documentPluginSettings',
        'settings': 'settings',
        'logout': 'logout',
        '*path': 'dashboard'
    },

    initialize() {
        const r = this;
        for (let i in r) {
            if (_.isFunction(r[i])) {
                _.bindAll(r, i);
            }
        }

        r.view = new AppView().render();
    },

    async dashboard() {
        const view = new DashboardView();
        this.view.renderView(view);
    },
    async documentBudget(documentId) {
        const view = new BudgetsView({documentId});
        this.view.renderView(view);
    },
    async documentReports() {
        const view = new PlaceholderView({view: 'reports'});
        this.view.renderView(view);
    },
    async documentTransactions(documentId) {
        const view = new TransactionsView({documentId});
        this.view.renderView(view);
    },
    async documentSettings(documentId) {
        const view = new DocumentSettingsView({documentId});
        this.view.renderView(view);
    },

    async documentAccountSettings(documentId, accountId) {
        const view = new DocumentAccountSettingsView({documentId, accountId});
        this.view.renderView(view);
    },
    async documentAccountSettingsCash(documentId) {
        const view = new DocumentAccountSettingsView({documentId, accountType: 'cash'});
        this.view.renderView(view);
    },
    async documentAccountSettingsOther(documentId) {
        const view = new DocumentAccountSettingsView({documentId, accountType: 'asset'});
        this.view.renderView(view);
    },
    async addAccount(documentId) {
        const view = new AddAccountView({documentId});
        this.view.renderView(view);
    },
    async addAccountSearchBank(documentId) {
        const view = new AddAccountSearchBankView({documentId});
        this.view.renderView(view);
    },

    async documentPluginSettings(documentId, pluginId) {
        const view = new DocumentPluginSettingsView({documentId, pluginId});
        this.view.renderView(view);
    },

    async settings() {
        const view = new PlaceholderView({view: 'settings'});
        this.view.renderView(view);
    },
    async logout() {
        this.navigate('');
        DataHelper.logout();
    }
});
