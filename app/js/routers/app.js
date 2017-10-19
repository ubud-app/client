'use strict';

import {Router as BackboneRouter} from 'backbone';
import * as _ from 'underscore';
import AppView from '../views/app';
import DashboardView from '../views/dashboard';
import PlaceholderView from '../views/placeholder';
import DocumentSettingsView from '../views/documentSettings';
import DocumentAccountSettingsView from '../views/documentAccountSettings';
import TransactionsView from '../views/transactions';

export default BackboneRouter.extend({
	routes: {
		'': 'dashboard',
		':document/budget': 'documentBudget',
		':document/reports': 'documentReports',
		':document/transactions': 'documentTransactions',
		':document/settings': 'documentSettings',
		':document/settings/accounts/new': 'documentAccountSettings',
		':document/settings/accounts/:accountId': 'documentAccountSettings',
		'settings': 'settings',
		'*path': 'dashboard'
	},

	initialize () {
		const r = this;
		for (let i in r) {
			if (_.isFunction(r[i])) {
				_.bindAll(r, i);
			}
		}

		r.view = new AppView().render();
	},

	async dashboard () {
		const view = new DashboardView();
		this.view.renderView(view);
	},
	async documentBudget() {
		const view = new PlaceholderView({view: 'budget'});
		this.view.renderView(view);
	},
	async documentReports() {
		const view = new PlaceholderView({view: 'reports'});
		this.view.renderView(view);
	},
	async documentTransactions(documentId) {
		const view = new TransactionsView({documentId});
		this.view.renderView(view);
	},
	async documentSettings(documentId) {
		const view = new DocumentSettingsView({documentId});
		this.view.renderView(view);
	},
	async documentAccountSettings(documentId, accountId) {
		const view = new DocumentAccountSettingsView({documentId, accountId});
		this.view.renderView(view);
	},
	async settings() {
		const view = new PlaceholderView({view: 'settings'});
		this.view.renderView(view);
	}
});
