'use strict';

const BaseModel = require('./_');

/**
 * @module models/user
 * @class UserModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'users',
    dbStore: 'user',

    getSessions() {

    }
});