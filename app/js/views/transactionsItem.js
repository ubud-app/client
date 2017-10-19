'use strict';

import $ from 'jquery';
import moment from 'moment';
import BaseView from './_';
import StringHelper from '../helpers/string';

/**
 * @module views/transactionsItem
 * @class TransactionsItemView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'transactions-item',

	_initialize (options) {
		this.document = options.document;
	},

	render () {
		const v = this;
		const $line = $('<div class="transactions-item_line" />').appendTo(v.$el);
		const $editor = $('<div class="transactions-item_editor" />').appendTo(v.$el);
		const $date = $('<span class="transactions-item_date" />').appendTo($line);
		const $payee = $('<span class="transactions-item_payee" />').appendTo($line);
		const $budget = $('<span class="transactions-item_budget" />').appendTo($line);
		const $memo = $('<span class="transactions-item_memo" />').appendTo($line);
		const $amount = $('<span class="transactions-item_amount" />').appendTo($line);

		v.listenToAndCall(v.model, 'change:time', () => {
			const m = moment(v.model.get('time'));
			$date.text(m.format('L'));
		});

		v.listenToAndCall(v.model, 'change:payeeId', () => {
			// todo payee anzeigen
			$payee.text(v.model.get('payeeId'))
		});

		v.listenToAndCall(v.model, 'change:units', () => {
			// todo Budget anzeigen (units -> budgetId)
			$budget.text(v.model.get('payeeId'))
		});

		v.listenToAndCall(v.model, 'change:memo', () => {
			$memo.text(v.model.get('memo'))
		});

		v.listenToAndCall(v.model, 'change:amount', () => {
			$amount.text(StringHelper.currency(this.document, v.model.get('amount')));
		});
	}
});
