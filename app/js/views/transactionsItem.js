'use strict';

import $ from 'jquery';
import moment from 'moment';
import BaseView from './_';
import StringHelper from '../helpers/string';
import PayeeModel from '../models/payee';
import TransactionsEditorView from './transactionsEditor';

/**
 * @module views/transactionsItem
 * @class TransactionsItemView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'transactions-item',

    _initialize(options) {
        this.model = options.transaction;
        this.document = options.document;
        this.accounts = options.accounts;
        this.budgets = options.budgets;
        this.categories = options.categories;
    },
    events: {
        'click': 'open'
    },

    render() {
        const v = this;
        const $line = $('<div class="transactions-item_line" />').appendTo(v.$el);
        v.$editor = $('<div class="transactions-item_editor" />').appendTo(v.$el);

        const $date = $('<span class="transactions-item_date" />').appendTo($line);
        const $account = $('<span class="transactions-item_account" />').appendTo($line);
        const $payee = $('<span class="transactions-item_payee" />').appendTo($line);
        const $budget = $('<span class="transactions-item_budget" />').appendTo($line);
        const $memo = $('<span class="transactions-item_memo" />').appendTo($line);
        const $amount = $('<span class="transactions-item_amount" />').appendTo($line);

        // Date
        v.listenToAndCall(v.model, 'change:time', () => {
            const m = moment(v.model.get('time'));
            $date.text(m.format('L'));
        });


        // Account
        v.listenToAndCall(v.model, 'change:accountId', () => {
            //$account.text(v.model.get('accountId'))
            const account = v.accounts.get(v.model.get('accountId'));
            if (!account) {
                $account.text('-');
                return;
            }

            v.listenToAndCall(account, 'change:name', () => {
                $account.text(account.get('name'));
            });
        });


        // Payee
        v.listenToAndCall(v.model, 'change:payeeId', () => {
            if(!v.model.has('payeeId') && v.model.has('pluginsOwnPayeeId')) {
                $payee.addClass('transactions-item_payee--temporary');
                $payee.text(v.model.get('pluginsOwnPayeeId'));
                return;
            }

            $payee.removeClass('transactions-item_payee--temporary');
            if(!v.model.has('payeeId')) {
                $payee.text('-');
                return;
            }

            const payee = new PayeeModel({id: v.model.get('payeeId')});
            v.listenToOnce(payee, 'change:name', () => {
                $payee.text(payee.get('name'));
            });

            payee.fetch();
        });


        // Budget
        v.listenToAndCall(v.model, 'change:units change:time', () => {
            const names = (v.model.getUnits() || []).map(unit => {
                if (unit.get('budgetId') === 'income-0' || unit.get('budgetId') === 'income-1') {
                    return StringHelper.string('transactions.budgetSelect.incomeFor', {
                        month: moment(v.model.get('time'))
                            .add(unit.get('budgetId') === 'income-0' ? 0 : 1, 'month')
                            .format('MMMM')
                    });
                }
                if (v.budgets.get(unit.get('budgetId'))) {
                    return v.budgets.get(unit.get('budgetId')).get('name');
                }
            }).filter(n => !!n);

            if (names.length === 1) {
                $budget.text(names[0]);
            }
            else if (names.length === 2) {
                $budget.text(names.join(' & '));
            }
            else if (names.length > 2) {
                $budget.text(StringHelper.string('transactions.multipleBudgets'));
            }
            else {
                $budget.text('');
            }
        });


        // Memo
        v.listenToAndCall(v.model, 'change:memo', () => {
            $memo.text(v.model.get('memo'));
        });


        // Amount
        v.listenToAndCall(v.model, 'change:amount', () => {
            $amount.text(StringHelper.currency(this.document, v.model.get('amount') || 0));
            $amount.toggleClass('transactions-item_amount--negative', v.model.get('amount') < 0);
            $amount.toggleClass('transactions-item_amount--positive', v.model.get('amount') > 0);
        });

        v.listenToOnce(v.model, 'destroy', function () {
            v.$el.hide(300, function () {
                v.remove();
            });
        });

        // auto open new transactions
        if (!v.model.id) {
            v.open();
        }
    },
    open() {
        const v = this;

        if (!v.editor) {
            v.editor = new TransactionsEditorView({
                document: this.document,
                model: this.model,
                accounts: this.accounts,
                budgets: this.budgets,
                categories: this.categories
            }).appendTo(this, v.$editor);

            v.listenTo(v.editor, 'close', () => {
                v.$el.removeClass('transactions-item--opened');
            });
        }

        v.$el.addClass('transactions-item--opened');
    }
});
