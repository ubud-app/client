'use strict';

const {debounce} = require('underscore');
const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const DocumentSettingsGeneralTemplate = require('../../templates/documentSettingsGeneral.html');


/**
 * DocumentSettingsGeneralView
 *
 * @module views/documentSettingsGeneral
 * @class DocumentSettingsGeneralView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-general',

    async render () {
        const AppHelper = require('../helpers/app');
        this.model = AppHelper.getDocument(true);
        if(!this.model) {
            return;
        }

        this.live(this.model);

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsGeneralTemplate,
            data: {
                document: this.model
            }
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsGeneral.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        this.listenTo(this.model, 'change', debounce(() => {
            this.save();
        }, 250));
        this.once('remove', () => {
            this.save();
        });

        return this;
    },

    async submit (e) {
        e.preventDefault();

        await this.save();
        AppHelper.navigate(this.model.id + '/settings', {trigger: true});
    },

    async save () {
        try {
            await this.model.save();
        }
        catch(error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    }
});
