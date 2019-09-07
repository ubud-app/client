'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import DocumentSettingsAccountTemplate from '../../templates/documentSettingsAccount.html';
import AccountCollection from '../collections/account';


/**
 * DocumentSettingsAccountView
 *
 * @module views/documentSettingsAccount
 * @class DocumentSettingsAccountView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsAccountView = BaseView.extend({
    className: 'document-settings-account',

    async render () {
        this.model = this.model || AppHelper.getDocument(true);
        if (!this.model) {
            return;
        }

        this.live(this.model);
        this.data = {
            document: this.model,
            accounts: [],
            meta: {
                loading: true,
                empty: true,
                addUrl: '#' + this.model.id + '/settings/accounts/add'
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsAccountTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsAccount.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        this.accounts = new AccountCollection();
        this.accounts.filterBy('document', this.model.id);
        this.live(this.accounts);

        this.listenTo(this.accounts, 'add', this.addAccount);
        this.listenTo(this.accounts, 'remove', this.removeAccount);
        this.accounts.each(this.addAccount);

        this.listenTo(this.model, 'sync cache', this.updateLoader);
        this.listenToAndCall(this.accounts, 'sync cache', this.updateLoader);

        return this;
    },

    updateLoader () {
        this.data.meta.loading = !this.model.isSynced() || !this.accounts.isSynced();
    },

    addAccount (account) {
        const json = {
            id: account.id,
            url: '#' + this.model.id + '/settings/accounts/' + account.id
        };

        this.listenToAndCall(account, 'change:balance change:name change:type change:pluginId', () => {
            json.balance = account.get('balance');
            json.name = account.get('name');

            json.meta = ConfigurationHelper.getString('account.type.' + account.get('type'));
            if (account.get('pluginId')) {
                json.meta += ConfigurationHelper.getString('documentSettingsAccount.synced');
            }
        });

        this.data.accounts.push(json);
        this.data.meta.empty = false;
    },
    removeAccount (account) {
        const i = this.accounts.findIndex(a => a.id === account.id);
        if (i === -1) {
            return this;
        }

        this.accounts.splice(i, 1);
        this.data.meta.empty = !this.account.length;
    }
});

export default DocumentSettingsAccountView;
