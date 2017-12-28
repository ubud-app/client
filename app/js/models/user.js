'use strict';

import BaseModel from './_';
import SessionCollection from '../collections/session';

/**
 * @module models/user
 * @class UserModel
 * @augments BaseModel
 */
export default BaseModel.extend({
    urlRoot: 'users',

    getSessions() {
        const sessions = new SessionCollection();
        sessions.id = 'user:' + this.id;
        return sessions;
    }
});