'use strict';

import BaseView from './_';

/**
 * @module views/budgetsContainer
 * @class BudgetsContainerView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'budgets-container',

	_initialize (options) {
		this.document = options.document;
		this.month = options.month;
	},

	render () {
		this.$el.text(this.month.format('MMM YYYY'));
		this.active(false);
	},

	active(value) {
		this.$el.css({
			background: value ? 'green' : 'red'
		});
	}
});
