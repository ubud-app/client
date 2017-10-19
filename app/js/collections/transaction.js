'use strict';

import BaseCollection from './_';
import TransactionModel from '../models/transaction';

const TransactionCollection = BaseCollection.extend({
	model: TransactionModel,
	url: 'transactions'
});

export default TransactionCollection;