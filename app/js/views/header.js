'use strict';

import $ from 'jquery';
import gravatar from 'gravatar-url';
import BaseView from './_';
import DataHelper from '../helpers/data';
import HeaderTemplate from '../../templates/header.handlebars';

/**
 * @module views/header
 * @class HeaderView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'header',
	className: 'header',

	async render () {
		const user = await DataHelper.getUser().wait();
		user.live(this);

		this.$el.html(HeaderTemplate({
			user: user.toJSON(),
		}));

		const $gravatar = this.$('.header_item-user-img');
		this.listenToAndCall(user, 'change:email', function() {
			$gravatar.empty();

			$('<img />').attr({
				src: gravatar(user.get('email'), {size: (window.devicePixelRatio || 1) * 60})
			}).appendTo($gravatar);
		});
	}
});
