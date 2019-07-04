'use strict';

const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const PluginModel = require('../models/plugin');
const PluginInstanceModel = require('../models/pluginInstance');
const DocumentSettingsPluginDetailsTemplate = require('../../templates/documentSettingsPluginDetails.html');


/**
 * DocumentSettingsPluginDetailsView
 *
 * @module views/documentSettingsPluginDetails
 * @class DocumentSettingsPluginDetailsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-plugin-details',

    _initialize (options) {
        this.model = new PluginInstanceModel({id: options.pluginId});
    },

    async render () {
        const AppHelper = require('../helpers/app');
        if (!this.model) {
            return;
        }

        this.data = {
            pluginInstance: this.model,
            meta: {
                plugin: null,
                uninstalling: false
            },
            status: {
                text: '',
                class: ''
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsPluginDetailsTemplate,
            data: this.data
        });

        this.live(this.model);
        AppHelper.title(ConfigurationHelper.getString('documentSettingsPluginDetails.headline'));

        this.listenToAndCall(this.model, 'change:status', () => {
            this.data.status.text = ConfigurationHelper.getString(
                'documentSettingsPlugin.status.' + this.model.get('status')
            );
            this.data.status.class = this.model.get('status');
        });

        this.listenToAndCall(this.model, 'change:type', async () => {
            if(!this.model.get('type')) {
                return;
            }

            const plugin = new PluginModel({id: this.model.get('type')});
            await plugin.fetch();
            this.data.meta.plugin = plugin;
            AppHelper.view().setTitle(plugin.get('title'));

            this.live(plugin);
        });

        this.once('remove', () => {
            this.save();
        });

        return this;
    },

    async submit (e) {
        e.preventDefault();

        await this.save();
        AppHelper.navigate(this.model.get('documentId') + '/settings/plugins', {trigger: true});
    },

    async save () {
        if(this._uninstalled) {
            return;
        }

        try {
            await this.model.save();
        }
        catch (error) {
            if(!error.toString().includes('Plugin settings are not valid')) {
                new ErrorView({error}).appendTo(AppHelper.view());
                throw error;
            }
        }
    },

    uninstall () {
        this.data.meta.uninstalling = true;
        this._uninstall()
            .then(() => {
                AppHelper.navigate(this.model.get('documentId') + '/settings/plugins', {trigger: true});
            })
            .catch(error => {
                this.data.uninstall.loading = false;
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    async _uninstall () {
        this._uninstalled = 1;
        return this.model.destroy();
    }
});