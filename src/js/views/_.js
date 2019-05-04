'use strict';

const DataHelper = require('../helpers/data');

const Backbone = require('backbone');
const _ = require('underscore');
const $ = require('zepto');

/**
 * @module views/_view
 * @class View
 * @augments Backbone.View
 * @author Sebastian Pekarek
 */
module.exports = Backbone.View.extend({

    /**
     * Automatically bind functions of inherited
     * views to correct 'this' context
     *
     * @param {Object} [options]
     * @returns {View}
     */
    initialize (options) {
        for (const i in this) {
            if (_.isFunction(this[i])) {
                _.bindAll(this, i);
            }
        }

        if (_.isFunction(this._initialize)) {
            this._initialize(options || {});
        }

        this.trigger('initialized');
        return this;
    },

    /**
     * appendTo($parent)
     * Appends the view to another Backbone View
     *
     * @param {jQuery|View} parent Either an jQuery-Object or another View to append this View to
     * @param {jQuery|String} [child] Either an Selector or the real jQuery Object to append the View to
     * @param {Object} [options] Options for appendTo
     * @param {String} [options.appendMethod] Method to run on jQuery Object to append it, defaults to `appendTo`
     * @returns {View}
     */
    appendTo (parent, child, options = {}) {
        let $appendTo;

        // check parent
        if (parent instanceof $) {
            $appendTo = parent;
        }
        else if (parent instanceof Backbone.View) {
            $appendTo = parent.$el;
        }
        else {
            throw new Error('parent has to be either an jQuery-Object or another View to append this View to');
        }

        // fill $appendTo
        if (child instanceof $) {
            $appendTo = child;
        }
        else if (_.isString(child)) {
            $appendTo = $appendTo.find(child);
        }
        else if (_.isObject(child)) {
            options = _.extend({}, child);
        }

        const appendMethod = options.appendMethod || 'appendTo';
        this.$el[appendMethod]($appendTo);

        // render if required
        if (!this._rendered) {
            this.render();

            // remove child on parent.remove
            if (parent instanceof Backbone.View) {
                parent.once('remove', () => {
                    this.remove();
                });
            }

            this._rendered = true;
        }

        return this;
    },

    /**
     * prependTo($parent)
     * Prepends the view to another Backbone View
     *
     * @param {jQuery|View} parent Either an jQuery-Object or another View to append this View to
     * @param {jQuery|String} [child] Either an Selector or the real jQuery Object to append the View to
     * @param {String} [appendMethod] Method to run on jQuery Object to append it, defaults to `prependTo`
     * @returns {View}
     */
    prependTo (parent, child, appendMethod) {
        appendMethod = appendMethod || 'prependTo';
        this.appendTo(parent, child, {appendMethod});
        return this;
    },

    /**
     * Works like backbone's listenTo, but also executes
     * the given callback once. Callback only gets the
     * object, nothing else.
     *
     * @param {Backbone.Event} object
     * @param {String} event
     * @param {Function} callback
     * @returns {View}
     */
    listenToAndCall (object, event, callback) {
        this.listenTo(object, event, function () {
            callback(object);
        });

        callback(object);
        return this;
    },

    /**
     * remove()
     * Removes the view
     */
    remove () {
        this.trigger('remove');
        if (this.$el) {
            this.$el.remove();
        }

        this.stopListening();
        this.trigger('removed');
    },

    /**
     * Start an interval, which stops, when
     * the view gets removed
     *
     * @param {function} method
     * @param {number} interval
     * @param {boolean} now
     */
    async interval (method, interval = 10000, now = false) {
        const m = () => {
            return method();
        };

        const i = setInterval(m, interval);
        if (now) {
            await m();
        }

        this.on('remove', () => {
            clearInterval(i);
        });
    },

    /**
     * Let the current view subscribe to
     * the given model or collection
     *
     * @param {Model|Collection} object
     * @returns {function} stop function
     */
    live (object) {
        const stop = DataHelper.live(object);
        this.once('remove', () => {
            stop();
        });

        return stop;
    }
});
