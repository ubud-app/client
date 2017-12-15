'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import PluginCollection from '../collections/plugin';
import AddAccountSearchBankPluginView from './addAccountSearchBankPlugin';
import DocumentAccountSettingsView from './documentAccountSettings';
import AddAccountSearchBankTemplate from '../../templates/addAccountSearchBank.handlebars';


/**
 * @module views/addAccountSearchBank
 * @class AddAccountSearchBankView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'add-account-search-bank app_layout--page',
    events: {
        'keyup .add-account-search-bank_input': 'search',
        'click .add-account-search-bank_end-action': 'manual',
        'click .add-account-search-bank_empty-action': 'manual'
    },

    _initialize(options) {
        this.documentId = options.documentId;
    },
    async render() {
        const documents = await DataHelper.getDocuments().wait();
        this.model = documents.get(this.documentId);
        if (!this.model) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        AppHelper.title('addAccount.searchBank.title');
        this.$el.html(AddAccountSearchBankTemplate({document: this.model.toJSON()}));
        this.$input = this.$('.add-account-search-bank_input').focus();
        this.plugins = new PluginCollection();

        // empty
        this.$empty = this.$('.add-account-search-bank_empty');
        this.listenToAndCall(this.plugins, 'sync', () => {
            this.$empty.toggleClass('add-account-search-bank_empty--visible', !this.plugins.length && this.$input.val().length >= 2);
        });

        // plugins
        this.renderChildren(AddAccountSearchBankPluginView, {
            collection: this.plugins,
            where: this.$('.add-account-search-bank_results'),
            childOptions: {
                document: this.model
            }
        });

        // not that
        this.$end = this.$('.add-account-search-bank_end');
        this.listenToAndCall(this.plugins, 'sync', () => {
            this.$end.toggleClass('add-account-search-bank_end--visible', this.plugins.length > 0 && this.$input.val().length >= 2);
        });
    },
    async search() {
        const q = this.$input.val();
        this.$empty.toggleClass('add-account-search-bank_empty--visible', !this.plugins.length && q.length >= 2);
        this.$end.toggleClass('add-account-search-bank_end--visible', this.plugins.length > 0 && q.length >= 2);

        if(!q || q.length < 2) {
            this.plugins.set([]);
            this.plugins.trigger('sync');
            return;
        }

        this.plugins.id = 'q:' + q;
        this.plugins.fetch();
    },
    manual() {
        const view = new DocumentAccountSettingsView({documentId: this.model.id, accountType: 'checking'});
        AppHelper.view().renderView(view);
    }
});
