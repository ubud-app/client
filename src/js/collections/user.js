'use strict';

import BaseCollection from './_';
import UserModel from '../models/user';

const UserCollection = BaseCollection.extend({
    model: UserModel,
    url: 'users',
    dbStore: 'user',
    comparator: 'email'
});

export default UserCollection;