'use strict';

import BaseView from './_';
import $ from 'jquery';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import SidebarTemplate from '../../templates/sidebar.handlebars';

/**
 * @module views/sidebar
 * @class SidebarView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'nav',
    className: 'sidebar sidebar--hidden',

    async render() {
        this.$el.html(SidebarTemplate());

        const documents = await DataHelper.getDocuments().wait();
        this.listenToAndCall(AppHelper.router(), 'route', () => {
            const document = documents.get(location.hash.substr(1).split('/')[0]);
            if (!document) {
                this.$el.addClass('sidebar--hidden');
                return;
            }

            this.$('.sidebar_item-link').each(function () {
                const $a = $(this);
                $a.attr('href', '#' + document.id + '/' + $a.data('href'));
            });

            this.$el.addClass('sidebar--mini');
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {
                this.$el.removeClass('sidebar--mini');
            }, 2000);

            this.$el.removeClass('sidebar--hidden');
        });
    }
});
