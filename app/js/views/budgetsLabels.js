'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetLabelsCategory from './budgetsLabelsCategory';
import StringHelper from '../helpers/string';

/**
 * @module views/budgetsLabels
 * @class BudgetsLabelsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'budgets-labels',
	events: {
		'click .budgets-labels_addCategory': 'addCategory',
		'click .budgets-labels_addBudget': 'addBudget'
	},

	_initialize (options) {
		this.document = options.document;
		this.categories = options.categories;
		this.budgets = options.budgets;
	},

	render () {
		const v = this;
		const $ul = $('<ul class="budgets-labels_categories" />').appendTo(v.$el);
		v.renderChildren(BudgetLabelsCategory, {
			collection: v.categories,
			modelAttr: 'category',
			where: $ul,
			childOptions: {
				document: v.document,
				budgets: v.budgets,
				categories: v.categories
			}
		});

		$('<button class="budgets-labels_addCategory button button--secondary button--small" />')
			.text(StringHelper.string('budget.labels.addCategory.text'))
			.appendTo(v.$el);

		const $addBudget = $('<button class="budgets-labels_addBudget button button--secondary button--small" />')
			.text(StringHelper.string('budget.labels.addBudget.text'))
			.appendTo(v.$el);
		v.listenToAndCall(v.categories, 'add remove sync', () => {
			$addBudget.prop('disabled', v.categories.length === 0);
		});
	},
	addCategory () {
		this.categories.add({
			name: StringHelper.string('budget.labels.addCategory.name'),
			documentId: this.document.id
		});
	},
	addBudget () {
		if(!this.categories.length) {
			return;
		}

		this.budgets.add({
			name: StringHelper.string('budget.labels.addBudget.name'),
			categoryId: this.categories.first().id
		});
	}
});
