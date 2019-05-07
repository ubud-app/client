'use strict';

const {DateTime} = require('luxon');
const {throttle} = require('underscore');

const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const TransactionsTemplate = require('../../templates/transactions.html');

const AccountCollection = require('../collections/account');
const BudgetCollection = require('../collections/budget');
const BudgetModel = require('../models/budget');
const TransactionModel = require('../models/transaction');
const TransactionCollection = require('../collections/transaction');


/**
 * TransactionsView
 *
 * @module views/budget
 * @class TransactionsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'transactions',
    events: {
        'scroll': '__onScroll'
    },

    async render () {
        this.data = {
            fixedSeparator: {
                visible: false,
                content: ''
            },
            pages: []
        };

        this._onScroll = throttle(this.onScroll, 100);
        AppHelper.view().setTitle(ConfigurationHelper.getString('budget.title'));

        TemplateHelper.render({
            view: this,
            template: TransactionsTemplate,
            data: this.data
        });


        // Document
        this.document = AppHelper.getDocument(true);
        if(!this.document) {
            return;
        }
        this.live(this.document);
        this.listenToAndCall(this.document, 'change:name', () => {
            AppHelper.title(this.document.get('name'));
        });

        // Accounts
        this.accounts = new AccountCollection();
        this.accounts.filterBy('document', AppHelper.getDocumentId());
        this.live(this.accounts);


        // Budgets
        this.budgets = new BudgetCollection();
        this.budgets.filterBy('document', AppHelper.getDocumentId());
        this.budgets.filterBy('hidden', false);
        this.live(this.budgets);

        await Promise.all([
            this.budgets.wait(),
            this.accounts.wait(),
            this.addMonth('future'),
            this.addNextMonth()
        ]);

        for(let i = 0; i < 100; i += 10) {
            setTimeout(() => {
                this.$el.scrollTop(this.$el.children('.transactions__pages').height());
            }, i);
        }

        return this;
    },

    async addNextMonth () {
        this.addNextMonth.latest = this.addNextMonth.latest ?
            this.addNextMonth.latest.minus({months: 1}) :
            DateTime.local();
        this.addMonth(this.addNextMonth.latest);
    },
    async addMonth (month) {
        //console.log('addMonth', month.toString());
        const transactions = new TransactionCollection();
        transactions.filterBy('document', AppHelper.getDocumentId());
        if (month !== 'future') {
            transactions.filterBy('month', month.toFormat('yyyy-LL'), {
                comparator: '=',
                attribute: 'month'
            });
        }
        else {
            transactions.filterBy('future', true, {
                comparator: '>=',
                attribute: 'month',
                values: [DateTime.local().plus({months: 1}).toFormat('yyyy-LL')]
            });
        }

        const page = {
            month: month,
            separator: month === 'future' ?
                'FUTURE' :
                month.toLocaleString(Object.assign(
                    {},
                    DateTime.DATE_FULL,
                    {
                        day: undefined
                    }
                )),
            transactions: []
        };

        await transactions.wait();
        this.live(transactions);

        await this.budgets.wait();

        transactions.each(t => this.addTransaction(page, t));
        this.listenTo(transactions, 'add', t => this.addTransaction(page, t));
        this.listenTo(transactions, 'remove', t => this.removeTransaction(page, t));

        this.data.pages[month === 'future' ? 'push' : 'unshift'](page);
        this.$el.css('-webkit-overflow-scrolling', 'auto');
        this.$el.scrollTop(this.$el.find('.transactions__page').first().height() + this.$el.scrollTop());
        this.$el.css('-webkit-overflow-scrolling', 'touch');

        if(month !== 'future' && this.$el.children('.transactions__pages').height() < window.innerHeight * 1.5) {
            await this.addNextMonth();
        }
    },
    addTransaction (page, transaction) {
        const item = {
            id: transaction.id,
            model: transaction,
            open: () => {
                this.openTransaction(transaction);
            },
            pending: false,
            negative: false,
            date: {
                big: '',
                small: '',
                full: ''
            },
            budget: '',
            noBudget: true
        };

        this.listenToAndCall(transaction, 'change:status', () => {
            item.pending = transaction.get('status') === 'pending';
        });
        this.listenToAndCall(transaction, 'change:amount', () => {
            item.negative = transaction.get('amount') < 0;
        });
        this.listenToAndCall(transaction, 'change:time', () => {
            const time = DateTime.fromISO(transaction.get('time'));
            item.date.big = time.toLocaleString({day: 'numeric'});
            item.date.small = time.toLocaleString({month: 'long'});
            item.date.full = time.toLocaleString(DateTime.DATE_FULL);
        });
        this.listenToAndCall(transaction, 'change:units sync', () => {
            this.updateBudgetString(item, transaction);
        });

        page.transactions.push(item);
    },
    removeTransaction (page, transaction) {
        const i = page.transactions.findIndex(e => e.id === transaction.id);
        if (i > -1) {
            page.transactions.splice(i, 1);
        }
    },
    updateBudgetString (item, transaction) {
        Promise.all(transaction.get('units').map(unit => (async () => {
            if (unit.type === 'INCOME_NEXT') {
                return ConfigurationHelper.getString('transactions.budget.income', {
                    month: DateTime.fromISO(transaction.get('time'))
                        .plus({months: 1})
                        .toLocaleString({month: 'long'})
                });
            }
            else if (unit.type === 'INCOME') {
                return ConfigurationHelper.getString('transactions.budget.income', {
                    month: DateTime.fromISO(transaction.get('time'))
                        .toLocaleString({month: 'long'})
                });
            }
            else if (unit.type === 'TRANSFER') {
                await this.accounts.wait();
                return (
                    this.accounts.get(unit.transferAccountId) ?
                        this.accounts.get(unit.transferAccountId).get('name') :
                        ''
                );
            }
            else if (unit.type === 'BUDGET') {
                let budget = this.budgets.get(unit.budgetId) || new BudgetModel({id: unit.budgetId});
                if (!budget.get('name')) {
                    await budget.wait();
                }

                return budget.get('name');
            }
            else {
                return '?';
            }
        })())).then(strings => {
            item.budget = strings.join(', ') || ConfigurationHelper.getString('transactions.budget.noBudget');
            item.noBudget = !strings.length;
        });
    },

    onScroll () {
        if(this.onScroll.lock || this.$el.scrollTop() - (2 * window.innerHeight) > 0) {
            return;
        }

        this.onScroll.lock = true;
        this.addNextMonth().then(() => {
            this.onScroll.lock = false;
        }).catch(error => {
            new ErrorView({error}).appendTo(AppHelper.view());
        });
    },
    __onScroll () {
        this._onScroll();
    },

    openTransaction (transaction) {
        const TransactionDetailsView = require('./transactionDetails');
        const view = new TransactionDetailsView({model: transaction});
        view.appendTo(AppHelper.view());
    },
    newTransaction () {
        const TransactionDetailsView = require('./transactionDetails');
        const transaction = new TransactionModel({
            time: new Date().toJSON(),
            units: []
        });

        const view = new TransactionDetailsView({model: transaction});
        view.appendTo(AppHelper.view());
    }
});
