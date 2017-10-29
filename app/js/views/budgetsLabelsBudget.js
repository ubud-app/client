'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetsLabelsBudget from './budgetsLabelsBudget';

/**
 * @module views/budgetsLabelsBudget
 * @class BudgetsLabelsBudgetView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'li',
	className: 'budgets-labels-budget',

	render () {
		const v = this;

		const $title = $('<span class="budgets-labels-budget_name" />').appendTo(v.$el);
		v.listenToAndCall(v.model, 'change:name', () => {
			$title.text(v.model.get('name'));
		});
	}
});
