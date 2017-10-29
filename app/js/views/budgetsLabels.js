'use strict';

import BaseView from './_';
import BudgetLabelsCategory from './budgetsLabelsCategory';

/**
 * @module views/budgetsLabels
 * @class BudgetsLabelsView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'ul',
	className: 'budgets-labels',

	_initialize (options) {
		this.document = options.document;
		this.categories = options.categories;
		this.budgets = options.budgets;
	},

	render () {
		const v = this;
		v.renderChildren(BudgetLabelsCategory, {
			collection: v.categories,
			modelAttr: 'category',
			childOptions: {
				document: v.document,
				budgets: v.budgets
			}
		});
	}
});
