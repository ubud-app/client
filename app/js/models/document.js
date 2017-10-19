'use strict';

import BaseModel from './_';
import AccountCollection from '../collections/account';

/**
 * @module models/document
 * @class DocumentModel
 * @augments BaseModel
 */
export default class DocumentModel extends BaseModel {
	urlRoot = 'documents';

	getAccounts () {
		const accounts = new AccountCollection();
		accounts.id = 'documents:' + this.id;
		return accounts;
	}
}