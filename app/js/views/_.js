'use strict';

import {View, Collection} from 'backbone';
import _ from 'underscore';
import $ from 'jquery';

/**
 * @module views/_
 * @class BaseView
 * @augments Backbone.View
 */
export default class BaseView extends View {
    constructor (...args) {
        super(...args);
    }

    /**
     * Automatically bind functions of inherited views to correct 'this' context
     *
     * @param {Object} [options]
     * @returns {BaseView}
     */
    initialize (options) {
        const v = this;

        for (let i in v) {
            if (_.isFunction(v[i])) {
                _.bindAll(v, i);
            }
        }

        if (_.isFunction(v._initialize)) {
            v._initialize(options || {});
        }

        return v;
    }

    /**
     * appendTo($parent)
     * Appends the view to another Backbone View
     *
     * @param {jQuery|BaseView} parent Either an jQuery-Object or another View to append this View to
     * @param {jQuery|String} [child] Either an Selector or the real jQuery Object to append the View to
     * @param {Object} [options]
     * @param {String} [options.appendMethod] Method to run on jQuery Object to append it, defaults to `appendTo`
     * @param {Boolean|Backbone.Collection} [options.order] Append in correct order of the given Collection, defaults to `parent.collection`
     * @param {Backbone.Model} [options.model] Required if child.model is not set and ordering is enabled
     * @returns {BaseView}
     */
    appendTo (parent, child, options) {
        options = options || {};

        const v = this;
        const appendMethod = options.appendMethod || 'appendTo';
        const model = options.model || v.model;
        let $appendTo;
        let order;

        if (parent instanceof $) {
            $appendTo = parent;
        }
        else if (parent instanceof View) {
            $appendTo = parent.$el;
        }
        else {
            throw new Error('Parameter `parent` has to be either a jQuery object or a view to append this view to');
        }

        if (child instanceof $) {
            $appendTo = child;
        }
        else if (_.isString(child)) {
            $appendTo = $appendTo.find(child);
        }

        if (options.order instanceof Collection) {
            order = options.order;
        }
        else if (options.order === true && model && model.collection instanceof Collection) {
            order = child.model.collection;
        }
        else if (options.order === true && parent.collection instanceof Collection) {
            order = parent.collection;
        }

        if (order) {
            v._appendAt($appendTo, order, model);
        } else {
            v.$el[appendMethod]($appendTo);
        }

        try {
            v.render();
        }
        catch (err) {
            console.log(err);
        }

        if (parent instanceof View) {
            parent.once('remove', function () {
                v.remove();
            });
        }

        return this;
    }

    /**
     * prependTo($parent)
     * Prepends the view to another Backbone View
     *
     * @param {jQuery|BaseView} parent Either an jQuery-Object or another View to append this View to
     * @param {jQuery|String} [child] Either an Selector or the real jQuery Object to append the View to
     * @param {String} [appendMethod] Method to run on jQuery Object to append it, defaults to `prependTo`
     * @returns {BaseView}
     */
    prependTo (parent, child, appendMethod) {
        appendMethod = appendMethod || 'prependTo';
        this.appendTo(parent, child, {appendMethod});
        return this;
    }


    /**
     * Internally used to add views to an jQuery object in correct order
     *
     * @param {jQuery} $appendTo
     * @param {Backbone.Collection} collection Collection
     * @param {Backbone.Model} model Model
     * @private
     */
    _appendAt ($appendTo, collection, model) {
        const v = this;
        const $children = $appendTo.children();
        const index = collection.indexOf(model);
        let inDOM = false;

        v.$el.attr('data-id', model.id);

        if (!$children.length) {
            v.$el.appendTo($appendTo);
            inDOM = true;
        }

        $children.each(function () {
            const $child = $(this);
            const childModel = collection.get($child.attr('data-id'));
            const childIndex = collection.indexOf(childModel);

            if (!childModel || childIndex < 0) {
                return;
            }

            if ($child && index < childIndex && !inDOM) {
                $child.before(v.$el);
                inDOM = true;
            }
        });

        if (!inDOM) {
            v.$el.appendTo($appendTo);
            inDOM = true;
        }
    }


    /**
     * Like Backbone's listenTo, but also runs the callback once…
     *
     * @param {Backbone.Event} object
     * @param {String} event
     * @param {Function} callback
     * @returns {BaseView}
     */
    listenToAndCall (object, event, callback) {
        this.listenTo(object, event, function () {
            callback(object);
        });

        callback(object);
        return this;
    }


    /**
     * Renders all child views and create the required
     * listenTo to add/remove child views if required…
     *
     * @param {BaseView} ChildView
     * @param {Object} [options]
     * @param {BaseCollection} [options.collection] Collection, otherwise this.collection is used
     * @param {Object} [options.childOptions] Options to pass in new ChildView()
     * @param {String} [options.modelAttr="model"] Attribute where the childs model is passed in. Defaults to `model`
     * @param {jQuery|String} [options.where] Where append all the views?
     * @param {function} [options.filter] Filter method to dynamically apply on children
     * @returns {BaseView}
     */
    renderChildren (ChildView, options) {
        const v = this;
        const collection = options.collection || v.collection;

        const add = function (model) {
            const view = new ChildView(_.extend({}, options.childOptions, {
                [options.modelAttr || 'model']: model
            }));
            let rendered = false;

            if (options.filter) {
                if (options.filter(model)) {
                    rendered = true;
                    view.appendTo(v, options.where || null, {order: collection, model: model});
                }

                v.listenToAndCall(model, 'change', () => {
                    if (options.filter(model) && !rendered) {
                        rendered = true;
                        view.appendTo(v, options.where || null, {order: collection, model: model});
                    }
                    else if (options.filter(model) && !rendered) {
                        rendered = false;
                        view.remove();
                    }
                });
            } else {
                rendered = true;
                view.appendTo(v, options.where || null, {order: collection, model: model});
            }

            v.listenTo(collection, 'remove', removed => {
                if (removed.id === model.id && rendered) {
                    view.remove();
                }
            });
        };

        v.listenTo(collection, 'add', add);
        collection.each(add);
        return this;
    }


    /**
     * remove()
     * Entfernt die View
     * @returns {BaseView}
     */
    remove () {
        const v = this;
        v.trigger('remove');
        if (v.$el) {
            v.$el.remove();
        }
        v.stopListening();
        v.trigger('removed');
        return v;
    }
}