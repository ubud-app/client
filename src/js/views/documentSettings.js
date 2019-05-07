'use strict';

const View = require('./_');
const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const DocumentSettingsTemplate = require('../../templates/documentSettings.html');


/**
 * DocumentSettingsView
 *
 * @module views/documentSettings
 * @class DocumentSettingsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings',

    render () {
        const document = AppHelper.getDocument(true);
        if(!document) {
            return;
        }

        const urls = {
            general: '#' + document.id + '/settings/general',
            accounts: '#' + document.id + '/settings/accounts',
            plugins: '#' + document.id + '/settings/plugins',
            permissions: '#' + document.id + '/settings/permissions'
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsTemplate,
            data: {
                urls,
                document
            }
        });

        this.live(document);
        this.listenToAndCall(document, 'change:name', () => {
            AppHelper.title(document.get('name'));
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettings.headline'));
        return this;
    }
});
