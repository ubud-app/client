'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetsLabelsBudget from './budgetsLabelsBudget';
import BudgetLabelsCategoryEditorView from './budgetsLabelsCategoryEditor';

/**
 * @module views/budgetsLabelsCategory
 * @class BudgetsLabelsCategoryView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'li',
	className: 'budgets-labels-category',
	events: {
		'click .budgets-labels-category_edit': 'edit'
	},

	_initialize (options) {
		this.document = options.document;
		this.category = options.category;
		this.budgets = options.budgets;
	},

	render () {
		const v = this;

		v.$title = $('<div class="budgets-labels-category_header" />').appendTo(v.$el);
		const $name = $('<span class="budgets-labels-category_name" />').appendTo(v.$title);
		v.listenToAndCall(v.category, 'change:name', () => {
			$name.text(v.category.get('name'));
		})

		$('<button class="budgets-labels-category_edit" />').html('&#xe802;').appendTo(v.$title);

		const budgets = v.category.filterBudgets(v.budgets, v);
		v.renderChildren(BudgetsLabelsBudget, {collection: budgets});

		if(!v.category.id) {
			v.edit();
		}
	},
	edit () {
		new BudgetLabelsCategoryEditorView({
			model: this.category,
			document: this.document,
			budgets: this.budgets
		}).appendTo(this, this.$title);
	}
});
