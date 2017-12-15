'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import StringHelper from '../helpers/string';
import PluginInstanceModel from '../models/pluginInstance';
import AddAccountSearchBankPluginTemplate from '../../templates/addAccountSearchBankPlugin.handlebars';


/**
 * @module views/addAccountSearchBankPlugin
 * @class AddAccountSearchBankPluginView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'add-account-search-bank-plugin',
    events: {
        'click .add-account-search-bank-plugin-install': 'install'
    },

    _initialize(options) {
        this.document = options.document;
    },
    async render() {
        const supports = {accounts: [], shops: []};
        this.model.get('responsibilities').forEach(r => {
            if(r.account) {
                supports.accounts.push({
                    name: r.name,
                    website: r.website
                });
            }
            if(r.metadata || r.goal) {
                let what = [];
                if(r.metadata) {
                    what.push(StringHelper.string('addAccount.searchBank.supports.metadata'));
                }
                if(r.goal) {
                    what.push(StringHelper.string('addAccount.searchBank.supports.goal'));
                }

                supports.shops.push({
                    name: r.name,
                    website: r.website,
                    what: what.join(', ')
                });
            }
        });

        this.$el.html(AddAccountSearchBankPluginTemplate({
            plugin: this.model.toJSON(),
            supports
        }));
    },
    async install() {
        this.$el.addClass('add-account-search-bank-plugin--loading');

        const instance = new PluginInstanceModel({
            documentId: this.document.id,
            type: this.model.id
        });

        try {
            await instance.save();
        }
        catch(err) {
            this.$el.removeClass('add-account-search-bank-plugin--loading');
            window.alert(err);
            return;
        }

        AppHelper.navigate(this.document.id + '/settings/plugins/' + instance.id);
    }
});
