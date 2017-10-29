'use strict';

import BaseView from './_';
import BudgetsPortionView from './budgetsPortion';

/**
 * @module views/budgetsCategory
 * @class BudgetsCategoryView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'li',
	className: 'budgets-category',

	_initialize (options) {
		this.month = options.month;
		this.document = options.document;
		this.category = options.category;
		this.budgets = options.budgets;
		this.portions = options.portions;
	},

	render () {
		const v = this;
		v.renderChildren(BudgetsPortionView, {
			collection: v.category.filterBudgets(v.budgets, v),
			modelAttr: 'budget',
			childOptions: {
				month: v.month,
				portions: v.portions,
				document: v.document
			}
		});
	}
});
