'use strict';

import {DateTime} from 'luxon';
import {captureException} from '@sentry/browser';
import {Collection} from 'backbone';
import {bindAll, isFunction} from 'underscore';
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

    filterTest (data) {
        return !this._filter.find(([, _filter]) => {

            // return true if computer says no!
            const [comparator, attribute, values] = _filter;
            let dataValue = data[attribute] || data[attribute + 'Id'];
            if(attribute === 'month' && dataValue === undefined && data.time) {
                dataValue = DateTime.fromISO(data.time).toFormat('yyyy-LL');
            }

            if (comparator === '=') {
                return !values.includes(dataValue);
            }
            else if(comparator === '>=') {
                return !values.find(value => dataValue >= value);
            }
            else if(comparator === '<=') {
                return !values.find(value => dataValue <= value);
            }
            else if(comparator === '>') {
                return !values.find(value => dataValue > value);
            }
            else if(comparator === '<') {
                return !values.find(value => dataValue < value);
            }
            else {
                const error = new Error(`Unsupported comparator "${comparator}".`);
                captureException(error);
                return true;
            }
        });
    },

    async wait () {
        return DataHelper.wait(this);
    }
});

export default BaseCollection;
