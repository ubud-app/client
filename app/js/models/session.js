'use strict';

import BaseModel from './_';
import UserModel from './user';
import StoreHelper from '../helpers/store';

/**
 * @module models/session
 * @class SessionModel
 * @augments BaseModel
 */
export default BaseModel.extend({
    urlRoot: 'sessions',

    load() {
        const m = this;

        m.set(StoreHelper.get('auth'));
        m.trigger('sync');

        m.on('sync change:id', function () {
            StoreHelper.set('auth', m.toJSON());
        });

        return m;
    },

    getUser() {
        return new UserModel(this.get('user'));
    }
});