'use strict';

const BaseCollection = require('./_');
const AccountModel = require('../models/account');

const DocumentCollection = BaseCollection.extend({
    model: AccountModel,
    url: 'accounts',
    dbStore: 'account'
});

module.exports = DocumentCollection;