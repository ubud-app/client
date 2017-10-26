'use strict';

import moment from 'moment';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import BudgetsContainersView from './budgetsContainers.js';

/**
 * @module views/budgets
 * @class BudgetsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'budgets',

	_initialize(options) {
		this.documentId = options.documentId;
		this.currentMonth = options.month ? moment(options.month) : moment();
		this.currentMonth = this.currentMonth.startOf('month');
		this.currentPosition = 0;
	},
	async render () {
		AppHelper.title('budgets.title');

		const documents = await DataHelper.getDocuments().wait();
		const document = documents.get(this.documentId);
		if(!document) {
			AppHelper.navigate('/', {trigger: true, replace: true});
			return;
		}

		// new BudgetsTimePicker().appendTo(v);
		new BudgetsContainersView({document, parent: this}).appendTo(this);
	},

	getPosition() {
		return {month: this.currentMonth, position: this.currentPosition};
	}
});
