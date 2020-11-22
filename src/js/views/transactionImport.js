'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import TransactionImportTemplate from '../../templates/transactionTemplate.html';
import AccountCollection from '../collections/account';


/**
 * CategoryEditorView
 *
 * @module views/categoryEditor
 * @class CategoryEditorView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const CategoryEditorView = BaseView.extend({
    className: 'category-editor b-modal b-modal--hidden',

    _initialize (options = {}) {
        this.document = options.document || null;
        this.accounts = options.accounts || null;
        this.files = options.files || null;
    },

    render () {

        // Document
        this.document = this.document || AppHelper.getDocument(true);
        if (!this.document) {
            return;
        }

        this.data = {
            document: this.document,
            accounts: [],
            form: {
                accountId: null
            },
            hide: () => this.hide()
        };

        // Accounts
        this.accounts = this.accounts || new AccountCollection();
        this.accounts.filterBy('document', this.document.id);
        this.listenTo(this.accounts, 'add', this.addAccount);
        this.listenTo(this.accounts, 'remove', this.removeAccount);
        this.accounts.each(this.addAccount);
        this.live(this.accounts);

        this.listenToAndCall(this.accounts, 'add remove', () => {
            if (!this.data.form.accountId || !this.accounts.get(this.data.form.accountId)) {
                const firstMatch = this.accounts.find(a => !a.get('pluginInstanceId'));
                if(firstMatch && firstMatch.id) {
                    this.data.form.accountId = firstMatch.id;
                }
            }
        });

        TemplateHelper.render({
            view: this,
            template: TransactionImportTemplate,
            data: this.data
        });

        this.$files = this.$el.find('#transaction-import__input--file');
        if (this.files) {
            this.$files.get(0).files = this.files;
        }

        this.activateModal();
        return this;
    },

    addAccount (account) {
        if (!account.get('pluginInstanceId')) {
            this.data.accounts.push(account);

            if (!this.data.form.accountId) {
                this.data.form.accountId = account.id;
            }
        }
    },
    removeAccount (account) {
        const i = this.data.accounts.find(a => account.id === a.id);
        if (i > -1) {
            this.data.accounts.splice(i, 1);
        }

        if (this.data.form.accountId === account.id && this.data.accounts.length > 0) {
            this.data.form.accountId = this.data.accounts[0].id;
        }
        else if (this.data.form.accountId === account.id) {
            this.data.form.accountId = null;
        }
    },

    async submit (e) {
        e.preventDefault();
        if (!this.data.form.accountId) {
            return;
        }

        const files = this.$files.get(0).files;
        if (files.length > 1) {
            alert(ConfigurationHelper.getString('transactionImport.multipleFiles'));
        }
        if (files.length !== 1) {
            return;
        }

        this.$el.addClass('loading');

        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const response = await fetch(ConfigurationHelper.getEndpoint() + '/api/imports?account=' + this.data.form.accountId, {
                body: formData,
                method: 'post',
                headers: new Headers({
                    Authorization: 'Basic ' + btoa(
                        DataHelper.getSession().id + ':' + DataHelper.getSession().get('secret')
                    )
                })
            });

            this.$el.removeClass('loading');
            if(response.ok) {
                this.hide();
                return;
            }

            const json = await response.json();
            if(json && json.message && json.message.substr(0, 7) === 'Error: ') {
                alert(json.message.substr(7));
            }
            else if(json.message) {
                alert(json.message);
            }
            else {
                alert(await response.text());
            }
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
        }
        finally {
            this.$el.removeClass('loading');
        }
    }
});

export default CategoryEditorView;
