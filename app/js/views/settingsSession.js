'use strict';

import BaseView from './_';
import SettingsSessionTemplate from '../../templates/settingsSession.handlebars';

/**
 * @module views/settingsSession
 * @class SettingsSession
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'settings-session',

    render() {
        this.$el.html(SettingsSessionTemplate({
            session: this.model.toJSON()
        }));

        this.model.live(this);

        this.listenToAndCall(this.model, 'change:name', () => {
            this.$('.settings-session_name').text(this.model.get('name'));
        });
    }
});
