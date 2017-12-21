'use strict';

import BaseView from './_';
import DocumentSettingsUserTemplate from '../../templates/documentSettingsUser.handlebars';

/**
 * @module views/documentSettingsUser
 * @class DocumentSettingsUserView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'document-settings-user',
    events: {
        'change .document-settings-user_access': 'update'
    },

    _initialize(options) {
        this.document = options.document;
    },

    render() {
        this.$el.html(DocumentSettingsUserTemplate({
            document: this.document.toJSON(),
            user: this.model.toJSON()
        }));

        this.document.live(this);
        this.model.live(this);

        // access
        const $access = this.$('.document-settings-user_access');
        const updateAccess = () => {
            $access.prop(
                'checked',
                this.model.get('isAdmin') || !!this.document.get('users').find(u => u.id === this.model.id)
            );
        };

        this.listenToAndCall(this.model, 'change:isAdmin', () => {
            $access.prop('disabled', this.model.get('isAdmin'));
            updateAccess();
        });
        this.listenToAndCall(this.document, 'change:users', () => {
            updateAccess();
        });

        // email
        const $email = this.$('.document-settings-user_email');
        this.listenToAndCall(this.model, 'change:email', () => {
            $email.text(this.model.get('email'));
        });

        // admin
        const $admin = this.$('.document-settings-user_admin');
        this.listenToAndCall(this.model, 'change:isAdmin', () => {
            $admin.toggleClass('document-settings-user_admin--hidden', !this.model.get('isAdmin'));
        });
    },
    async update() {
        const hasAccess = this.$('.document-settings-user_access').is(':checked');
        const users = this.document.get('users');

        if(hasAccess) {
            users.push({id: this.model.id, email: this.model.get('email')});
        }else{
            this.document.set('users', users.filter(u => u.id !== this.model.id));
        }

        await this.document.save();
    }
});
