'use strict';

const BaseModel = require('./_');

/**
 * @module models/account
 * @class AccountModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'accounts',
    dbStore: 'account'
});