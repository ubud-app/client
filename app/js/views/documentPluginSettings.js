'use strict';

import $ from 'jquery';
import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';
import PluginModel from '../models/plugin';
import PluginInstanceModel from '../models/pluginInstance';
import DocumentPluginSettingsTemplate from '../../templates/documentPluginSettings.handlebars';

/**
 * @module views/documentPluginSettings
 * @class DocumentPluginSettingsView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'form',
    className: 'document-plugin-settings app_layout--page',
    events: {
        'submit': 'save',
        'reset': 'back'
    },

    _initialize(options) {
        this.documentId = options.documentId;
        this.pluginId = options.pluginId;
    },

    async render() {
        AppHelper.title('documentPluginSettings.title');

        const documents = await DataHelper.getDocuments().wait();
        this.document = documents.get(this.documentId);
        if (!this.document) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        this.model = await new PluginInstanceModel({id: this.pluginId}).wait();
        if(!this.model || this.model.get('documentId') !== this.document.id) {
            AppHelper.navigate(this.document.id + '/settings', {trigger: true, replace: true});
            return;
        }

        this.$el.html(DocumentPluginSettingsTemplate());


        // Headline
        const $headline = this.$('.document-plugin-settings_headline');
        this.listenToAndCall(this.model, 'change:id', () => {
            const plugin = new PluginModel({id: this.model.get('type')});

            plugin.fetch()
                .then(() => {
                    $headline.text(plugin.get('name'));
                })
                .catch(() => {
                    $headline.text(this.model.get('type'));
                });
        });


        // Status
        const $status = this.$('.document-plugin-settings_status');
        const $statusWrap = this.$('.document-plugin-settings_status-wrap');
        this.listenToAndCall(this.model, 'change:status', () => {
            const show = ['ready', 'error'].indexOf(this.model.get('status')) > -1;
            $statusWrap.toggleClass('document-plugin-settings_status-wrap--hidden', !show);
        });
        this.listenToAndCall(this.model, 'change:supported change:errors', () => {
            this.model.get('supported').forEach(method => {
                const $li = $('<li class="document-plugin-settings_status-item" />').appendTo($status);
                if(this.model.get('errors')[method]) {
                    $li.addClass('document-plugin-settings_status-item--error');
                }
                else if(this.model.get('errors')[method] === undefined) {
                    $li.addClass('document-plugin-settings_status-item--pending');
                }

                $('<span class="document-plugin-settings_status-name" />')
                    .text(StringHelper.string('documentPluginSettings.status.' + method))
                    .appendTo($li);

                const $error = $('<div class="document-plugin-settings_status-error" />').appendTo($li);
                if(this.model.get('errors')[method]) {
                    $('<pre />').text(this.model.get('errors')[method]).appendTo($error);
                }
            });
        });


        // Settings
        const $settings = this.$('.document-plugin-settings_settings');
        const $settingsWrap = this.$('.document-plugin-settings_settings-wrap');
        let focused = false;

        this.model.get('config').forEach(field => {
            let label = field.label || field.id;
            if(StringHelper.string(label).substr(0, 21) !== 'missing translation: ') {
                label = StringHelper.string(label);
            }

            let defaultValue = field.defaultValue || null;
            if(defaultValue === '{{email}}') {
                defaultValue = DataHelper.getUser().get('email');
            }

            $('<label class="document-plugin-settings_label" />')
                .attr('for', 'document-plugin-settings_input-' + field.id)
                .text(label)
                .appendTo($settings);

            const $input = $('<input class="document-plugin-settings_input"/>')
                .attr('type', field.type)
                .attr({
                    type: field.type,
                    name: field.id,
                    id: 'document-plugin-settings_input-' + field.id,
                    placeholder: field.placeholder
                })
                .val(field.value || defaultValue || '')
                .appendTo($settings);

            if(!focused && !$input.val() && this.model.get('status') === 'configuration') {
                setTimeout(() => {$input.focus();}, 0);
                focused = true;
            }
        });

        $settingsWrap.toggleClass('document-plugin-settings_settings-wrap--hidden', this.model.get('config').length === 0);
    },
    async save(e) {
        e.preventDefault();

        this.$el.serializeArray().forEach(field => {
            const config = this.model.get('config').find(c => c.id === field.name);
            config.value = field.value;
        });

        try {
            await this.model.save();
            this.$('.document-plugin-settings_input--error').removeClass('document-plugin-settings_input--error');
            this.$(':focus').blur();
        }
        catch(err) {
            if(err.attributes && Object.entries(err.attributes).length > 0) {
                let focused = false;
                this.$('.document-plugin-settings_input').each((i, input) => {
                    const $input = $(input);
                    const id = $input.attr('name');
                    $input.toggleClass('document-plugin-settings_input--error', !!err.attributes[id]);

                    if(err.attributes[id] && !focused) {
                        $input.focus();
                        focused = true;
                    }
                });
            }else{
                window.alert(err.toString());
            }
        }
    },
    back(e) {
        e.preventDefault();
        window.history.back();
    }
});
