'use strict';

import BaseCollection from './_';
import BudgetModel from '../models/budget';

const BudgetCollection = BaseCollection.extend({
    model: BudgetModel,
    url: 'budgets',
    dbStore: 'budget',
    comparator: 'name'
});

export default BudgetCollection;