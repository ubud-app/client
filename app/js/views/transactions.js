'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TransactionsScrollView from './transactionsScroll';
import TransactionsFooterView from './transactionsFooter';

import moment from 'moment';
import TransactionModel from '../models/transaction';

/**
 * @module views/transactions
 * @class TransactionsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'transactions',

	_initialize (options) {
		this.documentId = options.documentId;
	},

	async render () {
		AppHelper.title('transactions.title');

		const documents = await DataHelper.getDocuments().wait();
		this.model = documents.get(this.documentId);
		if (!this.model) {
			AppHelper.navigate('/', {trigger: true, replace: true});
		}

		this.model.live(this);

		new TransactionsScrollView({model: this.model}).appendTo(this);
		new TransactionsFooterView().appendTo(this);

		this.listenToOnce(this.model, 'destroy', function () {
			AppHelper.navigate('/', {trigger: true, replace: true});
		});


		/*let m;
		for(let i = moment().subtract(1, 'y').startOf('month'); moment().add(2, 'M').endOf('month').isAfter(i); i.add(2, 'day')) {
			m = new TransactionModel({
				time: i,
				amount: Math.round(Math.random() * 200000) - 100000,
				accountId: '18565136-3263-4486-91e0-0e333c372afd'
			});

			m.save();
		}*/
	}
});
