'use strict';

import BaseCollection from './_';
import TransactionModel from '../models/transaction';

const TransactionCollection = BaseCollection.extend({
    model: TransactionModel,
    url: 'transactions',
    dbStore: 'transaction',
    comparator: 'time'
});

export default TransactionCollection;