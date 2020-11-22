'use strict';

import BaseView from './_';
import ErrorView from './error';
import PluginModel from '../models/plugin';

import AppHelper from '../helpers/app';
import ConfigurationHelper from '../helpers/configuration';
import TemplateHelper from '../helpers/template';

import DocumentSettingsPluginAddSetupTemplate from '../../templates/documentSettingsPluginAddSetup.html';
import DocumentSettingsPluginDetailsView from './documentSettingsPluginDetails';


/**
 * DocumentSettingsPluginAddSetupView
 *
 * @module views/documentSettingsPluginAddSetup
 * @class DocumentSettingsPluginAddSetupView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsPluginAddSetupView = BaseView.extend({
    className: 'document-settings-plugin-add-setup b-form b-loader b-loader--light',

    async render () {
        this.document = this.document || AppHelper.getDocument(true);
        if (!this.document || !this.model) {
            return;
        }

        this.data = {
            models: {
                document: this.document,
                instance: this.model,
                plugin: null
            },
            loader: {
                text: null
            },
            config: {
                visible: false
            }
        };

        this.live(this.model);

        this.listenToAndCall(
            this.model,
            'request sync change:status change:forks change:errors change:supported',
            this.updateStatus
        );

        this.listenToAndCall(this.model, 'change:type', () => {
            if (this.model.get('type')) {
                this.data.models.plugin = new PluginModel({id: this.model.get('type')});
                this.live(this.data.models.plugin);
            }
            else {
                this.data.models.plugin = null;
            }
        });

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsPluginAddSetupTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsPluginAddSetup.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });
    },
    updateStatus () {
        const success = this.model.get('status') === 'ready' &&
            !this.model.get('forks') &&
            this.model.get('errors') &&
            !Object.values(this.model.get('supported')).find(s => this.model.get('errors')[s] !== null);

        if (!this.model.isSynced() || this.model.get('status') === 'initializing') {
            this.data.loader.text = 'initialize';
            this.data.config.visible = false;
        }
        else if (this.model.get('status') === 'configuration' && !this.model.get('forks')) {
            this.data.loader.text = null;
            this.data.config.visible = true;
        }
        else if (this.model.get('status') === 'configuration') {
            this.data.loader.text = 'configure';
            this.data.config.visible = false;
        }
        else if (success && this.model.get('supported').includes('getAccounts')) {
            AppHelper.navigate(this.document.id + '/transactions', {trigger: true});
        }
        else if (success && this.model.get('supported').includes('getGoals')) {
            AppHelper.navigate(this.document.id + '/budget', {trigger: true});
        }
        else if (success) {
            AppHelper.navigate(this.document.id + '/settings/plugins', {trigger: true});
        }
        else if (
            this.model.get('status') === 'error' || (
                this.model.get('errors') &&
                Object.values(this.model.get('errors')).find(Boolean)
            )
        ) {
            AppHelper.navigate(this.document.id + '/settings/plugins/' + this.model.id);
            AppHelper.view().renderView(new DocumentSettingsPluginDetailsView({model: this.model}));
        }
        else if (
            ['initializing', 'ready'].includes(this.model.get('status')) &&
            this.model.get('supported') &&
            this.model.get('supported').includes('getAccounts') &&
            this.model.get('supported').includes('getTransactions') &&
            this.model.get('errors') &&
            this.model.get('errors').getAccounts === undefined
        ) {
            this.data.loader.text = 'accounts';
            this.data.config.visible = false;
        }
        else if (
            ['initializing', 'ready'].includes(this.model.get('status')) &&
            this.model.get('supported') &&
            this.model.get('supported').includes('getGoals') &&
            this.model.get('errors') &&
            this.model.get('errors').getGoals === undefined
        ) {
            this.data.loader.text = 'goals';
            this.data.config.visible = false;
        }
    },

    async submit (e) {
        e.preventDefault();
        await this.save();
    },
    async save () {
        try {
            await this.model.save();
        }
        catch (error) {
            if (!error.toString().includes('Plugin settings are not valid')) {
                new ErrorView({error}).appendTo(AppHelper.view());
                throw error;
            }
        }
    }
});

export default DocumentSettingsPluginAddSetupView;
