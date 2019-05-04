'use strict';

const BaseModel = require('./_');

/**
 * @module models/budget
 * @class BudgetModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'budgets',
    dbStore: 'budget'
});