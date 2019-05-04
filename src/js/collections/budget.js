'use strict';

const BaseCollection = require('./_');
const BudgetModel = require('../models/budget');

const BudgetCollection = BaseCollection.extend({
    model: BudgetModel,
    url: 'budgets',
    dbStore: 'budget',
    comparator: 'name'
});

module.exports = BudgetCollection;