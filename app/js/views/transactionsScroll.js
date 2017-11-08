'use strict';

import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';
import BaseView from './_';
import TransactionModel from '../models/transaction';
import TransactionMonthView from './transactionsMonth';
import TransactionCollection from '../collections/transaction';

/**
 * @module views/transactionsScroll
 * @class TransactionsScrollView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions-scroll',

    nextMonthLock: false,
    emptyMonths: 0,

    async render() {
        const v = this;

        // this.model -> Document Model
        this.accounts = this.model.getAccounts();
        this.budgets = this.model.getBudgets();
        this.categories = this.model.getCategories();

        await Promise.all([
            this.accounts.fetch(),
            this.budgets.fetch(),
            this.categories.fetch()
        ]);

        this.accounts.live(this);
        this.budgets.live(this);
        this.categories.live(this);

        $(window).on('resize', v.resize);
        v.resize();
        v.once('remove', () => {
            $(window).off('resize', v.resize);
        });

        v.scroll = _.throttle(v.checkMonths, 100, {leading: false});
        $(window).on('scroll', v.scroll);
        v.once('remove', () => {
            $(window).off('scroll', v.scroll);
        });

        Promise.all([
            v.addMonth('future'),
            v.addMonth(moment())
        ])
            .then(() => {
                $(window).scrollTop($(document).height());
                return v.checkMonths();
            });
    },
    resize() {
        this.$el.css('min-height', $(window).height() - 100 - 60);
    },
    checkMonths() {
        if ($(window).scrollTop() < (2 * $(window).height())) {
            this.addNextMonth();
        }
    },
    addNextMonth() {
        const v = this;
        if (v.nextMonthLock) {
            return;
        }

        v.nextMonthLock = true;
        v.addMonth(moment(v.oldestMonth).subtract(1, 'month').startOf('month')).then(function (transactions) {
            if (transactions.length) {
                v.emptyMonths = 0;
            } else {
                v.emptyMonths += 1;
            }

            if (v.emptyMonths > 4) {
                // the end is near…
                return;
            }

            v.nextMonthLock = false;
            v.checkMonths();
        });
    },

    addMonth(month) {
        const transactions = new TransactionCollection();
        this.oldestMonth = month;

        if (month === 'future') {
            transactions.id = 'document:' + this.model.id + '/future';
        } else {
            transactions.id = 'document:' + this.model.id + '/month:' + month.format('YYYY-MM');
        }

        new TransactionMonthView({
            transactions: transactions,
            document: this.model,
            accounts: this.accounts,
            budgets: this.budgets,
            categories: this.categories
        })[month === 'future' ? 'appendTo' : 'prependTo'](this);

        if (month !== 'future' && moment().isSame(month, 'month')) {
            this.on('add', t => {
                transactions.add(t);
            });
        }

        return transactions.fetch()
            .then(() => {
                return Promise.resolve(transactions);
            })
            .catch(e => {
                throw e;
            });
    },

    addTransaction() {
        const t = new TransactionModel({time: moment().toJSON()});
        this.trigger('add', t);
    }
});
