'use strict';

import BaseModel from './_';


/**
 * @module models/payee
 * @class PayeeModel
 * @augments BaseModel
 */
const PayeeModel = BaseModel.extend({
    urlRoot: 'payees',
    dbStore: 'payee'
});

export default PayeeModel;
