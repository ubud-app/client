'use strict';

const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const PluginInstanceModel = require('../models/pluginInstance');
const DocumentSettingsPluginAddDetailsTemplate = require('../../templates/documentSettingsPluginAddDetails.html');


/**
 * DocumentSettingsPluginAddView
 *
 * @module views/documentSettingsPluginAdd
 * @class DocumentSettingsPluginAddView
 * @augments View
 * @author Sebastian Pekarek
 */
const DocumentSettingsPluginAddView = View.extend({
    className: 'document-settings-plugin-add-details b-form b-loader b-loader--light',

    async render () {
        const AppHelper = require('../helpers/app');
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

        const DocumentSettingsPluginAddSetupView = require('../views/documentSettingsPluginAddSetup');
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
                requirement: c.requirement
            };

            j.error = type !== 'npm' && !c.fulfills;
            j.warn = type === 'npm' && !c.fulfills;
            j.ok = c.fulfills;

            compatibility.push(j);
        });
    }
});

module.exports = DocumentSettingsPluginAddView;