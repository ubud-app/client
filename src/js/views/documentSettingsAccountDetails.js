'use strict';

const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const AccountModel = require('../models/account');
const DocumentSettingsAccountDetailsTemplate = require('../../templates/documentSettingsAccountDetails.html');


/**
 * DocumentSettingsAccountDetailsView
 *
 * @module views/documentSettingsAccountDetails
 * @class DocumentSettingsAccountDetailsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-account-details',

    _initialize (options) {
        this.model = new AccountModel({id: options.accountId});
    },

    async render () {
        const AppHelper = require('../helpers/app');
        if (!this.model) {
            return;
        }

        this.data = {
            account: this.model,
            delete: {
                allowed: false,
                loading: false
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsAccountDetailsTemplate,
            data: this.data
        });

        this.live(this.model);

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsAccountDetails.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        this.once('remove', () => {
            this.save();
        });

        return this;
    },

    async submit (e) {
        e.preventDefault();

        await this.save();
        AppHelper.navigate(this.model.get('documentId') + '/settings/accounts', {trigger: true});
    },

    async save () {
        if(this._deleted) {
            return;
        }

        try {
            await this.model.save();
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    },

    delete () {
        if(!this.data.delete.allowed) {
            return;
        }

        this.data.delete.loading = true;
        this._delete()
            .then(() => {
                AppHelper.navigate(this.model.get('documentId') + '/settings/accounts', {trigger: true});
            })
            .catch(error => {
                this.data.delete.loading = false;
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    async _delete () {
        this._deleted = 1;
        return this.model.destroy();
    }
});
