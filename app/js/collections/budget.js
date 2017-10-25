'use strict';

import BaseCollection from './_';
import BudgetModel from '../models/budget';

const BudgetCollection = BaseCollection.extend({
	model: BudgetModel,
	url: 'budgets'
});

export default BudgetCollection;