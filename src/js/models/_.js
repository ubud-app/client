'use strict';

import {Model} from 'backbone';
import {bindAll} from 'underscore';
import DataHelper from '../helpers/data';

/**
 * @module models/_
 * @class BaseModel
 * @augments Backbone.Model
 */
const BaseModel = Model.extend({
    idAttribute: 'id',
    sync: DataHelper.sync,

    initialize(attributes, options) {
        const m = this;

        for (let i in m) {
            if (typeof m[i] === 'function' && !Model.prototype[i]) {
                bindAll(m, i);
            }
        }

        if (typeof m._initialize === 'function') {
            m._initialize(attributes, options);
        }
    },

    isSyncing () {
        return DataHelper.isSyncing(this);
    },

    isSynced () {
        return DataHelper.isSynced(this);
    },

    async wait () {
        return DataHelper.wait(this);
    }
});

export default BaseModel;
