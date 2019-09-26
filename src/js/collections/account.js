'use strict';


import BaseCollection from './_';
import AccountModel from '../models/account';

const AccountCollection = BaseCollection.extend({
    model: AccountModel,
    url: 'accounts',
    dbStore: 'account',
    comparator: 'name'
});

export default AccountCollection;