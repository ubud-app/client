'use strict';

import $ from 'jquery';
import BaseView from './_';
import StringHelper from '../helpers/string';
import TransActionsEditorBudgetGroupView from './transactionsEditorBudgetGroup';

/**
 * @module views/transactionsEditorBudgetSelect
 * @class TransactionsEditorBudgetSelectView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'select',
	className: 'transactions-editor-budget-select',
	events: {
		'change': 'sendChange'
	},

	_initialize (options) {
		this.budgets = options.budgets;
		this.categories = options.categories;
		this.allowSplitSelection = options.allowSplitSelection;
	},

	render () {
		const v = this;

		v.$empty = $('<option />')
			.text('-')
			.attr('value', '')
			.appendTo(v.$el);

		if(this.allowSplitSelection) {
			$('<option />')
				.text(StringHelper.string('transactions.multipleBudgets'))
				.attr('value', 'split')
				.appendTo(v.$el);
		}

		v.renderChildren(TransActionsEditorBudgetGroupView, {
			modelAttr: 'category',
			collection: v.categories,
			childOptions: {budgets: v.budgets}
		});
	},

	value(value) {
		if(value === undefined) {
			return this.$el.val();
		}
		if(!value) {
			this.$empty.prependTo(this.$el);
		}

		this.$el.val(value);

		if(value) {
			this.$empty.detach();
		}
	},

	sendChange() {
		const value = this.$el.val() || null;
		if(value) {
			this.$empty.detach();
		}

		this.trigger('update', value);
	}
});
