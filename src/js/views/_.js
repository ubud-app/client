'use strict';

import _ from 'underscore';
import $ from 'zepto';
import {captureException} from '@sentry/browser';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';

import {View} from 'backbone';

/**
 * @module views/_view
 * @class View
 * @augments Backbone.View
 * @author Sebastian Pekarek
 */
const BaseView = View.extend({

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
        else if (parent instanceof View) {
            $appendTo = parent.$el;
        }
        else {
            throw new Error('parent has to be either an jQuery-Object or another View to append this View to');
        }

        // fill $appendTo
        if (child instanceof $) {
            $appendTo = child;
        }
        else if (child instanceof View) {
            $appendTo = child.$el;
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
            if (parent instanceof View) {
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
        this.listenTo(object, 'error', (object, error) => {
            if (String(error).includes('Not Found')) {
                this.remove();

                AppHelper.navigate('', {trigger: true});
            }
        });
        this.listenTo(DataHelper, 'socket:ready', () => {
            if (!object.isSyncing()) {
                object.fetch();
            }
        });

        return stop;
    },

    activateModal () {
        setTimeout(() => {
            this.$el.removeClass('b-modal--hidden');
        }, 0);

        this.hide = async () => {
            this.trigger('modal-hide');
            this.$el.removeClass('loading');
            this.$el.addClass('b-modal--hidden');
            await new Promise(cb => {
                setTimeout(cb, 300);
            });
            this.remove();
        };

        const closeByEscHandler = e => {
            if (
                e.keyCode === 27 &&

                // used in TransactionDetailsView, need to be refactored… 🙈
                !this.data?.fields?.autoCompletionCreateText &&
                (!this.data?.autoCompletion || this.data.autoCompletion.length === 0)
            ) {
                this.hide().catch(error => {
                    captureException(error);
                });
            }
        };

        $('body')
            .css('overflow', 'hidden')
            .on('keydown', closeByEscHandler);

        this.once('remove', () => {
            $('body')
                .css('overflow', '')
                .off('keydown', closeByEscHandler);
        });
    },

    pushAt (collection, model, array, object, getId = o => o.id) {
        if (array.length === 0) {
            array.push(object);
            return;
        }

        const i = collection.indexOf(model);
        if (i === -1 && array.includes(object)) {
            array.splice(array.indexOf(object), 1);
            return;
        }
        if (i === -1) {
            return;
        }

        const oldIndex = array.indexOf(object);
        let j = array.findIndex(o => {
            const m = collection.get ? collection.get(getId(o)) : collection.find(m => getId(m));
            return collection.indexOf(m) >= i;
        });
        if (j === -1) {
            j = array.length;
        }

        if(oldIndex > -1 && oldIndex !== j) {
            array.splice(oldIndex, 1);
        }
        if(oldIndex !== j) {
            array.splice(j, 0, object);
        }
    }
});

export default BaseView;
