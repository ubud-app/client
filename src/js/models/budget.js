'use strict';

import BaseModel from './_';


/**
 * @module models/budget
 * @class BudgetModel
 * @augments BaseModel
 */
const BudgetModel = BaseModel.extend({
    urlRoot: 'budgets',
    dbStore: 'budget'
});

export default BudgetModel;
