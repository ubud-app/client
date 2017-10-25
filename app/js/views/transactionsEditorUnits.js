'use strict';

import BaseView from './_';
import TransactionsEditorUnitView from './transactionsEditorUnit';

/**
 * @module views/transactionsEditorUnits
 * @class TransactionsEditorUnitsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'transactions-editor-units',

	_initialize (options) {
		this.transaction = options.transaction;
		this.collection = this.transaction.getUnits(this);

		this.budgets = options.budgets;
		this.categories = options.categories;
		this.document = options.document;
	},

	render () {
		const v = this;

		v.renderChildren(TransactionsEditorUnitView, {
			childOptions: {
				transaction: v.transaction,
				budgets: v.budgets,
				categories: v.categories,
				document: v.document
			}
		});

		v.listenToAndCall(v.collection, 'update', () => {
			const l = v.collection.last();
			if(v.collection.length >= 2 && l.get('budgetId') && l.get('amount')) {
				this.collection.add({});
			}
		});
		v.listenToAndCall(v.transaction, 'sync', () => {
			v.collection.filter(m => !m.id).forEach(m => {v.collection.remove(m);});
			v.collection.trigger('update');
		});
	}
});
