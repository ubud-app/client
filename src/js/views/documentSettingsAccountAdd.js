'use strict';

const $ = require('zepto');
const View = require('./_');

const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const DocumentSettingsAccountAddTemplate = require('../../templates/documentSettingsAccountAdd.html');


/**
 * DocumentSettingsAccountAddView
 *
 * @module views/documentSettingsAccountAdd
 * @class DocumentSettingsAccountAddView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-account-add b-form',

    async render () {
        const AppHelper = require('../helpers/app');
        this.model = this.model || AppHelper.getDocument(true);
        if (!this.model) {
            return;
        }

        const data = {
            document: this.model,
            urls: {
                current: '#' + this.model.id + '/settings/accounts/add/current',
                cash: '#' + this.model.id + '/settings/accounts/add/cash',
                other: '#' + this.model.id + '/settings/accounts/add/other'
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsAccountAddTemplate,
            data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsAccountAdd.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        return this;
    },

    goBack () {
        const AppHelper = require('../helpers/app');
        AppHelper.back(this.model.id + '/settings/accounts');
    },
    openUrl (e) {
        const AppHelper = require('../helpers/app');
        const DocumentSettingsAccountAddManualView = require('./documentSettingsAccountAddManual');
        const DocumentSettingsPluginAddView = require('../views/documentSettingsPluginAdd');
        const href = $(e.target).closest('a').attr('href');

        e.preventDefault();

        if (href.includes('current')) {
            AppHelper.navigate(href.substr(1));
            AppHelper.view().renderView(new DocumentSettingsPluginAddView({type: 'account'}));
        }
        else {
            AppHelper.navigate(href.substr(1));
            AppHelper.view().renderView(new DocumentSettingsAccountAddManualView({
                type: href.split('/').pop()
            }));
        }
    }
});
