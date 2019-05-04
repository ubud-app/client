'use strict';

const BaseCollection = require('./_');
const PortionModel = require('../models/portion');

const PortionsCollection = BaseCollection.extend({
    model: PortionModel,
    url: 'portions',
    dbStore: 'portion',

    getByBudgetId(budgetId) {
        return this.find(m => m.get('budgetId') === budgetId) || null;
    }
});

module.exports = PortionsCollection;