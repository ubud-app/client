'use strict';

import BaseView from './_';
import StringHelper from '../helpers/string';
import AddAccountSearchBankPluginTemplate from '../../templates/addAccountSearchBankPlugin.handlebars';


/**
 * @module views/addAccountSearchBankPlugin
 * @class AddAccountSearchBankPluginView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'add-account-search-bank-plugin',

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
    }
});
