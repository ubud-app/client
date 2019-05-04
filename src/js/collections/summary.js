'use strict';

const BaseCollection = require('./_');
const SummaryModel = require('../models/summary');

const SummaryCollection = BaseCollection.extend({
    model: SummaryModel,
    url: 'summaries',
    dbStore: 'summary'
});

module.exports = SummaryCollection;