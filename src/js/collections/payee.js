'use strict';

const BaseCollection = require('./_');
const PayeeModel = require('../models/payee');

const PayeeCollection = BaseCollection.extend({
    model: PayeeModel,
    url: 'payees',
    dbStore: 'payee'
});

module.exports = PayeeCollection;