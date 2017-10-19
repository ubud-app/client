'use strict';

import BaseView from './_';
import DocumentSettingsAccountView from './documentSettingsAccount';

/**
 * @module views/documentSettingsAccounts
 * @class DocumentSettingsAccountsView
 * @augments BaseView
 */
export default BaseView.extend({
	tagName: 'ul',
	className: 'document-settings-accounts',

	async render () {
		this.collection = this.model.getAccounts().live(this);
		this.listenTo(this.collection, 'add', this.addAccount);
		this.listenToAndCall(this.collection, 'add remove reset', this.showOrHideEmptyMessage);
		this.collection.each(this.addAccount);
	},

	showOrHideEmptyMessage () {
		this.$('.document-settings-accounts_empty').toggleClass(
			'document-settings-accounts_empty--hidden',
			this.collection.length > 0
		);
	},

	addAccount (account) {
		const view = new DocumentSettingsAccountView({account: account, document: this.model}).appendTo(this, this.$el);
		this.listenTo(this.collection, 'remove', removed => {
			if (removed.id === account.id) {
				view.remove();
			}
		});
	}
});
