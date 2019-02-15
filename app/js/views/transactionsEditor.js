'use strict';

import $ from 'jquery';
import moment from 'moment';
import BaseView from './_';
import StringHelper from '../helpers/string';
import TransactionsEditorBudgetSelectView from './transactionsEditorBudgetSelect';
import TransactionsEditorPayeeSelectView from './transactionsEditorPayeeSelect';
import TransactionsEditorUnitsView from './transactionsEditorUnits';
import StoreHelper from '../helpers/store';

/**
 * @module views/transactionsEditor
 * @class TransactionsEditorView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'form',
    className: 'transactions-editor',
    events: {
        'submit': 'save',
        'reset': 'cancel'
    },

    _initialize(options) {
        this.document = options.document;
        this.accounts = options.accounts;
        this.budgets = options.budgets;
        this.categories = options.categories;
    },

    render() {
        const v = this;
        const $date = $('<input class="transactions-editor_date" tabindex="1" />').appendTo(v.$el);
        const $account = $('<span class="transactions-editor_account" />').appendTo(v.$el);
        const $accountSelect = $('<select class="transactions-editor_account-select" tabindex="2" />').appendTo($account);
        const $payee = $('<div class="transactions-editor_payee" />').appendTo(v.$el);
        const $budget = $('<span class="transactions-editor_budget" />').appendTo(v.$el);
        const $memo = $('<input class="transactions-editor_memo" tabindex="5" />').appendTo(v.$el);
        const $amount = $('<input class="transactions-editor_amount" tabindex="6" />').appendTo(v.$el);
        const $units = $('<div class="transactions-editor_units transactions-editor_units--hidden" />').appendTo(v.$el);
        const $unitDiff = $('<span class="transactions-editor_unit-diff" />').appendTo($units);

        $('<button type="submit" class="transactions-editor_done button button--inline button--small" />')
            .text(StringHelper.string('transactions.edit.save'))
            .appendTo(v.$el);

        $('<button type="reset" class="transactions-editor_cancel button button--inline button--small button--text" />')
            .text(StringHelper.string('transactions.edit.cancel'))
            .appendTo(v.$el);

        const $delete = $('<button type="button" class="transactions-editor_delete transactions-editor_delete--hidden button button--inline button--small button--destructive" />')
            .text(StringHelper.string('transactions.remove.text'))
            .attr('title', StringHelper.string('transactions.remove.title'))
            .appendTo(v.$el);


        // Date & Time
        if (!v.model.has('time')) {
            v.model.set('time', moment().toJSON());
        }
        v.listenToAndCall(v.model, 'change:time', () => {
            const m = moment(v.model.get('time'));
            $date.val(m.format('L'));
        });
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            $date.prop('disabled', account && account.get('pluginInstanceId'));
        });
        $date.on('change', () => {
            const date = moment($date.val(), 'L');
            $date.toggleClass('transactions-editor_date--invalid', !date.isValid());
            if(!date.isValid()) {
                return;
            }

            $date.val(date.format('L'));
            v.model.set('time', date.toJSON());
        });


        // Account
        v.accounts.each(a => {
            const $o = $('<option />').text(a.get('name')).attr('value', a.id).appendTo($accountSelect);
            v.listenToAndCall(a, 'change:pluginInstanceId', () => {
                $o.prop('disabled', !!a.get('pluginInstanceId'));
            });
        });

        const defaultAccountId = StoreHelper.get(this.document.id + '-defaultAccount');
        if(
            !this.model.get('accountId') &&
            defaultAccountId &&
            this.accounts.get(defaultAccountId)
        ) {
            this.model.set({
                accountId: defaultAccountId
            });
        }
        else if(!v.model.get('accountId')) {
            const account = this.accounts.find(a => !a.get('pluginInstanceId'));
            if(account) {
                this.model.set({
                    accountId: account.id
                });
            }
        }

        $accountSelect.on('change', () => {
            const id = $accountSelect.val();
            v.model.set('accountId', id);

            if(!v.model.id) {
                StoreHelper.set(this.document.id + '-defaultAccount', id);
            }
        });
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            if (account) {
                $accountSelect.val(account.id);
            }

            $accountSelect.prop('disabled', account && account.get('pluginInstanceId'));
        });


        // Payee
        new TransactionsEditorPayeeSelectView({
            model: v.model,
            document: v.document,
            accounts: v.accounts
        }).appendTo(v, $payee);


        // Budget
        const budget = new TransactionsEditorBudgetSelectView({
            budgets: v.budgets,
            categories: v.categories,
            transaction: v.model,
            allowSplitSelection: true
        }).appendTo(v, $budget);
        v.listenToAndCall(v.model, 'change:units', () => {
            const units = v.model.getUnits();
            $budget.toggleClass('transactions-editor_budget--transfer', !!units.find(u => u.get('type') === 'TRANSFER'));

            if (units.length === 0) {
                budget.value('');
            }
            else if (units.length === 1 && units.first().get('type') === 'INCOME') {
                budget.value('income');
            }
            else if (units.length === 1 && units.first().get('type') === 'INCOME_NEXT') {
                budget.value('income:next');
            }
            else if (units.length === 1 && units.first().get('type') === 'BUDGET') {
                budget.value('budget:' + units.first().get('budgetId'));
            }
            else {
                budget.value('split');
            }
        });
        v.listenTo(budget, 'update', function (value) {
            if (value === 'split') {
                const units = v.model.getUnits();
                v.model.set({units: [units.first(), {}]});
                return;
            }

            const unit = {
                amount: v.model.get('amount'),
                type: null
            };

            if(value === 'income') {
                unit.type = 'INCOME';
                unit.budgetId = null;
            }
            else if(value === 'income:next') {
                unit.type = 'INCOME_NEXT';
                unit.budgetId = null;
            }
            else if(value.substr(0, 7) === 'budget:') {
                unit.type = 'BUDGET';
                unit.budgetId = value.substr(7);
            }

            v.model.set({
                units: [unit]
            });
        });
        v.listenTo(v.model, 'change:amount', () => {
            const value = budget.value();
            if (value === 'split' || !value) {
                return;
            }

            v.model.set({
                units: [{
                    amount: v.model.get('amount'),
                    budgetId: value
                }]
            });
        });


        // Memo
        v.listenToAndCall(v.model, 'change:memo', () => {
            $memo.val(v.model.get('memo'));
        });
        $memo.on('change', () => {
            v.model.set('memo', $memo.val());
        });


        // Amount
        v.listenToAndCall(v.model, 'change:amount change:units', () => {
            const isTransfer = !!(v.model.get('units') || []).find(u => u.type === 'TRANSFER');

            $amount.val(StringHelper.currency(
                this.document,
                (v.model.get('amount') || 0) * (isTransfer ? -1 : 1)
            ));

            $amount.toggleClass('transactions-editor_amount--negative', v.model.get('amount') < 0);
            $amount.toggleClass('transactions-editor_amount--positive', v.model.get('amount') > 0);
            $amount.toggleClass('transactions-editor_amount--transfer', isTransfer);
        });
        $amount.on('change', () => {
            const isTransfer = !!(v.model.get('units') || []).find(u => u.type === 'TRANSFER');
            const amount = StringHelper.parseCurrency(this.document, $amount.val()) * (isTransfer ? -1 : 1);

            v.model.set('amount', amount);

            const units = v.model.get('units');
            if(units.length === 1) {
                units[0].amount = amount;
                v.model.set('units', units);
            }
        });
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            $amount.prop('disabled', account && account.get('pluginInstanceId'));
        });


        // Delete Button
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            $delete.toggleClass('transactions-editor_delete--hidden', account && !!account.get('pluginInstanceId') || false);
        });
        $delete.click(e => {
            e.stopPropagation();
            if (!v.model.id) {
                v.trigger('close');
                v.model.collection.remove(v.model);
                return;
            }

            const account = v.accounts.get(v.model.get('accountId'));
            if (!account || account.get('pluginInstanceId')) {
                return;
            }

            v.model.destroy();
        });


        // Units
        new TransactionsEditorUnitsView({
            document: v.document,
            transaction: v.model,
            budgets: v.budgets,
            categories: v.categories
        }).prependTo(v, $units);
        v.listenToAndCall(v.model, 'change:units', () => {
            const units = v.model.getUnits();
            $units.toggleClass('transactions-editor_units--hidden', units.length < 2);

            let diff = v.model.get('amount');
            units.each(u => {
                diff -= u.get('amount') || 0;
            });

            $unitDiff.text(StringHelper.currency(v.document, diff));
        });

    },

    async save(e) {
        e.stopPropagation();
        e.preventDefault();

        const wasNew = !this.model.id;
        this.trigger('close');

        await this.model.save();
        if(wasNew) {
            this.trigger('duplicate');
        }
    },

    cancel(e) {
        e.preventDefault();

        if (!this.model.id) {
            this.trigger('close');
            this.model.collection.remove(this.model);
            return;
        }

        this.model.set(this.model.previousAttributes());
        this.model.fetch();

        this.trigger('close');
    }
});
