'use strict';

import BaseView from './_';
import DashboardItemTemplate from '../../templates/dashboardItem.handlebars';

/**
 * @module views/dashboardItem
 * @class DashboardItemView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'dashboard-item',
    events: {
        'submit .dashboard-item_form': 'submit',
        'blur .dashboard-item_input': 'submit'
    },

    render() {
        this.$el.html(DashboardItemTemplate({document: this.model.toJSON()}));

        if (this.model.id) {
            this.model.live(this);
        } else {
            this.listenToOnce(this.model, 'change:id', () => {
                this.model.live(this);
            });
        }
        this.listenToAndCall(this.model, 'change:id change:name', this.updateInput);
    },

    async submit(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (!this._canSubmit) {
            return;
        }
        this._canSubmit = false;

        const $input = this.$('.dashboard-item_input');
        $input.blur();
        $input.prop('readonly', true);
        const name = $input.val();
        if (!name) {
            this.model.collection.remove(this.model);
            this.remove();
            return;
        }

        await this.model.save({name});
        this.$('.dashboard-item_settings').attr('href', '#' + this.model.id + '/settings');
    },

    updateInput() {
        const $input = this.$('.dashboard-item_input');

        if (!this.model.id) {
            $input.prop('readonly', false).focus();
            this._canSubmit = true;
        } else {
            this._canSubmit = false;
            $input.blur().prop('readonly', true);
        }

        $input.val(this.model.get('name'));
    }
});
