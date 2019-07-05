'use strict';

const View = require('./_');
const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const DocumentSettingsPluginTemplate = require('../../templates/documentSettingsPlugin.html');

const PluginModel = require('../models/plugin');
const PluginInstanceCollection = require('../collections/pluginInstance');


/**
 * DocumentSettingsPluginView
 *
 * @module views/documentSettingsPlugin
 * @class DocumentSettingsPluginView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-plugin',

    async render () {
        const AppHelper = require('../helpers/app');
        this.model = AppHelper.getDocument(true);
        if(!this.model) {
            return;
        }

        this.data = {
            document: this.model,
            plugins: [],
            meta: {
                loading: true,
                empty: true
            }
        };

        this.live(this.model);
        TemplateHelper.render({
            view: this,
            template: DocumentSettingsPluginTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsPlugin.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        this.plugins = new PluginInstanceCollection();
        this.plugins.filterBy('document', this.model.id);
        this.live(this.plugins);

        this.listenTo(this.plugins, 'add', this.addPlugin);
        this.listenTo(this.plugins, 'remove', this.removePlugin);
        this.plugins.each(this.addPlugin);

        this.listenTo(this.model, 'sync cache', this.updateLoader);
        this.listenToAndCall(this.plugins, 'sync cache', this.updateLoader);

        return this;
    },

    updateLoader () {
        this.data.meta.loading = !this.model.isSynced() || !this.plugins.isSynced();
    },

    addPlugin(pluginInstance) {
        const json = {
            id: pluginInstance.id,
            url: '#' + this.model.id + '/settings/plugins/' + pluginInstance.id,
            status: {}
        };

        this.listenToAndCall(pluginInstance, 'change:status', () => {
            json.status.text = ConfigurationHelper.getString(
                'documentSettingsPlugin.status.' + pluginInstance.get('status')
            );
            json.status.class = pluginInstance.get('status');
        });
        this.listenToAndCall(pluginInstance, 'change:type', async () => {
            json.meta = pluginInstance.get('type');

            const plugin = new PluginModel({
                id: pluginInstance.get('type')
            });

            this.live(plugin);
            await plugin.wait();

            this.listenToAndCall(plugin, 'change:name', () => {
                json.name = plugin.get('name');
            });
        });

        this.data.plugins.push(json);
        this.data.meta.empty = false;
        this.live(pluginInstance);
    },

    removePlugin (plugin) {
        const i = this.plugins.findIndex(a => a.id === plugin.id);
        if(i === -1) {
            return this;
        }

        this.data.plugins.splice(i, 1);
        this.data.meta.empty = !this.plugins.length;
    }
});
