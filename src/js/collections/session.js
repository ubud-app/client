'use strict';

const BaseCollection = require('./_');
const SessionModel = require('../models/session');

const SessionCollection = BaseCollection.extend({
    model: SessionModel,
    url: 'sessions',
    dbStore: 'session'
});

module.exports = SessionCollection;