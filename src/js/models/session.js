'use strict';

import BaseModel from './_';
import StoreHelper from '../helpers/store';
import UserModel from '../models/user';


/**
 * @module models/session
 * @class SessionModel
 * @augments BaseModel
 */
const SessionModel = BaseModel.extend({
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

export default SessionModel;
