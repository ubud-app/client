'use strict';

import $ from 'jquery';
import gravatar from 'gravatar-url';
import BaseView from './_';
import AppHelper from '../helpers/app';
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

    events: {
        'click .header_settings': 'headerClick'
    },

    async render() {
        const user = await DataHelper.getUser().wait();
        user.live(this);

        this.$el.html(HeaderTemplate({
            user: user.toJSON(),
        }));

        const $gravatar = this.$('.header_item-user-img');
        this.listenToAndCall(user, 'change:email', function () {
            $gravatar.empty();

            $('<img />').attr({
                src: gravatar(user.get('email'), {size: (window.devicePixelRatio || 1) * 60})
            }).appendTo($gravatar);
        });

        const documents = await DataHelper.getDocuments().wait();
        const $documentSettings = this.$el.find('.header_dropdown_item--documentSettings');
        const $documentReconcile = this.$el.find('.header_dropdown_item--documentReconcile');
        const $documentSettingsLink = $documentSettings.children('a');
        const $documentReconcileLink = $documentReconcile.children('a');

        this.listenToAndCall(AppHelper.router(), 'route', () => {
            const document = documents.get(location.hash.substr(1).split('/')[0]);
            $documentSettings.toggleClass('header_dropdown_item--hidden', !document);
            $documentReconcile.toggleClass('header_dropdown_item--hidden', !document);
            if (!document) {
                return;
            }

            $documentSettingsLink.attr('href', '#' + document.id + '/settings');
            $documentReconcileLink.attr('href', '#' + document.id + '/reconcile');
        });
    },

    /**
     * Used to do nothing when clicking on cog.
     * Has to be a link for tablet users…
     *
     * @param e
     */
    headerClick(e) {
        e.preventDefault();
    }
});
