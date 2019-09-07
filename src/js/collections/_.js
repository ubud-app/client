'use strict';

import {Collection} from 'backbone';
import {isFunction, bindAll} from 'underscore';
import DataHelper from '../helpers/data';

const BaseCollection = Collection.extend({
    model: null,
    baseURL: null,

    sync: DataHelper.sync,
    _filter: [],

    initialize () {
        for (let i in this) {
            if (Object.prototype.hasOwnProperty.call(this, i) && isFunction(this[i]) && !Collection.prototype[i]) {
                bindAll(this, i);
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

export default BaseCollection;
