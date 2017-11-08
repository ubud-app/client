'use strict';

import BaseCollection from './_';
import PortionModel from '../models/portion';

const PortionsCollection = BaseCollection.extend({
    model: PortionModel,
    url: 'portions',

    getByBudgetId(budgetId) {
        return this.find(m => m.get('budgetId') === budgetId) || null;
    }
});

export default PortionsCollection;