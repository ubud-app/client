'use strict';

import BaseCollection from './_';
import AccountModel from '../models/account';

const DocumentCollection = BaseCollection.extend({
    model: AccountModel,
    url: 'accounts'
});

export default DocumentCollection;