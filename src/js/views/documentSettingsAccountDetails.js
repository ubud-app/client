'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import AccountModel from '../models/account';
import DocumentSettingsAccountDetailsTemplate from '../../templates/documentSettingsAccountDetails.html';


/**
 * DocumentSettingsAccountDetailsView
 *
 * @module views/documentSettingsAccountDetails
 * @class DocumentSettingsAccountDetailsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsAccountDetailsView = BaseView.extend({
    className: 'document-settings-account-details',

    _initialize (options) {
        this.model = new AccountModel({id: options.accountId});
    },

    async render () {
        if (!this.model) {
            return;
        }

        this.data = {
            account: this.model,
            delete: {
                allowed: false,
                loading: false
            },
            unlink: {
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
    },

    unlink () {
        this.data.unlink.loading = true;
        this.model.save({pluginInstanceId: null})
            .then(() => {
                this.data.unlink.false = true;
            })
            .catch(error => {
                this.data.unlink.loading = false;
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    }
});

export default DocumentSettingsAccountDetailsView;
