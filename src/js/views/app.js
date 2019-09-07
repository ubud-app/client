'use strict';

import $ from 'zepto';
import DataHelper from '../helpers/data';
import ConfigurationHelper from '../helpers/configuration';

import BaseView from './_';
import HeaderView from './header';
import SidebarView from './sidebar';
import TermsNotificationView from './termsNotification';

/**
 * AppView
 *
 * @module views/app
 * @class AppView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const AppView = BaseView.extend({
    el: '#app',

    render () {
        this.header = new HeaderView().prependTo(this);
        this.sidebar = new SidebarView().appendTo(this);

        this.setupTermsNotification();
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
    },

    setupTermsNotification () {
        const user = DataHelper.getUser();
        this.live(user);

        let view = null;
        this.listenToAndCall(user, 'change:terms', () => {
            if(
                user.get('terms') &&
                user.get('terms').current &&
                user.get('terms').current.version !== user.get('terms').accepted &&
                !view
            ) {
                view = new TermsNotificationView({model: user}).prependTo(this, '.app__content');
            }
            else if(
                user.get('terms') &&
                user.get('terms').current &&
                user.get('terms').current.version === user.get('terms').accepted &&
                view
            ) {
                view.remove();
                view = null;
            }
        });
    }
});

export default AppView;
