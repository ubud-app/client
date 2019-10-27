'use strict';

import BaseCollection from './_';
import PayeeModel from '../models/payee';

const PayeeCollection = BaseCollection.extend({
    model: PayeeModel,
    url: 'payees',
    dbStore: 'payee',
    comparator: 'name'
});

export default PayeeCollection;