'use strict';

import $ from 'jquery';
import moment from 'moment';
import _ from 'underscore';

import BaseView from './_';
import BudgetContainerView from './budgetsContainer';

/**
 * @module views/budgetsContainers
 * @class BudgetsContainersView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'budgets-containers',

	_initialize (options) {
		this.document = options.document;
		this.parent = options.parent;
		this.width = 0;
		this.children = {};
		this.newestMonth = null;
		this.oldestMonth = null;
	},

	render () {
		const v = this;
		let m;

		v.$wrap = $('<div class="budgets-containers_wrap" />').appendTo(v.$el);
		v.newestMonth = moment().add(3, 'months').startOf('month');

		for (
			m = moment(v.newestMonth);
			m.isSameOrAfter(moment().subtract(3, 'months').startOf('month'));
			m.subtract(1, 'month')
		) {
			v.addContainer(moment(m));
		}

		v.oldestMonth = m;
		v.updatePosition();
		v._activateContainers();

		v.$el.scroll(_.debounce(this._activateContainers, 1000));
		v.$el.scroll(_.throttle(this._addContainers, 100));
	},

	addContainer (month) {
		const v = this;
		const view = new BudgetContainerView({
			month,
			document: v.document
		})[month.isSameOrAfter(v.newestMonth) ? 'appendTo' : 'prependTo'](v, v.$wrap);
		v.children[month.format('YYYYMM')] = view;

		v.width += view.$el.width() + 20;
		v.$wrap.css({width: v.width});
		return view;
	},

	updatePosition (animate) {
		const v = this;
		const {month} = v.parent.getPosition();
		const child = v.children[month.format('YYYYMM')];
		if (!child) {
			return;
		}

		let offset = child.$el.offset().left;

		// Sidebar
		offset -= 80;

		// Window width
		offset -= v.$el.width() / 2;

		// Element width
		offset += child.$el.outerWidth(true) / 2;

		// Enough to show next two months as well
		if ($(window).width() >= 1360) {
			offset += child.$el.outerWidth();
			offset += 20;
		}

		// Enough to show next month as well
		else if ($(window).width() >= 940) {
			offset += child.$el.outerWidth() / 2;
			offset += 10;
		}

		if (animate) {
			v.$el.animate({
				scrollLeft: offset
			}, 'slow');
		} else {
			v.$el.scrollLeft(offset);
		}
	},

	_activateContainers () {
		const v = this;
		const width = v.$el.width();

		_.each(v.children, child => {
			const offset = child.$el.offset().left;
			child.active(offset - 80 >= -1200 && offset < width + 880);
		});
	},
	_addContainers() {
		const v = this;
		const sl = v.$el.scrollLeft();

		if(sl < v.$el.width() * 1) {
			v.oldestMonth.subtract(1, 'month');

			const view = v.addContainer(moment(v.oldestMonth));
			v.$el.scrollLeft(sl + view.$el.outerWidth());
		}
		if(v.$wrap.width() - sl < v.$el.width() * 1) {
			v.newestMonth.add(1, 'month');
			v.addContainer(moment(v.newestMonth));
		}
	}
});
