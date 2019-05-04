'use strict';

const BaseModel = require('./_');
const StoreHelper = require('../helpers/store');
const UserModel = require('./user');

/**
 * @module models/session
 * @class SessionModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'sessions',
    dbStore: 'session',

    load() {
        const m = this;

        m.set(StoreHelper.get('session'));
        m.trigger('sync');

        m.on('sync change:id', function () {
            StoreHelper.set('session', m.toJSON());
        });

        return m;
    },

    getUser() {
        return new UserModel(this.get('user'));
    }
});