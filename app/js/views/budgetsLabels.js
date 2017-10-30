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
		'click .budgets-labels_add': 'add'
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
				budgets: v.budgets
			}
		});

		$('<button class="budgets-labels_add button button--secondary button--inline button--small" />')
			.text(StringHelper.string('budget.labels.addCategory.text'))
			.appendTo(v.$el);
	},
	add () {
		this.categories.add({
			name: StringHelper.string('budget.labels.addCategory.name'),
			documentId: this.document.id
		});
	}
});
