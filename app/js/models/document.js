'use strict';

import BaseModel from './_';
import AccountCollection from '../collections/account';
import BudgetCollection from '../collections/budget';
import CategoryCollection from '../collections/category';

/**
 * @module models/document
 * @class DocumentModel
 * @augments BaseModel
 */
export default class DocumentModel extends BaseModel {
	urlRoot = 'documents';

	getAccounts () {
		const accounts = new AccountCollection();
		accounts.id = 'document:' + this.id;
		return accounts;
	}

	getBudgets () {
		const budgets = new BudgetCollection();
		budgets.id = 'document:' + this.id;
		return budgets;
	}

	getCategories () {
		const categories = new CategoryCollection();
		categories.id = 'document:' + this.id;
		return categories;
	}
}