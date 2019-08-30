'use strict';

import $ from 'zepto';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import BaseView from './_';
import DocumentSettingsAccountAddManualView from './documentSettingsAccountAddManual';
import DocumentSettingsPluginAddView from '../views/documentSettingsPluginAdd';

import DocumentSettingsAccountAddTemplate from '../../templates/documentSettingsAccountAdd.html';


/**
 * DocumentSettingsAccountAddView
 *
 * @module views/documentSettingsAccountAdd
 * @class DocumentSettingsAccountAddView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsAccountAddView = BaseView.extend({
    className: 'document-settings-account-add b-form',

    async render () {
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
        AppHelper.back(this.model.id + '/settings/accounts');
    },
    openUrl (e) {
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

export default DocumentSettingsAccountAddView;
