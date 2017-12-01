'use strict';

import $ from 'jquery';
import moment from 'moment';
import BaseView from './_';
import StringHelper from '../helpers/string';
import TransactionsEditorBudgetSelectView from './transactionsEditorBudgetSelect';
import TransactionsEditorUnitsView from './transactionsEditorUnits';

/**
 * @module views/transactionsEditor
 * @class TransactionsEditorView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions-editor',

    _initialize(options) {
        this.document = options.document;
        this.accounts = options.accounts;
        this.budgets = options.budgets;
        this.categories = options.categories;
    },

    render() {
        const v = this;
        const $date = $('<input class="transactions-editor_date" />').appendTo(v.$el);
        const $account = $('<span class="transactions-editor_account" />').appendTo(v.$el);
        const $accountSelect = $('<select class="transactions-editor_account-select" />').appendTo($account);
        const $payee = $('<span class="transactions-editor_payee" />').appendTo(v.$el);
        const $budget = $('<span class="transactions-editor_budget" />').appendTo(v.$el);
        const $memo = $('<input class="transactions-editor_memo" />').appendTo(v.$el);
        const $amount = $('<input class="transactions-editor_amount" />').appendTo(v.$el);
        const $units = $('<div class="transactions-editor_units transactions-editor_units--hidden" />').appendTo(v.$el);
        const $unitDiff = $('<span class="transactions-editor_unit-diff" />').appendTo($units);
        const $done = $('<button class="transactions-editor_done button button--inline button--small" />')
            .text(StringHelper.string('transactions.edit.save'))
            .appendTo(v.$el);
        const $cancel = $('<button class="transactions-editor_cancel button button--inline button--small button--text" />')
            .text(StringHelper.string('transactions.edit.cancel'))
            .appendTo(v.$el);
        const $delete = $('<button class="transactions-editor_delete transactions-editor_delete--hidden button button--inline button--small button--destructive" />')
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
            $date.prop('disabled', account && account.get('pluginId'));
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
            v.listenToAndCall(a, 'change:pluginId', () => {
                $o.prop('disabled', !!a.get('pluginId'));
            });
        });
        $accountSelect.on('change', () => {
            v.model.set('accountId', $accountSelect.val());
        });
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            if (account) {
                $accountSelect.val(account.id);
            }

            $accountSelect.prop('disabled', account && account.get('pluginId'));
        });


        // Budget
        const budget = new TransactionsEditorBudgetSelectView({
            budgets: v.budgets,
            categories: v.categories,
            transaction: v.model,
            allowSplitSelection: true
        }).appendTo(v, $budget);
        v.listenToAndCall(v.model, 'change:units', () => {
            const units = v.model.getUnits();

            if (units.length === 0) {
                budget.value('');
            }
            else if (units.length === 1) {
                budget.value(units.first().get('budgetId'));
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

            v.model.set({
                units: [{
                    amount: v.model.get('amount'),
                    budgetId: value
                }]
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
        v.listenToAndCall(v.model, 'change:amount', () => {
            $amount.val(StringHelper.currency(this.document, v.model.get('amount') || 0));
        });
        $amount.on('change', () => {
            v.model.set('amount', StringHelper.parseCurrency(this.document, $amount.val()));
        });
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            $amount.prop('disabled', account && account.get('pluginId'));
        });


        // Delete Button
        v.listenToAndCall(v.model, 'change:accountId', () => {
            const account = v.accounts.get(v.model.get('accountId'));
            $delete.toggleClass('transactions-editor_delete--hidden', account && !!account.get('pluginId') || false);
        });
        $delete.click(e => {
            e.stopPropagation();
            if (!v.model.id) {
                v.trigger('close');
                v.model.collection.remove(v.model);
                return;
            }

            const account = v.accounts.get(v.model.get('accountId'));
            if (!account || account.get('pluginId')) {
                return;
            }

            v.model.destroy();
        });

        // Cancel Button
        $cancel.click((e) => {
            e.stopPropagation();

            if (!v.model.id) {
                v.trigger('close');
                v.model.collection.remove(v.model);
                return;
            }

            v.model.set(v.model.previousAttributes());
            v.model.fetch();

            v.trigger('close');
        });

        // Done Button
        $done.click(e => {
            e.stopPropagation();
            v.model.save();
            v.trigger('close');
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

    }
});
