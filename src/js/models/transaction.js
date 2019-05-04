'use strict';

const BaseModel = require('./_');

/**
 * @module models/transaction
 * @class TransactionModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'transactions',
    dbStore: 'transaction'
});