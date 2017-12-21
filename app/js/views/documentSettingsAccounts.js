'use strict';

import BaseView from './_';
import DocumentSettingsAccountsTemplate from '../../templates/documentSettingsAccounts.handlebars';
import DocumentSettingsAccountView from './documentSettingsAccount';

/**
 * @module views/documentSettingsAccounts
 * @class DocumentSettingsAccountsView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'ul',
    className: 'document-settings-accounts loading',

    async render() {
        this.$el.html(DocumentSettingsAccountsTemplate());
        this.collection = this.model.getAccounts().live(this);
        this.listenTo(this.collection, 'add', this.addAccount);
        this.listenToAndCall(this.collection, 'add remove reset sync request', this.showOrHideEmptyMessage);
        this.collection.each(this.addAccount);

        this.listenToOnce(this.collection, 'sync', () => {this.$el.removeClass('loading');});
    },

    showOrHideEmptyMessage() {
        this.$('.document-settings-accounts_empty').toggleClass(
            'document-settings-accounts_empty--visible',
            this.collection.length === 0 && !this.collection.syncing
        );
    },

    addAccount(account) {
        const view = new DocumentSettingsAccountView({account: account, document: this.model}).appendTo(this, this.$el);
        this.listenTo(this.collection, 'remove', removed => {
            if (removed.id === account.id) {
                view.remove();
            }
        });
    }
});
