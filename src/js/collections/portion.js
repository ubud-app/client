'use strict';

import BaseCollection from './_';
import PortionModel from '../models/portion';

const PortionCollection = BaseCollection.extend({
    model: PortionModel,
    url: 'portions',
    dbStore: 'portion',

    getByBudgetId(budgetId) {
        return this.find(m => m.get('budgetId') === budgetId) || null;
    }
});

export default PortionCollection;