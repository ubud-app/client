'use strict';

import $ from 'jquery';
import BaseView from './_';
import StringHelper from '../helpers/string';

/**
 * @module views/transactionsFooter
 * @class TransactionsMFooterView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'transactions-footer',
	events: {
		'click .transactions-footer-add': 'add'
	},

	render () {
		const v = this;

		const $add = $('<button class="transactions-footer-add button button--inline button--small" />')
			.text(StringHelper.string('transactions.add.text'))
			.attr('title', StringHelper.string('transactions.add.title'))
			.appendTo(v.$el);
	},

	add () {
		this.trigger('add');
	}
});
