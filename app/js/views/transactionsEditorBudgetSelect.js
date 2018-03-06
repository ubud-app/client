'use strict';

import $ from 'jquery';
import moment from 'moment';
import BaseView from './_';
import StringHelper from '../helpers/string';
import TransActionsEditorBudgetGroupView from './transactionsEditorBudgetGroup';

/**
 * @module views/transactionsEditorBudgetSelect
 * @class TransactionsEditorBudgetSelectView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'select',
    className: 'transactions-editor-budget-select',
    events: {
        'change': 'sendChange'
    },

    _initialize(options) {
        this.budgets = options.budgets;
        this.categories = options.categories;
        this.transaction = options.transaction;
        this.allowSplitSelection = options.allowSplitSelection;
    },

    render() {
        const v = this;

        v.$el.attr({tabindex: '4'});

        v.$empty = $('<option />')
            .text('-')
            .attr('value', '')
            .appendTo(v.$el);

        if (this.allowSplitSelection) {
            $('<option />')
                .text(StringHelper.string('transactions.budgetSelect.multipleBudgets'))
                .attr('value', 'split')
                .appendTo(v.$el);
        }

        $('<optgroup />').attr('label', StringHelper.string('transactions.budgetSelect.income')).appendTo(v.$el);
        const $incomeThis = $('<option />').attr('value', 'income-0').appendTo(v.$el);
        const $incomeNext = $('<option />').attr('value', 'income-1').appendTo(v.$el);
        v.listenToAndCall(v.transaction, 'change:time', () => {
            const m = moment(v.transaction.get('time'));
            $incomeThis.text(StringHelper.string('transactions.budgetSelect.incomeFor', {
                month: moment(m).format('MMM')
            }));
            $incomeNext.text(StringHelper.string('transactions.budgetSelect.incomeFor', {
                month: moment(m).add(1, 'month').format('MMM')
            }));
        });

        v.renderChildren(TransActionsEditorBudgetGroupView, {
            modelAttr: 'category',
            collection: v.categories,
            childOptions: {
                budgets: v.budgets,
                transaction: v.transaction
            }
        });
    },

    value(value) {
        if (value === undefined) {
            return this.$el.val();
        }
        if (!value) {
            this.$empty.prependTo(this.$el);
        }

        this.$el.val(value);

        if (value) {
            this.$empty.detach();
        }
    },

    sendChange() {
        const value = this.$el.val() || null;
        if (value) {
            this.$empty.detach();
        }

        this.trigger('update', value);
    }
});
