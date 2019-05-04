'use strict';

const BaseModel = require('./_');

/**
 * @module models/summary
 * @class SummaryModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'summaries',
    dbStore: 'summary'
});