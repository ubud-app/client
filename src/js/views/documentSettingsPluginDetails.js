'use strict';

import BaseView from './_';
import ErrorView from './error';
import DocumentSettingsPluginAddView from './documentSettingsPluginAddDetails';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import PluginModel from '../models/plugin';
import PluginInstanceModel from '../models/pluginInstance';
import DocumentSettingsPluginDetailsTemplate from '../../templates/documentSettingsPluginDetails.html';


/**
 * DocumentSettingsPluginDetailsView
 *
 * @module views/documentSettingsPluginDetails
 * @class DocumentSettingsPluginDetailsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsPluginDetailsView = BaseView.extend({
    className: 'document-settings-plugin-details',

    _initialize (options) {
        this.model = this.model || new PluginInstanceModel({id: options.pluginId});
    },

    async render () {
        this.data = {
            pluginInstance: this.model,
            meta: {
                plugin: null,
                uninstalling: false,
                compatibility: []
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
            DocumentSettingsPluginAddView.updateCompatibility(plugin, this.data.meta.compatibility);

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
        this._uninstalled = true;
        AppHelper.navigate(this.model.get('documentId') + '/settings/plugins', {trigger: true});
    },

    async save () {
        if(this._uninstalled) {
            return;
        }

        if(Array.isArray(this.model.get('config'))) {
            this.model.get('config').forEach(config => {
                console.log(config.id, 'is', config.value, ', should be', this.$el.find(`input[name="${config.id}"]`).val());
            });
        }

        console.log(JSON.parse(JSON.stringify(this.model.toJSON())).config);

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
                this.data.meta.uninstalling = false;
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    async _uninstall () {
        this._uninstalled = 1;
        return this.model.destroy();
    }
});

export default DocumentSettingsPluginDetailsView;
