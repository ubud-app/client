'use strict';

import BaseCollection from './_';
import SessionModel from '../models/session';

const SessionCollection = BaseCollection.extend({
    model: SessionModel,
    url: 'sessions',
    dbStore: 'session'
});

export default SessionCollection;