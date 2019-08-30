'use strict';

import $ from 'zepto';
import {defer} from 'underscore';
import BaseView from './_';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import BudgetModel from '../models/budget';
import CategoryModel from '../models/category';
import DocumentModel from '../models/document';
import AccountModel from '../models/account';

import FirstSetupTemplate from '../../templates/firstSetup.html';

/**
 * @module views/firstSetup
 * @class FirstSetupView
 * @augments BaseView
 */
const FirstSetupView = BaseView.extend({
    className: 'firstSetup',

    render () {
        AppHelper.title(ConfigurationHelper.getString('firstSetup.title'));

        this.data = {
            form: {
                hideEmail: !this.changeMail(),
                emailRequired: this.changeMail(),
                email: ['', ''],
                password: ['', ''],
                error: [false, false],
                disabled: false,
                pawned: false
            }
        };
        this.listenToAndCall(DataHelper, 'socket:state', this.updateButton);
        this.listenToAndCall(this.model, 'request sync', this.updateButton);

        TemplateHelper.render({
            view: this,
            template: FirstSetupTemplate,
            data: this.data
        });

        setTimeout(() => {
            this.$('.first-setup__form-input--' + (this.changeMail() ? 'email' : 'password') + '-1').focus();
        }, 100);
    },

    updateButton () {
        const email = this.changeMail() ? this.data.form.email : [];
        const password = this.data.form.password;

        this.data.form.disabled = this.model.isSyncing() ||
            (this.changeMail() && (!email[0] || email[0] !== email[1])) ||
            (!password[0] || password[0] !== password[1]) ||
            (DataHelper.state() !== 'ready');
    },

    changeMail () {
        return this.model.get('email') === 'setup@ubud.club';
    },

    async check () {
        this.model = await DataHelper.getUser().wait();

        await this.checkUser();
        await this.checkDocument();
    },
    async checkUser () {
        if (!this.changeMail() && !this.model.get('needsPasswordChange')) {
            return;
        }

        this.appendTo(AppHelper.view(), $('body'));

        return new Promise(resolve => {
            this.once('success', () => {
                this.remove();
                resolve();
            });
        });
    },
    async checkDocument () {
        const documents = DataHelper.getDocuments();
        await documents.wait();

        if (documents.length === 1 && location.hash.length <= 1) {
            AppHelper.navigate(documents.first().id + '/budget', {trigger: 1});
        }
        if (documents.length > 0) {
            return;
        }

        const document = new DocumentModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.name'),
            settings: {
                language: ConfigurationHelper.getString('firstSetup.newDocument.language')
            }
        });
        documents.add(document);
        await document.save();

        const walletAccount = new AccountModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.accounts.wallet'),
            documentId: document.id,
            type: 'cash'
        });
        const pillowAccount = new AccountModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.accounts.pillow'),
            documentId: document.id,
            type: 'cash'
        });

        const defaultCategory = new CategoryModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.default.name'),
            documentId: document.id
        });
        const monthlyCategory = new CategoryModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.monthly.name'),
            documentId: document.id
        });
        const insuranceCategory = new CategoryModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.insurance.name'),
            documentId: document.id
        });
        const rainyDaysCategory = new CategoryModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.rainyDays.name'),
            documentId: document.id
        });
        const goalsCategory = new CategoryModel({
            name: ConfigurationHelper.getString('firstSetup.newDocument.goals.name'),
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
            name: ConfigurationHelper.getString('firstSetup.newDocument.default.default'),
            categoryId: defaultCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.default.lostCash'),
            categoryId: defaultCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.default.clothing'),
            categoryId: defaultCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.default.food'),
            categoryId: defaultCategory.id
        });

        // Monthly
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.monthly.rent'),
            categoryId: monthlyCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.monthly.power'),
            categoryId: monthlyCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.monthly.water'),
            categoryId: monthlyCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.monthly.heating'),
            categoryId: monthlyCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.monthly.internet'),
            categoryId: monthlyCategory.id
        });

        // Insurance
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.insurance.liability'),
            categoryId: insuranceCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.insurance.health'),
            categoryId: insuranceCategory.id
        });

        // Rainy Days
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.rainyDays.birthdays'),
            categoryId: rainyDaysCategory.id
        });
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.rainyDays.christmas'),
            categoryId: rainyDaysCategory.id
        });

        // Saving Goals
        budgets.push({
            name: ConfigurationHelper.getString('firstSetup.newDocument.goals.example'),
            categoryId: goalsCategory.id,
            goal: parseInt(ConfigurationHelper.getString('firstSetup.newDocument.goals.value'), 10) || 1337
        });

        await Promise.all(budgets.map(d =>
            new BudgetModel(d).save()
        ));
        defer(() => {
            AppHelper.navigate(document.id + '/settings', {trigger: 1});
        });
    },

    async submit (e) {
        e.preventDefault();

        const email = this.changeMail() ? this.data.form.email : [];
        const password = this.data.form.password;

        if (this.changeMail() && (!email[0] || email[0] !== email[1])) {
            return this.error(0);
        }
        else if (!password[0] || password[0] !== password[1]) {
            return this.error(1);
        }

        this.data.form.pawned = false;

        try {
            await this.model.save({
                email: this.changeMail() ? email[0] : this.model.get('email'),
                password: password[0]
            });

            this.trigger('success');
        }
        catch (err) {
            if(err.attributes.password && err.attributes.password.indexOf('Seems not to be secure') > -1) {
                this.data.form.pawned = true;
                return this.error(1);
            }
            else if (this.changeMail() && err && err.attributes.email) {
                return this.error(0);
            }
            else if (err && err.attributes.password) {
                return this.error(1);
            }
            else if (err && err.message) {
                alert(err.message);
            }
            else {
                throw err;
            }
        }
    },

    error (id) {
        this.data.form.error[id] = true;
        this.$('.firstSetup__form-box--' + id + ' input').val('').first().focus();

        setTimeout(() => {
            this.data.form.error[id] = false;
        }, 900);
    },

    async close () {
        await DataHelper.logout();
        location.reload();
    }
});

export default FirstSetupView;
