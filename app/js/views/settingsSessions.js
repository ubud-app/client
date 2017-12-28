'use strict';

import BaseView from './_';
import DataHelper from '../helpers/data';
import SettingsSession from './settingsSession';

/**
 * @module views/settingsSessions
 * @class SettingsSessionsView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'ul',
    className: 'settings-sessions loading',

    async render() {
        const user = await DataHelper.getUser().wait();
        this.collection = await user.getSessions().live(this).wait();
        this.listenTo(this.collection, 'add', this.addSession);
        this.collection.each(this.addSession);

        this.listenToOnce(this.collection, 'sync', () => {this.$el.removeClass('loading');});
    },

    addSession(model) {
        const view = new SettingsSession({model}).appendTo(this, this.$el);
        this.listenTo(this.collection, 'remove', removed => {
            if (removed.id === model.id) {
                view.remove();
            }
        });
    }
});
