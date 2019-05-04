'use strict';

const BaseCollection = require('./_');
const UserModel = require('../models/user');

const UserCollection = BaseCollection.extend({
    model: UserModel,
    url: 'users',
    dbStore: 'user'
});

module.exports = UserCollection;