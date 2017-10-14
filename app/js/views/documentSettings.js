'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';
import DocumentSettingsTemplate from '../../templates/documentSettings.handlebars';

/**
 * @module views/documentSettings
 * @class DocumentSettingsView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'document-settings app_layout--page',
	events: {
		'click .document-settings_destroy': 'destroyDocument'
	},

	documentId: null,

	_initialize(options) {
		this.documentId = options.documentId;
	},

	async render () {
		AppHelper.title('documentSettings.title');

		const documents = await DataHelper.getDocuments().wait();
		this.model = documents.get(this.documentId);
		if(!this.model) {
			AppHelper.navigate('/', {trigger: true, replace: true});
		}

		this.model.live(this);
		this.$el.html(DocumentSettingsTemplate());
		this.listenToOnce(this.model, 'destroy', function() {
			AppHelper.navigate('/', {trigger: true, replace: true});
		});
	},

	destroyDocument() {
		if(!confirm(StringHelper.string('documentSettings.confirm'))) {
			return;
		}

		this.model.destroy();
	}
});
