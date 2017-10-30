'use strict';

import $ from 'jquery';
import {defer} from 'underscore';
import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';
import BudgetModel from '../models/budget';
import CategoryModel from '../models/category';
import DocumentModel from '../models/document';
import AccountModel from '../models/account';
import FirstSetupTemplate from '../../templates/firstSetup.handlebars';

/**
 * @module views/firstSetup
 * @class FirstSetupView
 * @augments BaseView
 */
export default BaseView.extend({
	className: 'firstSetup',
	events: {
		'submit .firstSetup_form': 'submit',
		'click .firstSetup_form-close': 'close'
	},

	render () {
		AppHelper.title(StringHelper.string('firstSetup.title'));

		this.$el.html(FirstSetupTemplate());
		this.$('.firstSetup_form-input--email-1').focus();
	},

	async check () {
		this.model = await DataHelper.getUser().wait();

		return this.checkUser()
			.then(() => {
				return this.checkDocument();
			})
			.catch(e => {
				throw e;
			});
	},
	async checkUser () {
		if (this.model.get('email') !== 'setup@dwimm.org' && !this.model.get('needsPasswordChange')) {
			return Promise.resolve();
		}
		this.appendTo($('body'));

		return new Promise(resolve => {
			this.model.once('change:email', () => {
				this.remove();
				resolve();
			});
		});
	},
	async checkDocument () {
		const documents = await DataHelper.getDocuments().wait();
		if (documents.length === 1 && location.hash.length <= 1) {
			AppHelper.navigate(documents.first().id + '/budget', {trigger: 1});
		}
		if (documents.length > 0) {
			return Promise.resolve();
		}

		const document = new DocumentModel({
			name: StringHelper.string('firstSetup.newDocument.name'),
			settings: {
				language: window.navigator.languages ? window.navigator.languages[0] : StringHelper.string('firstSetup.newDocument.language')
			}
		});
		documents.add(document);
		await document.save();

		const walletAccount = new AccountModel({
			name: StringHelper.string('firstSetup.newDocument.accounts.wallet'),
			documentId: document.id,
			type: 'cash'
		});
		const pillowAccount = new AccountModel({
			name: StringHelper.string('firstSetup.newDocument.accounts.pillow'),
			documentId: document.id,
			type: 'cash'
		});

		const defaultCategory = new CategoryModel({
			name: StringHelper.string('firstSetup.newDocument.default.name'),
			documentId: document.id
		});
		const monthlyCategory = new CategoryModel({
			name: StringHelper.string('firstSetup.newDocument.monthly.name'),
			documentId: document.id
		});
		const insuranceCategory = new CategoryModel({
			name: StringHelper.string('firstSetup.newDocument.insurance.name'),
			documentId: document.id
		});
		const rainyDaysCategory = new CategoryModel({
			name: StringHelper.string('firstSetup.newDocument.rainyDays.name'),
			documentId: document.id
		});
		const goalsCategory = new CategoryModel({
			name: StringHelper.string('firstSetup.newDocument.goals.name'),
			documentId: document.id
		});
		await Promise.all([
			walletAccount.save(),
			pillowAccount.save(),
			defaultCategory.save(),
			monthlyCategory.save(),
			insuranceCategory.save(),
			rainyDaysCategory.save(),
			goalsCategory.save()
		]);

		const budgets = [];

		// Default
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.default.default'),
			categoryId: defaultCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.default.lostCash'),
			categoryId: defaultCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.default.clothing'),
			categoryId: defaultCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.default.food'),
			categoryId: defaultCategory.id
		});

		// Monthly
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.monthly.rent'),
			categoryId: monthlyCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.monthly.power'),
			categoryId: monthlyCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.monthly.water'),
			categoryId: monthlyCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.monthly.heating'),
			categoryId: monthlyCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.monthly.internet'),
			categoryId: monthlyCategory.id
		});

		// Insurance
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.insurance.liability'),
			categoryId: insuranceCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.insurance.health'),
			categoryId: insuranceCategory.id
		});

		// Rainy Days
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.rainyDays.birthdays'),
			categoryId: rainyDaysCategory.id
		});
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.rainyDays.christmas'),
			categoryId: rainyDaysCategory.id
		});

		// Saving Goals
		budgets.push({
			name: StringHelper.string('firstSetup.newDocument.goals.example'),
			categoryId: goalsCategory.id,
			goal: parseInt(StringHelper.string('firstSetup.newDocument.goals.value'), 10) || 1337
		});

		await Promise.all(budgets.map(d => new BudgetModel(d).save()));
		defer(() => {
			AppHelper.navigate(document.id + '/budget', {trigger: 1});
		});
		return Promise.resolve();
	},

	async submit (e) {
		e.preventDefault();

		const $email = [this.$('.firstSetup_form-input--email-1'), this.$('.firstSetup_form-input--email-2')];
		const $password = [this.$('.firstSetup_form-input--password-1'), this.$('.firstSetup_form-input--password-2')];

		if (!$email[0].val() || $email[0].val() !== $email[1].val()) {
			return this.error('1');
		}
		else if (!$password[0].val() || $password[0].val() !== $password[1].val()) {
			return this.error('2');
		}

		try {
			await this.model.save({
				email: $email[0].val(),
				password: $password[0].val()
			});
		}
		catch (err) {
			if (err && err.attributes.email) {
				return this.error('1');
			}
			else if (err && err.attributes.password) {
				return this.error('2');
			}
			else if (err && err.message) {
				alert(err.message);
			}
			else {
				throw err;
			}
		}
	},

	error: function (id) {
		const $form = this.$('.firstSetup_form-box--' + id).addClass('firstSetup_form-box--error');
		this.$('.firstSetup_submit').prop('disabled', false);

		if (id === '2') {
			this.$('.firstSetup_form-box--' + id + ' input').val('').first().focus();
		}

		setTimeout(() => {
			$form.removeClass('firstSetup_form-box--error');
		}, 900);
	},

	close () {
		DataHelper.logout();
	}
});
