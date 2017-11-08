'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetLabelsBudgetEditorView from './budgetsLabelsBudgetEditor';

/**
 * @module views/budgetsLabelsBudget
 * @class BudgetsLabelsBudgetView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'budgets-labels-budget',
    events: {
        'click .budgets-labels-budget_edit': 'edit'
    },

    _initialize(options) {
        this.document = options.document;
        this.categories = options.categories;
    },

    render() {
        const v = this;

        const $name = $('<span class="budgets-labels-budget_name" />').appendTo(v.$el);
        v.listenToAndCall(v.model, 'change:name', () => {
            $name.text(v.model.get('name'));
        });

        $('<button class="budgets-labels-budget_edit" />').html('&#xe802;').appendTo(v.$el);

        if (!v.model.id) {
            v.edit();
        }
    },
    edit() {
        new BudgetLabelsBudgetEditorView({
            model: this.model,
            document: this.document,
            categories: this.categories
        }).appendTo(this, this.$el);
    }
});
