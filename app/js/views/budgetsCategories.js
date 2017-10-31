'use strict';

import BaseView from './_';
import BudgetsCategory from './budgetsCategory';

/**
 * @module views/budgetsCategories
 * @class BudgetsCategoriesView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'ul',
	className: 'budgets-categories',

	_initialize (options) {
		this.month = options.month;
		this.document = options.document;
		this.categories = options.categories;
		this.budgets = options.budgets;
	},

	render () {
		const v = this;
		v.portions = v.document.getPortionsByMonth(v.month).live(v);

		v.renderChildren(BudgetsCategory, {
			collection: v.categories,
			modelAttr: 'category',
			childOptions: {
				month: v.month,
				document: v.document,
				budgets: v.budgets,
				portions: v.portions
			}
		});
	}
});