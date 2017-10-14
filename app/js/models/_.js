'use strict';

import {Model} from 'backbone';
import _ from 'underscore';
import DataHelper from '../helpers/data';

/**
 * @module models/_
 * @class BaseModel
 * @augments Backbone.Model
 */
export default Model.extend({
	idAttribute: 'id',
	sync: DataHelper.sync,

	initialize (attributes, options) {
		const m = this;

		for (let i in m) {
			if (typeof m[i] === 'function' && !Model.prototype[i]) {
				_.bindAll(m, i);
			}
		}

		if (_.isFunction(m._initialize)) {
			m._initialize(attributes, options);
		}
	},
	wait() {
		return DataHelper.wait(this);
	},
	live(view) {
		DataHelper.live(this, view);
		return this;
	}
});
