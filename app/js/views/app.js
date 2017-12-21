'use strict';

import BaseView from './_';
import $ from 'jquery';
import HeaderView from './header';
import SidebarView from './sidebar';
import StringHelper from '../helpers/string';

/**
 * @module views/app
 * @class AppView
 * @augments BaseView
 */
export default BaseView.extend({
    el: '#app',
    child: null,

    /**
     * Renders the App View and all it's children view.
     * @returns {AppView}
     */
    render() {
        const v = this;

        v.header = new HeaderView().appendTo(v);
        v.sidebar = new SidebarView().appendTo(v);

        v.$content = $('<div class="app_content" />').appendTo(v.$el);
        v.$el.find('.app__loader').removeClass('app__loader--initialize');

        return this;
    },

    /**
     * Renders a View in content area
     *
     * @param {BaseView} view View to render now
     * @returns {AppView}
     */
    renderView(view) {
        const v = this;

        if (v.child) {
            v.child.remove();
        }

        v.child = view;
        view.appendTo(v.$content, v);

        $('body').scrollTop(0);
        
        return v;
    },

    /**
     * Sets the <title /> value
     * @param {String} title
     */
    setTitle(title) {
        let t = 'DWIMM';
        if (title) {
            t += ' | ' + StringHelper.string(title);
        }

        $('title').text(t);
    }
});
