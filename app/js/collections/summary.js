'use strict';

import BaseCollection from './_';
import SummaryModel from '../models/summary';

const SummaryCollection = BaseCollection.extend({
	model: SummaryModel,
	url: 'summaries'
});

export default SummaryCollection;