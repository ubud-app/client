'use strict';

import BaseView from './_';
import StringHelper from '../helpers/string';
import DocumentSettingsAccountTemplate from '../../templates/documentSettingsAccount.handlebars';

/**
 * @module views/documentSettingsAccount
 * @class DocumentSettingsAccountView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'document-settings-account',
    events: {
        'click .document-settings-account_link': 'open'
    },

    _initialize(options) {
        this.account = options.account;
        this.document = options.document;
    },

    render() {
        this.$el.html(DocumentSettingsAccountTemplate({
            document: this.document.toJSON(),
            account: this.account.toJSON()
        }));
        this.account.live(this);

        this.listenToAndCall(this.account, 'change:name', () => {
            this.$('.document-settings-account_name').text(this.account.get('name'));
        });

        this.listenToAndCall(this.account, 'change:balance', () => {
            this.$('.document-settings-account_value').text(
                StringHelper.currency(this.document, this.account.get('balance'))
            );
        });
    }
});
