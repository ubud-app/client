'use strict';

import BaseView from './_';
import TransactionsItemView from './transactionsItem';

/**
 * @module views/transactionsMonth
 * @class TransactionsMonthView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions-month',

    _initialize(options) {
        this.transactions = options.transactions;
        this.document = options.document;
        this.accounts = options.accounts;
        this.budgets = options.budgets;
        this.categories = options.categories;
    },

    render() {
        this.transactions.live(this);

        this.renderChildren(TransactionsItemView, {
            collection: this.transactions,
            childOptions: {
                document: this.document,
                accounts: this.accounts,
                budgets: this.budgets,
                categories: this.categories
            },
            modelAttr: 'transaction'
        });
    }
});
