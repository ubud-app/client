'use strict';

import BaseView from './_';
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
        this.$el.html(AddAccountSearchBankPluginTemplate());
    }
});
