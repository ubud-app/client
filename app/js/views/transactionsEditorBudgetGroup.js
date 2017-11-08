'use strict';

import $ from 'jquery';
import BaseView from './_';

/**
 * @module views/transactionsEditorBudgetGroup
 * @class TransactionsEditorBudgetGroupView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'optgroup',
    className: 'transactions-editor-budget-group',

    _initialize(options) {
        this.budgets = options.budgets;
        this.category = options.category;
    },

    render() {
        const v = this;
        v.$el.attr('label', v.category.get('name'));

        v.listenTo(v.budgets, 'add', v.addBudget);
        v.budgets.each(v.addBudget);
    },
    addBudget(budget) {
        const v = this;
        const $option = $('<option />')
            .attr('value', budget.id)
            .text(budget.get('name'));

        v.listenToAndCall(budget, 'change:categoryId', () => {
            if (budget.get('categoryId') !== v.category.id) {
                $option.detach();
            } else {
                $option.appendTo(v.$el);
            }
        });
    }
});
