'use strict';

const $ = require('zepto');
const View = require('./_');
const ConfigurationHelper = require('../helpers/configuration');

const HeaderView = require('./header');
const SidebarView = require('./sidebar');


/**
 * AppView
 *
 * @module views/app
 * @class AppView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    el: '#app',

    render () {
        this.header = new HeaderView().prependTo(this);
        this.sidebar = new SidebarView().appendTo(this);
    },

    /**
     * Renders a view
     *
     * @param {View} view View to render now
     * @returns {AppView}
     */
    renderView (view) {
        if(this.currentView) {
            this.currentView.remove();
        }

        $('body').scrollTop(0);
        view.appendTo(this, '.app__content');
        this.currentView = view;
        return this;
    },

    /**
     * Sets the <title /> value
     * @param {String} title
     */
    setTitle(title) {
        return this.header.setTitle(title || ConfigurationHelper.getString('app.name'));
    }
});
