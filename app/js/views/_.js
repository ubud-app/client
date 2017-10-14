'use strict';

import {View} from 'backbone';
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
	 * @param {String} [appendMethod] Method to run on jQuery Object to append it, defaults to `appendTo`
	 * @returns {BaseView}
	 */
	appendTo (parent, child, appendMethod) {
		const v = this;
		let $appendTo;

		appendMethod = appendMethod || 'appendTo';

		if (parent instanceof $) {
			$appendTo = parent;
		}
		else if (parent instanceof View) {
			$appendTo = parent.$el;

			if (child instanceof $) {
				$appendTo = child;
			}
			else if (_.isString(child)) {
				$appendTo = $appendTo.find(child);
			}
		}

		v.$el[appendMethod]($appendTo);

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
		this.appendTo(parent, child, appendMethod);
		return this;
	}


	listenToAndCall (object, event, callback) {
		this.listenTo(object, event, function () {
			callback(object);
		});

		callback(object);
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