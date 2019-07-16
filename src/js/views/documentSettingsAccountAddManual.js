'use strict';

const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const AccountModel = require('../models/account');
const DocumentSettingsAccountAddManualTemplate = require('../../templates/documentSettingsAccountAddManual.html');


/**
 * DocumentSettingsAccountAddManualView
 *
 * @module views/documentSettingsAccountAddManual
 * @class DocumentSettingsAccountAddManualView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-account-add-manual b-form b-loader b-loader--light',

    _initialize (options) {
        this.type = options.type || 'other';
    },

    async render () {
        const AppHelper = require('../helpers/app');
        this.model = this.model || AppHelper.getDocument(true);
        if (!this.model) {
            return;
        }

        this.live(this.model);
        this.account = new AccountModel();
        this.account.set({documentId: this.model.id});

        this.data = {
            document: this.model,
            account: this.account,
            meta: {
                hideType: false,
                balance: 0
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsAccountAddManualTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsAccountAddManual.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        if(this.type === 'cash') {
            this.data.meta.hideType = true;
            this.account.set({type: 'cash'});
        }

        this.$el.find('#document-settings-account-add-manual__input--name').focus();
        return this;
    },
    submit (e) {
        e.preventDefault();
        this.$el.addClass('loading');

        this.createManualAccount()
            .then(() => {
                const AppHelper = require('../helpers/app');
                AppHelper.navigate(this.model.id + '/settings/accounts', {trigger: true});
            })
            .catch(error => {
                this.$el.removeClass('loading');
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    goBack () {
        const AppHelper = require('../helpers/app');
        AppHelper.back(this.model.id + '/settings/accounts/add');
    },
    async createManualAccount () {
        if (!this.account.get('name')) {
            this.account.set({
                name: ConfigurationHelper.getString('documentSettingsAccountAddManual.defaultName')
            });
        }

        await this.account.save();
        if (!this.data.meta.balance) {
            return;
        }

        const {DateTime} = require('luxon');
        const TransactionModel = require('../models/transaction');

        const transaction = new TransactionModel({
            time: DateTime.local().toJSON(),
            accountId: this.account.id,
            memo: ConfigurationHelper.getString('documentSettingsAccountAddManual.memo'),
            amount: this.data.meta.balance
        });

        await transaction.save();
    },
});
