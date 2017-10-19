'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import AccountModel from '../models/account';
import DocumentAccountSettingsTemplate from '../../templates/documentAccountSettings.handlebars';

/**
 * @module views/documentAccountSettings
 * @class DocumentAccountSettingsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'document-account-settings app_layout--page',

	_initialize (options) {
		this.documentId = options.documentId;
		this.accountId = options.accountId;
	},

	async render () {
		AppHelper.title('documentAccountSettings.title');

		if(this.accountId) {
			this.model = await new AccountModel({id: this.accountId}).wait();
			if (!this.model) {
				AppHelper.navigate('/', {trigger: true, replace: true});
			}

			this.model.live(this);
		}else{
			this.model = new AccountModel({documentId: this.documentId, type: 'cash'});
		}

		this.$el.html(DocumentAccountSettingsTemplate());

		// ID
		this.listenTo(this.model, 'change:id', () => {
			AppHelper.navigate(this.documentId + '/settings/accounts/' + this.model.id);
		});

		// Name
		const $name = this.$('#document-account-settings_name');
		this.listenToAndCall(this.model, 'change:name', () => {
			$name.val(this.model.get('name'));
		});
		$name.on('keyup', () => {
			this.model.save({name: $name.val()});
		});

		// Type
		const $type = this.$('#document-account-settings_type');
		this.listenToAndCall(this.model, 'change:type', () => {
			$type.val(this.model.get('type'));
		});
		$type.on('change', () => {
			this.model.set({type: $type.val()});

			if(this.model.has('name')) {
				this.model.save();
			}
		});

		// @todo number

		// @todo hidden
	}
});
