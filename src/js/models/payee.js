'use strict';

const BaseModel = require('./_');

/**
 * @module models/payee
 * @class PayeeModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'payees',
    dbStore: 'payee'
});