'use strict';

import $ from 'jquery';
import BaseView from './_';
import StringHelper from '../helpers/string';
import TransactionsEditorBudgetSelectView from './transactionsEditorBudgetSelect';

/**
 * @module views/transactionsEditorUnit
 * @class TransactionsEditorUnitView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions-editor-unit',

    _initialize(options) {
        this.transaction = options.transaction;
        this.budgets = options.budgets;
        this.categories = options.categories;
        this.document = options.document;
    },

    render() {
        const v = this;

        const $budget = $('<span class="transactions-editor-unit_budget" />').appendTo(v.$el);
        const $memo = $('<input class="transactions-editor-unit_memo" />').appendTo(v.$el);
        const $amount = $('<input class="transactions-editor-unit_amount" />').appendTo(v.$el);

        // Budget
        const budget = new TransactionsEditorBudgetSelectView({
            budgets: v.budgets,
            categories: v.categories,
            transaction: v.transaction
        }).appendTo(v, $budget);
        v.listenToAndCall(v.model, 'change:budgetId', () => {
            budget.value(v.model.get('budgetId') || '');
        });
        v.listenTo(budget, 'update', function (value) {
            v.model.set('budgetId', value);
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
            v.model.set('amount', StringHelper.parseCurrency(this.document, $amount.val()) || 0);
        });
    }
});
