'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import AddAccountTemplate from '../../templates/addAccount.handlebars';


/**
 * @module views/addAccount
 * @class AddAccountView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'add-account app_layout--page',

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

        AppHelper.title('addAccount.index.title');
        this.$el.html(AddAccountTemplate({document: this.model.toJSON()}));
    }
});
