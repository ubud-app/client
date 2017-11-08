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
    wait() {
        return DataHelper.wait(this);
    },
    live(view) {
        DataHelper.live(this, view);
        return this;
    },
    _buildSubCollection(options) {
        const m = this;
        const data = m.get(options.attribute) || [];
        const collection = new options.collection(data);

        // live binding
        if (options.view) {
            options.view.listenTo(m, 'change:' + options.attribute, function () {
                const data = m.get(options.attribute) || [];
                if (JSON.stringify(data) !== JSON.stringify(collection.toJSON())) {
                    collection.set(data);
                    collection.trigger('update');
                }
            });

            const updateParent = () => {
                const data = collection.toJSON();
                if (JSON.stringify(data) !== JSON.stringify(m.get(options.attribute))) {
                    m.set(options.attribute, data);
                    collection.trigger('update');
                }
            };

            options.view.listenTo(collection, 'add', model => {
                options.view.listenToAndCall(model, 'change', updateParent);
            });
            options.view.listenTo(collection, 'reset', updateParent);
            options.view.listenTo(collection, 'remove', model => {
                options.view.stopListening(model, 'change', updateParent);
                updateParent();
            });

            collection.each(model => {
                options.view.listenToAndCall(model, 'change', updateParent);
            });
        }

        // save()
        collection.save = function (attributes, options) {
            if (attributes) {
                throw new Error('save() `attributes` is unsupported for collections build with _buildSubCollection(), sorry…');
            }

            m.set(options.attribute, collection.toJSON());
            return m.save({}, options || {});
        };

        return collection;
    }
});
