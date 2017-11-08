'use strict';

import {Collection} from 'backbone';
import _ from 'underscore';
import DataHelper from '../helpers/data';

export default Collection.extend({
    model: null,
    baseURL: null,

    sync: DataHelper.sync,

    initialize: function () {
        const m = this;

        for (let i in m) {
            if (m.hasOwnProperty(i) && _.isFunction(m[i]) && !Collection.prototype[i]) {
                _.bindAll(m, i);
            }
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