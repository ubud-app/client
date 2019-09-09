'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import DocumentSettingsTemplate from '../../templates/documentSettings.html';


/**
 * DocumentSettingsView
 *
 * @module views/documentSettings
 * @class DocumentSettingsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsView = BaseView.extend({
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

        const user = DataHelper.getUser();
        const permissions = {};
        this.live(user);
        this.listenToAndCall(user, 'change:admin', () => {
            permissions.headline = 'documentSettings.permissions.' +
                (user.get('admin') && user.get('admin').isAdmin ? 'admin' : 'user') + '.headline';
            permissions.description = 'documentSettings.permissions.' +
                (user.get('admin') && user.get('admin').isAdmin ? 'admin' : 'user') + '.description';
        });

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsTemplate,
            data: {
                urls,
                document,
                permissions
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

export default DocumentSettingsView;
