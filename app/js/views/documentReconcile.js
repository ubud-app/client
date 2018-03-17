'use strict';

import $ from 'jquery';
import moment from 'moment';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';
import TransactionModel from '../models/transaction';
import DocumentReconcileTemplate from '../../templates/documentReconcile.handlebars';
import TransactionsEditorBudgetSelectView from './transactionsEditorBudgetSelect';
import TransactionCollection from '../collections/transaction';

/**
 * @module views/documentReconcile
 * @class DocumentReconcileView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'form',
    className: 'document-reconcile app_layout--page',
    events: {
        'change .document-reconcile_account-select': 'changeAccount',
        'keyup .document-reconcile_amount-input': 'amountType',
        'change .document-reconcile_adjustment-memo': 'memoChange',
        'submit': 'save'
    },

    documentId: null,
    reconciled: [],

    _initialize (options) {
        this.documentId = options.documentId;
    },

    async render () {
        AppHelper.title('documentReconcile.title');
        this.$el.html(DocumentReconcileTemplate());

        const documents = await DataHelper.getDocuments().wait();
        this.document = documents.get(this.documentId);
        if (!this.document) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        this.document.live(this);
        const [account, budgets, categories] = await Promise.all([
            this.document.getAccounts().live(this).wait(),
            this.document.getBudgets().live(this).wait(),
            this.document.getCategories().live(this).wait()
        ]);

        this.collection = account;

        this.myAccounts = this.collection.filter(a => !a.get('pluginInstanceId'));
        if (!this.myAccounts.length) {
            alert(StringHelper.string('documentReconcile.noAccounts'));
            AppHelper.navigate(this.document.id + '/budget', {trigger: true, replace: true});
            return this;
        }

        // Accounts
        this.$accounts = this.$('.document-reconcile_account-select');
        this.myAccounts.forEach(account => {
            $('<option />').text(account.get('name')).attr('value', account.id).appendTo(this.$accounts);
        });


        this.$wrap = this.$('.document-reconcile_wrap');
        this.$input = this.$('.document-reconcile_amount-input');
        this.$adjustment = this.$('.document-reconcile_adjustment');
        this.$text = this.$('.document-reconcile_adjustment-text');
        this.$memo = this.$('.document-reconcile_adjustment-memo');
        this.$save = this.$('.document-reconcile_save');

        this.budget = new TransactionsEditorBudgetSelectView({
            budgets,
            categories,
            transaction: new TransactionModel(),
            allowSplitSelection: false
        }).appendTo(this.$('.document-reconcile_adjustment-budget'));


        let updateSettings = false;
        let settings = this.document.get('settings');
        if (!settings.reconcileBudget || !budgets.get(settings.reconcileBudget)) {
            settings.reconcileBudget = budgets.first().id;
            updateSettings = true;
        }
        if (settings.reconcileMemo === undefined) {
            settings.reconcileMemo = StringHelper.string('documentReconcile.defaultMemo');
            updateSettings = true;
        }
        if (updateSettings) {
            this.document.save();
        }

        this.budget.value(settings.reconcileBudget);
        this.listenTo(this.budget, 'update', budgetId => {
            const settings = this.document.get('settings');
            settings.reconcileBudget = budgetId;
            this.document.save();
        });

        this.$memo.val(settings.reconcileMemo);

        this.renderForAccount(this.$accounts.val());
    },

    changeAccount (e) {
        this.renderForAccount($(e.target).val());
    },

    async renderForAccount (id) {
        this.$wrap.addClass('loading');
        this.$adjustment.addClass('document-reconcile_adjustment--hidden');
        this.$accounts.val(id);

        this.account = this.collection.get(id);
        await this.account.fetch();

        this.$input.val(StringHelper.currency(this.document, this.account.get('balance')));
        this.amountType();

        const nextAccount = this.myAccounts.find(account => {
            return this.reconciled.length > 0 && this.reconciled.indexOf(account.id) === -1 && account.id !== this.account.id;
        });
        if (nextAccount) {
            this.$save.text(StringHelper.string('documentReconcile.label.saveAndNext'));
        } else {
            this.$save.text(StringHelper.string('documentReconcile.label.save'));
        }

        this.$wrap.removeClass('loading');

        this.$input.select();
    },

    async amountType () {
        const amount = StringHelper.parseCurrency(this.document, this.$input.val());

        if (amount === this.account.get('balance')) {
            this.$adjustment.addClass('document-reconcile_adjustment--hidden');
            return;
        }


        // Text
        if (amount < this.account.get('balance')) {
            this.$text.text(StringHelper.string('documentReconcile.adjustment.text.negative', {
                amount: StringHelper.currency(this.document, amount - this.account.get('balance'))
            }));
        } else {
            this.$text.text(StringHelper.string('documentReconcile.adjustment.text.positive', {
                amount: StringHelper.currency(this.document, amount - this.account.get('balance'))
            }));
        }

        this.$adjustment.removeClass('document-reconcile_adjustment--hidden');
    },

    async memoChange () {
        const settings = this.document.get('settings');
        settings.reconcileMemo = this.$memo.val();
        await this.document.save();
    },

    async save (e) {
        e.preventDefault();
        this.$wrap.addClass('loading');

        // 1. get transaction which are in this account and normal
        const transactions = new TransactionCollection();
        transactions.id = 'account:' + this.account.id + '/status:normal';
        await transactions.wait();

        // 2. clear these transactions
        await Promise.all(transactions.map(t => t.save({status: 'cleared'})));

        // 3. refresh account balance
        await this.account.fetch();

        // 4. optional: create cleared adjustment transaction
        const amount = StringHelper.parseCurrency(this.document, this.$input.val());
        if (amount !== this.account.get('balance')) {
            const diff = amount - this.account.get('balance');
            await new TransactionModel({
                time: moment().toJSON(),
                amount: diff,
                accountId: this.account.id,
                memo: this.$memo.val(),
                units: [{
                    'budgetId': this.budget.value(),
                    'amount': diff
                }]
            }).save();
        }

        // 5. open next budget or redirect to budget
        this.reconciled.push(this.account.id);
        const unreconciled = this.myAccounts.find(a => this.reconciled.indexOf(a.id) === -1);
        if (unreconciled) {
            this.renderForAccount(unreconciled.id);
        } else {
            AppHelper.navigate(this.document.id + '/transactions', {trigger: true, replace: true});
        }
    }
});
