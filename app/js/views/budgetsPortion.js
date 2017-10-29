'use strict';

import $ from 'jquery';
import BaseView from './_';
import StringHelper from '../helpers/string';

/**
 * @module views/budgetsPortion
 * @class BudgetsPortionView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'li',
	className: 'budgets-portion',

	_initialize (options) {
		this.document = options.document;
		this.portions = options.portions;
		this.budget = options.budget;
	},

	async render () {
		const v = this;
		await v.portions.wait();
		v.model = v.portions.getByBudgetId(v.budget.id);

		// Budgeted
		const $budgeted = $('<input class="budgets-portion_budgeted" />').appendTo(v.$el);
		v.listenToAndCall(v.model, 'change:budgeted', () => {
			$budgeted.val(StringHelper.currency(this.document, v.model.get('budgeted') || 0));
		});
		$budgeted.on('change', () => {
			v.model.set('budgeted', StringHelper.parseCurrency(this.document, $budgeted.val()) || 0);
		});

		const $outflow = $('<span class="budgets-portion_outflow" />').appendTo(v.$el);
		v.listenToAndCall(v.model, 'change:outflow', () => {
			$outflow.text(StringHelper.currency(this.document, v.model.get('outflow') || 0));
		});

		const $balance = $('<span class="budgets-portion_balance" />').appendTo(v.$el);
		v.listenToAndCall(v.model, 'change:balance', () => {
			const balance = v.model.get('balance') || 0;
			let text = StringHelper.currency(this.document, balance);
			if(!v.budget.has('goal')) {
				text = '= ' + text;
			}

			$balance.text(text);
			$balance.toggleClass('budgets-portion_balance--negative', balance < 0);
			$balance.toggleClass('budgets-portion_balance--goal', v.budget.has('goal'));

			if(v.budget.has('goal')) {
				const p = balance / v.budget.get('goal');
				const $g = $('<span class="budgets-portion_goal" />').attr({
					title: StringHelper.percentage(p)
				}).appendTo($balance);

				$g.toggleClass('budgets-portion_goal--complete', p >= 1);
				$('<span class="budgets-portion_progress" />').css({
					width: Math.min(100, p * 100) + '%'
				}).appendTo($g)
			}
		});
	}
});
