'use strict';

import BaseView from './_';
import TransactionsItemView from './transactionsItem';

/**
 * @module views/transactionsMonth
 * @class TransactionsMonthView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'transactions-month',

	_initialize(options) {
		this.document = options.document;
	},

	render () {
		//this.$el.attr('data-id', this.collection.id);

		this.listenTo(this.collection, 'add', this.addItem);
	},

	addItem(model) {
		new TransactionsItemView({model, document: this.document}).appendTo(this.$el);
	}
});
