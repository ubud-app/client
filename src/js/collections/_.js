'use strict';

const {Collection} = require('backbone');
const _ = require('underscore');
const DataHelper = require('../helpers/data');

module.exports = Collection.extend({
    model: null,
    baseURL: null,

    sync: DataHelper.sync,
    _filter: [],

    initialize () {
        const m = this;

        for (let i in m) {
            if (m.hasOwnProperty(i) && _.isFunction(m[i]) && !Collection.prototype[i]) {
                _.bindAll(m, i);
            }
        }

        this._filter = [];
    },

    isSyncing () {
        return DataHelper.isSyncing(this);
    },

    isSynced () {
        return DataHelper.isSynced(this);
    },

    resetFilters () {
        this._filter = [];
        this._synced = false;
        return this;
    },

    filterById (ids) {
        return this.filterBy('id', ids);
    },

    filterBy (attribute, values, options = {}) {
        if (!Array.isArray(values) && values !== undefined) {
            values = [values];
        }
        if (!values || !values.length) {
            throw new Error('filterBy(): no IDs given!');
        }

        this._synced = false;
        this._filter.push([
            values.map(id => [attribute, id]),
            [options.comparator || '=', options.attribute || attribute, options.values || values]
        ]);

        return this;
    },

    async wait () {
        return DataHelper.wait(this);
    }
});