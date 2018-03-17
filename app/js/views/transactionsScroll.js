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
    className: 'transactions-scroll loading',

    nextMonthLock: false,
    emptyMonths: 0,
    startup: true,

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
        this.$el.removeClass('loading');

        await Promise.all([
            v.addMonth('future'),
            v.addMonth(moment())
        ]);

        $(window).scrollTop($(document).height());

        $(window).on('scroll', v.scroll);
        v.once('remove', () => {
            $(window).off('scroll', v.scroll);
        });

        await v.checkMonths();
        this.startup = false;
    },
    resize() {
        this.$el.css('min-height', $(window).height() - 100 - 60);
    },
    async checkMonths() {
        if ($(window).scrollTop() < (2 * $(window).height())) {
            return this.addNextMonth();
        }
    },
    async addNextMonth() {
        const v = this;
        if (v.nextMonthLock) {
            return;
        }

        v.nextMonthLock = true;
        const transactions = await v.addMonth(
            moment(v.oldestMonth).subtract(1, 'month').startOf('month')
        );

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
        return v.checkMonths();
    },

    async addMonth(month) {
        const transactions = new TransactionCollection();
        this.oldestMonth = month;

        if (month === 'future') {
            transactions.id = 'document:' + this.model.id + '/future';
            transactions.addFilter = t => {
                return moment(t.get('time')).isAfter(moment().endOf('month')) && this.accounts.get(t.get('accountId'));
            };
        } else {
            transactions.id = 'document:' + this.model.id + '/month:' + month.format('YYYY-MM');
            transactions.addFilter = t => {
                return moment(t.get('time')).isSame(month, 'month') && this.accounts.get(t.get('accountId'));
            };
        }

        const view = new TransactionMonthView({
            transactions: transactions,
            document: this.model,
            accounts: this.accounts,
            budgets: this.budgets,
            categories: this.categories
        })[month === 'future' ? 'appendTo' : 'prependTo'](this);

        if(month !== 'future') {
            view.$el.addClass('loading b-loader b-loader--light');
        }

        if (month !== 'future' && moment().isSame(month, 'month')) {
            this.on('add', t => {
                transactions.add(t);
            });
        }

        await transactions.fetch();

        if(this.startup) {
            $(window).scrollTop($(document).height());
        }
        
        view.$el.removeClass('loading b-loader b-loader--light');

        return transactions;
    },

    addTransaction() {
        const t = new TransactionModel({time: moment().toJSON()});
        this.trigger('add', t);
        $(window).scrollTop($(document).height());
    }
});
