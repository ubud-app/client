'use strict';

const {Model} = require('backbone');
const _ = require('underscore');
const DataHelper = require('../helpers/data');

/**
 * @module models/_
 * @class BaseModel
 * @augments Backbone.Model
 */
module.exports = Model.extend({
    idAttribute: 'id',
    sync: DataHelper.sync,

    initialize(attributes, options) {
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
