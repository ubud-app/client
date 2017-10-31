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
	currentPage: 0,
	events: {
		'click': 'nextPage'
	},

	_initialize (options) {
		this.document = options.document;
		this.month = options.month;
	},

	async render () {
		const v = this;

		v.collection = v.document.getSummaryByMonth(v.month);
		await v.collection.wait();
		v.model = v.collection.first().live(v);
		v._pages = [];

		const $p1 = $('<div class="budgets-stats_page budgets-stats_page--single" />').appendTo(v.$el);
		const $p1_label = $('<span class="budgets-stats_label" />').appendTo($p1);
		const $p1_value = $('<span class="budgets-stats_value" />').appendTo($p1);
		v._pages.push($p1);

		v.listenToAndCall(v.model, 'change:available', () => {
			const a = v.model.get('available');
			$p1_label.text(StringHelper.string(a < 0 ? 'budget.stats.available.overspend' : 'budget.stats.available.default'));
			$p1_value.text(StringHelper.currency(v.document, a));
			$p1_value.toggleClass('budgets-stats_value--warn', a < 0);
		});


		const $p2 = $('<div class="budgets-stats_page" />').appendTo(v.$el);
		const $p2_income_label = $('<span class="budgets-stats_label" />').appendTo($p2);
		const $p2_budgeted_label = $('<span class="budgets-stats_label" />').appendTo($p2);
		const $p2_income_value = $('<span class="budgets-stats_value" />').appendTo($p2);
		const $p2_budgeted_value = $('<span class="budgets-stats_value" />').appendTo($p2);
		$p2_income_label.text(StringHelper.string('budget.stats.income'));
		$p2_budgeted_label.text(StringHelper.string('budget.stats.budgeted'));
		v._pages.push($p2);

		v.listenToAndCall(v.model, 'change:income', () => {
			$p2_income_value.text(StringHelper.currency(v.document, v.model.get('income')));
		});
		v.listenToAndCall(v.model, 'change:budgeted', () => {
			$p2_budgeted_value.text(StringHelper.currency(v.document, v.model.get('budgeted')));
		});


		const $p3 = $('<div class="budgets-stats_page" />').appendTo(v.$el);
		const $p3_outflow_label = $('<span class="budgets-stats_label" />').appendTo($p3);
		const $p3_balance_label = $('<span class="budgets-stats_label" />').appendTo($p3);
		const $p3_outflow_value = $('<span class="budgets-stats_value" />').appendTo($p3);
		const $p3_balance_value = $('<span class="budgets-stats_value" />').appendTo($p3);
		$p3_outflow_label.text(StringHelper.string('budget.stats.outflow'));
		$p3_balance_label.text(StringHelper.string('budget.stats.balance'));
		v._pages.push($p3);

		v.listenToAndCall(v.model, 'change:outflow', () => {
			$p3_outflow_value.text(StringHelper.currency(v.document, v.model.get('outflow')));
		});
		v.listenToAndCall(v.model, 'change:balance', () => {
			$p3_balance_value.text(StringHelper.currency(v.document, v.model.get('balance')));
		});

		v._indicators = [
			$('<span class="budgets-stats_indicator" />').appendTo(v.$el),
			$('<span class="budgets-stats_indicator" />').appendTo(v.$el),
			$('<span class="budgets-stats_indicator" />').appendTo(v.$el)
		];

		v.activatePage();
	},
	nextPage() {
		const v = this;
		v.currentPage += 1;
		if(v.currentPage >= v._pages.length) {
			v.currentPage = 0;
		}

		v.activatePage();
	},
	activatePage() {
		const v = this;
		v._indicators.forEach(($i, i) => {
			$i.toggleClass('budgets-stats_indicator--active', i === v.currentPage);
		});
		v._pages.forEach(($p, i) => {
			$p.toggleClass('budgets-stats_page--active', i === v.currentPage);
		});
	}
});
