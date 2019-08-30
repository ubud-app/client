'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import DocumentSettingsPluginTemplate from '../../templates/documentSettingsPlugin.html';
import DocumentSettingsPluginAddView from '../views/documentSettingsPluginAdd';

import PluginModel from '../models/plugin';
import PluginInstanceCollection from '../collections/pluginInstance';


/**
 * DocumentSettingsPluginView
 *
 * @module views/documentSettingsPlugin
 * @class DocumentSettingsPluginView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsPluginView = BaseView.extend({
    className: 'document-settings-plugin',

    async render () {
        this.model = AppHelper.getDocument(true);
        if(!this.model) {
            return;
        }

        this.data = {
            document: this.model,
            plugins: [],
            meta: {
                loading: true,
                empty: true,
                addUrl: '#' + this.model.id + '/settings/plugins/add'
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
    },

    openAddPlugin (e) {
        e.preventDefault();

        AppHelper.navigate(this.model.id + '/settings/plugins/add');
        AppHelper.view().renderView(new DocumentSettingsPluginAddView());
    }
});

export default DocumentSettingsPluginView;
