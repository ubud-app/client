'use strict';

import BaseModel from './_';


/**
 * @module models/user
 * @class UserModel
 * @augments BaseModel
 */
const UserModel = BaseModel.extend({
    urlRoot: 'users',
    dbStore: 'user',

    getSessions() {

    }
});

export default UserModel;
