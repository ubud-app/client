'use strict';

import BaseModel from './_';


/**
 * @module models/summary
 * @class SummaryModel
 * @augments BaseModel
 */
const SummaryModel = BaseModel.extend({
    urlRoot: 'summaries',
    dbStore: 'summary'
});

export default SummaryModel;
