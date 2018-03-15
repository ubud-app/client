'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import PluginCollection from '../collections/plugin';
import AddAccountSearchBankPluginView from './addAccountSearchBankPlugin';
import AddPluginTemplate from '../../templates/addPlugin.handlebars';


/**
 * @module views/addPlugin
 * @class AddPluginView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'add-plugin app_layout--page',
    events: {
        'keyup .add-plugin_input': 'search'
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

        AppHelper.title('addPlugin.title');
        this.$el.html(AddPluginTemplate({document: this.model.toJSON()}));
        this.$input = this.$('.add-plugin_input').focus();
        this.plugins = new PluginCollection();

        // empty
        this.$empty = this.$('.add-plugin_empty');
        this.listenToAndCall(this.plugins, 'sync', () => {
            this.$empty.toggleClass('add-plugin_empty--visible', !this.plugins.length && this.$input.val().length >= 2);
        });

        // plugins
        this.renderChildren(AddAccountSearchBankPluginView, {
            collection: this.plugins,
            where: this.$('.add-plugin_results'),
            childOptions: {
                document: this.model
            }
        });

        // not that
        this.$end = this.$('.add-plugin_end');
        this.listenToAndCall(this.plugins, 'sync', () => {
            this.$end.toggleClass('add-plugin_end--visible', this.plugins.length > 0 && this.$input.val().length >= 2);
        });
    },
    async search() {
        const q = this.$input.val();
        this.$empty.toggleClass('add-plugin_empty--visible', !this.plugins.length && q.length >= 2);
        this.$end.toggleClass('add-plugin_end--visible', this.plugins.length > 0 && q.length >= 2);

        if(!q || q.length < 2) {
            this.plugins.set([]);
            this.plugins.trigger('sync');
            return;
        }

        this.plugins.id = 'q:' + q;
        this.plugins.fetch();
    }
});
