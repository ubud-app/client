'use strict';

import BaseCollection from './_';
import UserModel from '../models/user';

const UserCollection = BaseCollection.extend({
    model: UserModel,
    url: 'users'
});

export default UserCollection;