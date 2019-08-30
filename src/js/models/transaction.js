'use strict';

import BaseModel from './_';


/**
 * @module models/transaction
 * @class TransactionModel
 * @augments BaseModel
 */
const TransactionModel = BaseModel.extend({
    urlRoot: 'transactions',
    dbStore: 'transaction'
});

export default TransactionModel;
