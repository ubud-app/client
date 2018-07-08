'use strict';

import $ from 'jquery';
import _ from 'underscore';
import moment from 'moment';

import BaseView from './_';

import TransactionModel from '../models/transaction';
import TransactionMonthView from './transactionsMonth';
import TransactionCollection from '../collections/transaction';

import ConfigurationHelper from '../helpers/configuration';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';

/**
 * @module views/transactionsScroll
 * @class TransactionsScrollView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions-scroll loading',
    events: {
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'change .transactions-scroll_dropzone-account': 'importFile'
    },

    nextMonthLock: false,
    emptyMonths: 0,
    startup: true,

    async render () {
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


        // Drag & Drop Importer
        this.dragCounter = 0;
        this.$dropzone = $('<div class="transactions-scroll_dropzone" />').hide().appendTo(this.$el);
        this.$dropzoneWrap = $('<div class="transactions-scroll_dropzone-wrap" />').hide().appendTo(this.$dropzone);
        this.$dropzoneFile = $('<div class="transactions-scroll_dropzone-file" />').appendTo(this.$dropzoneWrap);
        this.$dropzoneAccountWrap = $('<div class="transactions-scroll_dropzone-account-wrap" />').appendTo(this.$dropzoneWrap);
        this.$dropzoneAccount = $('<select class="transactions-scroll_dropzone-account" />').appendTo(this.$dropzoneAccountWrap);
        this.accounts.each(account => $('<option />')
            .attr('value', account.id)
            .text(account.get('name'))
            .appendTo(this.$dropzoneAccount)
        );

        this.$dropzone.get(0).addEventListener('dragover', e => e.preventDefault(), false);
        this.$dropzone.get(0).addEventListener('drop', this.drop, false);
    },
    resize () {
        this.$el.css('min-height', $(window).height() - 100 - 60);
    },
    async checkMonths () {
        if ($(window).scrollTop() < (2 * $(window).height())) {
            return this.addNextMonth();
        }
    },
    async addNextMonth () {
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

    async addMonth (month) {
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

        if (month !== 'future') {
            view.$el.addClass('loading b-loader b-loader--light');
        }

        if (month !== 'future' && moment().isSame(month, 'month')) {
            this.on('add', t => {
                transactions.add(t);
            });
        }

        await transactions.fetch();

        if (this.startup) {
            $(window).scrollTop($(document).height());
        }

        view.$el.removeClass('loading b-loader b-loader--light');

        return transactions;
    },

    addTransaction () {
        const t = new TransactionModel({time: moment().toJSON()});
        this.trigger('add', t);
        $(window).scrollTop($(document).height());
    },

    dragEnter (e) {
        e.preventDefault();
        this.dragCounter++;
        if (this.dragCounter === 1) {
            this.$dropzoneWrap.removeClass('loading').hide();
            this.$dropzoneFile.show();
            this.$dropzoneAccountWrap.show();
            this.$dropzoneAccount.val(null);
            this.$dropzone.show();
        }
    },

    dragLeave (e) {
        e.preventDefault();
        this.dragCounter--;
        if (this.dragCounter === 0) {
            this.$dropzone.hide();
        }
    },

    drop (e) {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files.length > 1) {
            alert(StringHelper.string('transactions.import.onlyOne'));
        }

        const file = files[0];
        this.$dropzoneFile.text(StringHelper.string('transactions.import.label', {file: file.name}));
        this.$dropzoneWrap.show();
        this.importFile = file;
    },

    importFile () {
        const accountId = this.$dropzoneAccount.val();
        if (!this.importFile || !accountId) {
            return;
        }

        this.$dropzoneFile.hide();
        this.$dropzoneAccountWrap.hide();
        this.$dropzoneWrap.addClass('loading').show();

        const formData = new FormData();
        formData.append('file', this.importFile);

        $.ajax({
            url: ConfigurationHelper.getEndpoint() + '/api/imports?account=' + accountId,
            data: formData,
            type: 'POST',
            contentType: false,
            processData: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader(
                    'Authorization',
                    'Basic ' + btoa(DataHelper._session.id + ':' + DataHelper._session.get('secret'))
                );
            },
            success: () => {
                this.$dropzone.hide();
                this.dragCounter = 0;
            },
            error: (jqXHR, status, error) => {
                if(jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    alert(jqXHR.responseJSON.message);
                }
                else if(jqXHR.responseText) {
                    alert(jqXHR.responseText);
                }
                else {
                    alert(error || status);
                }

                this.$dropzone.hide();
                this.dragCounter = 0;
            }
        });
    }
});
