'use strict';

import BaseModel from './_';
import UnitCollection from '../collections/unit';

/**
 * @module models/transaction
 * @class TransactionModel
 * @augments BaseModel
 */
export default class TransactionModel extends BaseModel {
	urlRoot = 'transactions';

	getUnits (view) {
		return this._buildSubCollection({
			attribute: 'units',
			collection: UnitCollection,
			view
		});
	}
}