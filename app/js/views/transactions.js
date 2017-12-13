'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TransactionsScrollView from './transactionsScroll';
import TransactionsFooterView from './transactionsFooter';

/**
 * @module views/transactions
 * @class TransactionsView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions',

    _initialize(options) {
        this.documentId = options.documentId;
    },

    async render() {
        const v = this;
        AppHelper.title('transactions.title');

        const documents = await DataHelper.getDocuments().wait();
        v.model = documents.get(this.documentId);
        if (!v.model) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        v.model.live(this);

        const scroll = new TransactionsScrollView({model: v.model}).appendTo(this);
        const footer = new TransactionsFooterView().appendTo(v);

        v.listenTo(footer, 'add', function () {
            scroll.addTransaction();
        });

        this.listenToOnce(v.model, 'destroy', function () {
            AppHelper.navigate('/', {trigger: true, replace: true});
        });
    }
});
