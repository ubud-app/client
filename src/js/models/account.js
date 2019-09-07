'use strict';

import BaseModel from './_';


/**
 * @module models/account
 * @class AccountModel
 * @augments BaseModel
 */
const AccountModel = BaseModel.extend({
    urlRoot: 'accounts',
    dbStore: 'account'
});

export default AccountModel;
