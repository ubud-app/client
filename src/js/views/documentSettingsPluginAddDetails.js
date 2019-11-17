'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import PluginInstanceModel from '../models/pluginInstance';
import DocumentSettingsPluginAddDetailsTemplate from '../../templates/documentSettingsPluginAddDetails.html';
import DocumentSettingsPluginAddSetupView from '../views/documentSettingsPluginAddSetup';


/**
 * DocumentSettingsPluginAddView
 *
 * @module views/documentSettingsPluginAdd
 * @class DocumentSettingsPluginAddView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsPluginAddView = BaseView.extend({
    className: 'document-settings-plugin-add-details b-form b-loader b-loader--light',

    async render () {
        this.document = this.document || AppHelper.getDocument(true);
        if (!this.document || !this.model) {
            return;
        }

        this.data = {
            document: this.document,
            model: this.model,
            user: DataHelper.getUser(),
            compatibility: [],
            meta: {
                loading: false,
                showIssues: false
            }
        };

        this.live(this.document);
        this.live(this.model);
        this.live(this.data.user);

        this.listenToAndCall(this.model, 'change:issues', () => {
            this.data.meta.showIssues = this.model.get('issues') && this.model.get('issues').openCount !== null;
        });
        this.listenToAndCall(this.model, 'change:compatibility', () => {
            DocumentSettingsPluginAddView.updateCompatibility(this.model, this.data.compatibility);
        });

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsPluginAddDetailsTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsPluginAddDetails.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        return this;
    },

    goBack () {
        AppHelper.back(this.model.id + '/settings');
    },

    install () {
        this.data.meta.loading = true;

        this._install()
            .catch(error => {
                this.data.meta.loading = false;
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    async _install () {
        const pluginInstance = new PluginInstanceModel({
            type: this.model.id,
            documentId: this.document.id
        });

        await pluginInstance.save();

        AppHelper.view().renderView(new DocumentSettingsPluginAddSetupView({model: pluginInstance}));
        AppHelper.navigate(this.document.id + '/settings/plugins/' + pluginInstance.id + '/setup');
    }
}, {
    updateCompatibility (model, compatibility) {
        compatibility.length = 0;
        if (!model.get('compatibility')) {
            return;
        }

        Object.entries(model.get('compatibility')).forEach(([type, c]) => {
            const j = {
                type,
                requirement: c.requirement,
                given: c.given,
                fulfills: c.fulfills
            };

            j.error = type !== 'npm' && !c.fulfills;
            j.warn = type === 'npm' && !c.fulfills;
            j.ok = c.fulfills;

            compatibility.push(j);
        });
    }
});

export default DocumentSettingsPluginAddView;
