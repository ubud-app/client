'use strict';

import $ from 'jquery';
import BaseView from './_';
import StringHelper from '../helpers/string';

/**
 * @module views/budgetsLabels
 * @class BudgetsLabelsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'budgets-stats',

	_initialize (options) {
		this.document = options.document;
		this.categories = options.categories;
		this.budgets = options.budgets;
	},

	render () {
		const v = this;

		const $p1 = $('<div class="budgets-stats_page" />').appendTo(v.$el);
		const $p1_label = $('<span class="budgets-stats_atbl" />').appendTo($p1);
		const $p1_value = $('<span class="budgets-stats_atbv" />').appendTo($p1);

		const $i1 = $('<span class="budgets-stats_indicator budgets-stats_indicator--active" />').appendTo(v.$el);
		const $i2 = $('<span class="budgets-stats_indicator" />').appendTo(v.$el);
		const $i3 = $('<span class="budgets-stats_indicator" />').appendTo(v.$el);

		$p1_label.text(StringHelper.string('budget.stats.available.default'));
		$p1_value.text('0,00 €');
	}
});
