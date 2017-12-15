'use strict';

import BaseView from './_';
import PluginModel from '../models/plugin';
import StringHelper from '../helpers/string';
import DocumentSettingsPluginTemplate from '../../templates/documentSettingsPlugin.handlebars';

/**
 * @module views/documentSettingsPlugin
 * @class DocumentSettingsPluginView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'document-settings-plugin',
    events: {
        'click .document-settings-plugin_link': 'open'
    },

    _initialize(options) {
        this.document = options.document;
    },

    render() {
        this.$el.html(DocumentSettingsPluginTemplate({
            document: this.document.toJSON(),
            plugin: this.model.toJSON()
        }));
        this.model.live(this);

        // name
        this.listenToAndCall(this.model, 'change:id', () => {
            const plugin = new PluginModel({id: this.model.get('type')});

            plugin.fetch()
                .then(() => {
                    this.$('.document-settings-plugin_name').text(plugin.get('name'));
                })
                .catch(() => {
                    this.$('.document-settings-plugin_name').text(this.model.get('type'));
                });
        });

        // status
        this.listenToAndCall(this.model, 'change:status', () => {
            const string = StringHelper.string('documentSettings.plugins.status.' + this.model.get('status'));
            this.$('.document-settings-plugin_status')
                .attr('data-status', this.model.get('status'))
                .text(string);
        });
    }
});
