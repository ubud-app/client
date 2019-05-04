'use strict';

const BaseCollection = require('./_');
const TransactionModel = require('../models/transaction');

const TransactionCollection = BaseCollection.extend({
    model: TransactionModel,
    url: 'transactions',
    dbStore: 'transaction',
    comparator: 'time'
});

module.exports = TransactionCollection;