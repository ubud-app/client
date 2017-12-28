'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import SettingsTemplate from '../../templates/settings.handlebars';
import SettingsSessionsView from './settingsSessions';

/**
 * @module views/settings
 * @class settingsView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'settings app_layout--page',

    async render() {
        AppHelper.title('settings.title');

        this.$el.html(SettingsTemplate());

        // Sessions
        new SettingsSessionsView({model: this.model}).appendTo(this, '.settings_sessions');
    }
});
