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
        'reset': 'back',
        'click .document-plugin-settings_uninstall': 'uninstall'
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

        this.model.live(this);
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
            $status.empty();

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

            if(!this.model.get('supported').find(m => this.model.get('errors')[m] !== null)) {
                this.trigger('working');
            }
        });


        // Settings
        this.$settings = this.$('.document-plugin-settings_settings');
        this.$settingsWrap = this.$('.document-plugin-settings_settings-wrap');

        if(this.model.get('errors').getConfig === undefined) {
            this.listenToOnce(this.model, 'change:errors change:config', this.renderConfigFields);
        }else{
            this.renderConfigFields();
        }
    },
    renderConfigFields() {
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

            $('<label class="b-form-label" />')
                .attr('for', 'document-plugin-settings_input-' + field.id)
                .text(label)
                .appendTo(this.$settings);

            const $input = $('<input class="b-form-input"/>')
                .attr('type', field.type)
                .attr({
                    type: field.type,
                    name: field.id,
                    id: 'document-plugin-settings_input-' + field.id,
                    placeholder: field.placeholder
                })
                .val(field.value || defaultValue || '')
                .appendTo(this.$settings);

            if(!focused && !$input.val() && this.model.get('status') === 'configuration') {
                setTimeout(() => {$input.focus();}, 0);
                focused = true;
            }
        });

        this.$settings.removeClass('loading');
        this.$settingsWrap.toggleClass('document-plugin-settings_settings-wrap--hidden', this.model.get('config').length === 0);
    },
    async save(e) {
        e.preventDefault();
        this.$settings.addClass('loading');

        this.$el.serializeArray().forEach(field => {
            const config = this.model.get('config').find(c => c.id === field.name);
            config.value = field.value;
        });

        try {
            await this.model.save();
            this.$('.b-form-input').removeClass('b-form-input--error');
        }
        catch(err) {
            if(err.attributes && Object.entries(err.attributes).length > 0) {
                let focused = false;
                this.$('.b-form-input').each((i, input) => {
                    const $input = $(input);
                    const id = $input.attr('name');
                    $input.toggleClass('b-form-input--error', !!err.attributes[id]);

                    if(err.attributes[id] && !focused) {
                        $input.focus();
                        focused = true;
                    }
                });

                this.$settings.removeClass('loading');
            }else{
                this.$settings.removeClass('loading');
                window.alert(err.toString());
            }

            return;
        }

        this.$('.document-plugin-settings_input--error').removeClass('b-form-input--error');
        this.$(':focus').blur();
        this.$('input[type="password"]').val('');
        this.$settings.removeClass('loading');

        this.once('working', () => {
            setTimeout(() => {
                AppHelper.navigate(this.document.id + '/settings', {trigger: true});
            }, 1500);
        });
    },
    back(e) {
        e.preventDefault();
        window.history.back();
    },
    async uninstall() {
        if (!confirm(StringHelper.string('documentPluginSettings.uninstall.confirm'))) {
            return;
        }

        try {
            await this.model.destroy();
            AppHelper.navigate(this.documentId + '/settings', {trigger: true});
        }
        catch(err) {
            window.alert(err.toString());
        }
    }
});
