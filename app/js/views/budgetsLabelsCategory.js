'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetsLabelsBudget from './budgetsLabelsBudget';

/**
 * @module views/budgetsLabelsCategory
 * @class BudgetsLabelsCategoryView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'li',
	className: 'budgets-labels-category',

	_initialize (options) {
		this.document = options.document;
		this.category = options.category;
		this.budgets = options.budgets;
	},

	render () {
		const v = this;

		const $title = $('<span class="budgets-labels-category_name" />').appendTo(v.$el);
		v.listenToAndCall(v.category, 'change:name', () => {
			$title.text(v.category.get('name'));
		});

		const budgets = v.category.filterBudgets(v.budgets, v);
		v.renderChildren(BudgetsLabelsBudget, {collection: budgets});
	}
});
