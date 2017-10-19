'use strict';

import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import BaseView from './_';
import TransactionMonthView from './transactionsMonth';
import TransactionCollection from '../collections/transaction';

/**
 * @module views/transactionsScroll
 * @class TransactionsScrollView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'transactions-scroll',

	nextMonthLock: false,
	emptyMonths: 0,

	render () {
		const v = this;

		$(window).on('resize', v.resize);
		v.resize();
		v.once('remove', () => {
			$(window).off('resize', v.resize);
		});

		v.scroll = _.throttle(v.checkMonths, 100, {leading: false});
		$(window).on('scroll', v.scroll);
		v.once('remove', () => {
			$(window).off('scroll', v.scroll);
		});

		Promise.all([
				v.addMonth('future'),
				v.addMonth(moment())
			])
			.then(() => {
				$(window).scrollTop($(document).height());
				return v.checkMonths();
			});
	},
	resize () {
		this.$el.css('min-height', $(window).height() - 100 - 60);
	},
	checkMonths () {
		const v = this;
		let height = 0;
		v.$el.children().each(function () {
			height += $(this).height();
		});

		if ($(window).scrollTop() < (2 * $(window).height())) {
			v.addNextMonth();
		}
	},
	addNextMonth () {
		const v = this;
		if (v.nextMonthLock) {
			return;
		}

		v.nextMonthLock = true;
		v.addMonth(moment(v.oldestMonth).subtract(1, 'month').startOf('month')).then(function (transactions) {
			if (transactions.length) {
				v.emptyMonths = 0;
			} else {
				v.emptyMonths += 1;
			}

			if (v.emptyMonths > 4) {
				// the end is near…
				return;
			}

			v.nextMonthLock = false;
			v.checkMonths();
		});
	},
	addMonth (month) {
		const transactions = new TransactionCollection();
		this.oldestMonth = month;

		if (month === 'future') {
			transactions.id = 'document:' + this.model.id + '/future';
		} else {
			transactions.id = 'document:' + this.model.id + '/month:' + month.format('YYYY-MM');
		}

		new TransactionMonthView({
			collection: transactions,
			document: this.model
		})[month === 'future' ? 'appendTo' : 'prependTo'](this);

		return transactions.fetch()
			.then(() => {
				return Promise.resolve(transactions);
			})
			.catch(e => {
				throw e;
			})
	}
});
