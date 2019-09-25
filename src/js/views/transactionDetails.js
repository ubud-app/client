'use strict';

import {debounce} from 'underscore';
import $ from 'zepto';
import {DateTime} from 'luxon';
import Sentry from '@sentry/browser';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import TransactionDetailsTemplate from '../../templates/transactionDetails.html';

import PayeeModel from '../models/payee';

import AccountCollection from '../collections/account';
import BudgetCollection from '../collections/budget';
import CategoryCollection from '../collections/category';
import PayeeCollection from '../collections/payee';
import BudgetGuessCollection from '../collections/budgetGuess';


/**
 * TransactionDetailsView
 *
 * @module views/transactionDetails
 * @class TransactionDetailsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const TransactionDetailsView = BaseView.extend({
    className: 'transaction-details transaction-details--hidden',

    async render () {
        this.data = {
            model: this.model,
            fields: {
                time: null,
                payee: this.model.get('payeeName'),
                showBudgetMemos: false,
                autoCompletionCreateSelected: false,
                autoCompletionCreateText: '',
                animateBudgetFields: false,
                isManaged: false,
                showUnitGuesses: false
            },
            dateTimeFallback: {
                enabled: false,
                date: null,
                time: null
            },
            autoCompletion: [],
            units: [],
            unitGuesses: new BudgetGuessCollection(),
            accounts: [],
            typeSelector: {
                incomeLabel: '',
                incomeNextLabel: '',
                accounts: [],
                categories: []
            }
        };


        // Units
        const addUnits = debounce(this.addUnits, 25);
        this.listenToAndCall(this.model, 'change:units', addUnits);
        this.listenToAndCall(this.model, 'change:units', () => {
            this.data.fields.showBudgetMemos = !!(
                this.model.get('units').length > 1 ||
                this.model.get('units').find(u => u.memo)
            );
        });
        this.listenTo(this.model, 'change:amount', () => this.checkUnits());


        // Time
        this.listenToAndCall(this.model, 'change:time', () => {
            const date = DateTime.fromISO(this.model.get('time'));
            this.data.typeSelector.incomeLabel = ConfigurationHelper.getString('transactionDetails.budget.income', {
                month: date.toLocaleString({month: 'long'})
            });
            this.data.typeSelector.incomeNextLabel = ConfigurationHelper.getString('transactionDetails.budget.income', {
                month: date.plus({months: 1}).toLocaleString({month: 'long'})
            });
        });


        TemplateHelper.render({
            view: this,
            template: TransactionDetailsTemplate,
            data: this.data
        });

        if (this.$el.find('.transaction-details__field-input--datetime').get(0).type !== 'datetime-local') {
            this.enableDateTimeFallback();
        }


        // Accounts
        this.accounts = new AccountCollection();
        this.accounts.filterBy('document', AppHelper.getDocumentId());
        this.listenToAndCall(this.accounts, 'add remove', addUnits);
        this.listenTo(this.accounts, 'add', account => {
            if (!account.get('pluginInstanceId')) {
                this.data.accounts.push(account);

                if (!this.model.get('accountId')) {
                    this.model.set('accountId', account.id);
                }
            }
        });
        this.listenTo(this.accounts, 'remove', account => {
            const i = this.data.accounts.findIndex(a => a.id === account.id);
            if (i > -1) {
                this.data.accounts.splice(i, 1);
            }
        });
        this.live(this.accounts);
        this.accounts.wait().then(() => {
            const account = this.accounts.get(this.model.get('accountId'));
            if (account && account.get('pluginInstanceId')) {
                this.data.fields.isManaged = true;
            }
        });

        // Budgets
        this.budgets = new BudgetCollection();
        this.budgets.filterBy('document', AppHelper.getDocumentId());
        this.budgets.filterBy('hidden', false);
        this.listenToAndCall(this.budgets, 'add remove', addUnits);
        this.live(this.budgets);

        // Categories
        this.categories = new CategoryCollection();
        this.categories.filterBy('document', AppHelper.getDocumentId());
        this.listenToAndCall(this.categories, 'add remove', addUnits);
        this.live(this.categories);


        // Payees
        this.payees = new PayeeCollection();
        this.listenTo(this.payees, 'add', payee => {
            this.data.fields.autoCompletionCreateSelected = false;

            this.data.autoCompletion.push({
                selected: this.data.autoCompletion.length === 0,
                model: payee,
                click: () => {
                    this.$el.find('.transaction-details__input--payee').blur();

                    this.model.set({
                        payeeId: payee.id,
                        payeeName: payee.get('name')
                    });
                }
            });

            if (payee.id === this.model.get('payeeId')) {
                this.data.autoCompletion.forEach(s =>
                    s.selected = s.model.id === this.model.get('payeeId')
                );
            }

            if (payee.get('name') === this.data.fields.payee) {
                this.data.fields.autoCompletionCreateText = '';
            }
        });
        this.listenTo(this.payees, 'remove', payee => {
            const i = this.data.autoCompletion.findIndex(p => p.model.id === payee.id);
            const j = this.data.autoCompletion[i];

            this.data.autoCompletion.splice(i, 1);
            if (j.selected && this.data.autoCompletion.length > 0) {
                this.data.autoCompletion[0].selected = true;
            }
        });
        this.listenToAndCall(this.model, 'change:payeeName', () => {
            this.data.fields.payee = this.model.get('payeeName');
        });

        this.listenToAndCall(this.accounts, 'add remove', this.updateTypeSelectorAccounts);
        this.listenToAndCall(this.model, 'change:accountId', this.updateTypeSelectorAccounts);

        Promise.all([
            this.budgets.wait(),
            this.categories.wait()
        ]).then(() => {
            const updateBudgets = debounce(this.updateBudgets, 25);
            this.updateBudgets();

            this.listenToAndCall(this.budgets, 'add remove', updateBudgets);
            this.listenToAndCall(this.categories, 'add remove', updateBudgets);
        });


        // Budget Guess
        this.listenToAndCall(this.model, 'change:id', () => {
            this.data.unitGuesses.resetFilters();

            if(this.model.id) {
                this.data.unitGuesses.filterBy('transactionId', this.model.id);
                this.data.unitGuesses.fetch();
            }
        });

        const updateBudgetGuessVisibility = () => {
            this.data.fields.showUnitGuesses = this.model.get('units').length !== 0 || this.data.unitGuesses.length === 0;
        };
        this.listenTo(this.data.unitGuesses, 'sync', updateBudgetGuessVisibility);
        this.listenToAndCall(this.model, 'change:units', updateBudgetGuessVisibility);


        // ESC
        const escCb = e => {
            if (
                e.keyCode === 27 &&
                !this.data.fields.autoCompletionCreateText &&
                this.data.autoCompletion.length === 0
            ) {
                this.hide();
            }
        };
        $('body').on('keydown', escCb);
        this.once('remove', () => {
            $('body').off('keydown', escCb);
        });


        setTimeout(() => {
            this.$el.removeClass('transaction-details--hidden');
        }, 0);

        return this;
    },

    async hide (fetch = true) {
        if (fetch && this.model.id) {
            this.model.fetch().catch(error => {
                new ErrorView({error}).appendTo(AppHelper.view());
            });
        }

        this.trigger('hide');
        this.$el.addClass('transaction-details--hidden');

        await new Promise(cb => setTimeout(cb, 300));
        this.remove();
    },
    async submit (e) {
        e.preventDefault();
        this.$el.addClass('transaction-details--hidden');

        const invalid = this.checkUnits();
        if (invalid) {
            return;
        }

        this.hide(false).catch(err => Sentry.captureException(err));

        try {
            await this.model.save({
                approved: true
            });
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());

            const view = new TransactionDetailsView({model: this.model});
            view.appendTo(AppHelper.view());
        }
    },

    async addUnits () {
        await Promise.all([
            this.budgets.wait(),
            this.categories.wait()
        ]);

        this.model.get('units').forEach((unit, i) => {
            let json = this.data.units[i];
            if (!json) {
                json = {id: unit.id};
                this.data.units.push(json);
            }

            if (unit.amount !== json.amount) {
                json.amount = unit.amount;
            }
            if (unit.memo !== json.memo) {
                json.memo = unit.memo;
            }

            if (unit.type === 'INCOME' || unit.type === 'INCOME_NEXT') {
                json.type = unit.type;
            }
            else if (unit.type === 'TRANSFER') {
                json.type = 'TRANSFER:' + unit.transferAccountId;
            }
            else if (unit.type === 'BUDGET') {
                json.type = 'BUDGET:' + unit.budgetId;
            }
        });
        this.data.units.forEach((units, i) => {
            if (!this.model.get('units')[i]) {
                this.data.units.splice(i, 1);
            }
        });

        this.checkUnits();

        setTimeout(() => {
            this.data.fields.animateBudgetFields = true;
        }, 0);
    },
    updateTypeSelectorAccounts () {
        this.accounts.each(account => {
            if (this.data.typeSelector.accounts.indexOf(account) === -1 && account.id !== this.model.get('accountId')) {
                this.data.typeSelector.accounts.push(account);
            }
        });
        this.data.typeSelector.accounts.forEach(account => {
            const i = this.accounts.indexOf(account);
            if (i !== -1 && (!account || account.id === this.model.get('accountId'))) {
                this.data.typeSelector.accounts.splice(i, 1);
            }
        });
    },
    updateBudgets () {
        this.categories.each(category => {
            let json = this.data.typeSelector.categories.find(j => j.id === category.id);
            if (!json) {
                json = {
                    id: category.id,
                    model: category,
                    budgets: []
                };
                this.data.typeSelector.categories.push(json);
            }

            this.budgets.each(budget => {
                if (budget.get('categoryId') === json.id && json.budgets.indexOf(budget) === -1) {
                    json.budgets.push(budget);
                }
            });
        });
    },
    updatePayeeSelect () {
        if (this.data.fields.payee && this.data.fields.payee.length <= 2) {
            this.data.fields.autoCompletionCreateText = '';
            this.payees.set([]);
            return;
        }

        this.payees.resetFilters();
        this.payees.filterBy('document', AppHelper.getDocumentId());
        this.payees.filterBy('q', this.data.fields.payee);
        this.payees.fetch();

        this.data.fields.autoCompletionCreateText = this.payees.find(
            p => p.get('name') === this.data.fields.payee
        ) ? '' : this.data.fields.payee;
    },
    async updatePayeeSelection (e) {
        if (e.keyCode === 27 && (this.data.autoCompletion.length || this.data.fields.autoCompletionCreateText)) {
            e.stopPropagation();
            return this.blurPayeeSelection();
        }

        const i = this.data.autoCompletion.findIndex(s => s.selected);
        if (e.keyCode === 13 && i === -1 && this.data.fields.autoCompletionCreateSelected) {
            e.stopPropagation();
            e.preventDefault();
            await this.clickAutoCompletionCreate();
            return;
        }
        else if (e.keyCode === 13 && i > -1) {
            const {model} = this.data.autoCompletion[i];
            this.$el.find('.transaction-details__input--payee').blur();

            this.model.set({
                payeeId: model.id,
                payeeName: model.get('name')
            });

            return;
        }

        if (!this.data.fields.autoCompletionCreateText || (e.keyCode !== 38 && e.keyCode !== 40)) {
            return;
        }

        e.preventDefault();

        if (e.keyCode === 38 && this.data.fields.autoCompletionCreateSelected && this.data.autoCompletion.length) {
            this.data.fields.autoCompletionCreateSelected = false;
            this.data.autoCompletion[this.data.autoCompletion.length - 1].selected = true;
        }
        else if (e.keyCode === 38 && i > 0) {
            this.data.autoCompletion[i].selected = false;
            this.data.autoCompletion[i - 1].selected = true;
        }
        else if (e.keyCode === 38 && i === 0) {
            this.data.autoCompletion[i].selected = false;
            this.data.fields.autoCompletionCreateSelected = true;
        }
        else if (e.keyCode === 13 && this.data.autoCompletion.length) {
            this.data.autoCompletion[0].selected = true;
        }
        else if (e.keyCode === 40 && this.data.fields.autoCompletionCreateSelected && this.data.autoCompletion.length) {
            this.data.autoCompletion[0].selected = true;
            this.data.fields.autoCompletionCreateSelected = false;
        }
        else if (e.keyCode === 40 && i > -1 && i < this.data.autoCompletion.length - 1) {
            this.data.autoCompletion[i].selected = false;
            this.data.autoCompletion[i + 1].selected = true;
        }
        else if (e.keyCode === 40 && i > -1 && i === this.data.autoCompletion.length - 1) {
            this.data.autoCompletion[i].selected = false;
            this.data.fields.autoCompletionCreateSelected = true;
        }
        else {
            this.data.fields.autoCompletionCreateSelected = true;
        }
    },
    async clickAutoCompletionCreate () {
        const payee = new PayeeModel({
            name: this.data.fields.autoCompletionCreateText,
            documentId: AppHelper.getDocumentId()
        });

        try {
            await payee.save();

            this.model.set({
                payeeId: payee.id,
                payeeName: payee.get('name')
            });

            this.data.fields.payee = payee.get('name');
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
        }
    },
    blurPayeeSelection (e) {
        if (e && e.preventDefault) {
            setTimeout(() => this.blurPayeeSelection(), 100);
            return;
        }

        this.data.fields.autoCompletionCreateText = '';
        this.payees.set([]);

        this.data.fields.payee = this.model.get('payeeName');
    },

    getBudgetedAccount () {
        return this.data.units
            .map(o => o.amount)
            .reduce((a, b) => a + b, 0);
    },
    addUnit () {
        this.data.units.push({
            id: null,
            amount: this.model.get('amount') - this.getBudgetedAccount(),
            memo: null,
            type: null
        });

        this.checkUnits();
    },
    checkUnits () {

        // remove unit
        const remove = this.data.units.findIndex(u => u.type === 'REMOVE');
        if (remove > -1) {
            this.data.units.splice(remove, 1);
        }

        const sum = this.model.get('amount');
        const budgeted = this.getBudgetedAccount();

        const invalid = this.data.units.map(unit => {
            let invalid = false;

            // empty or invalid
            if (unit.amount === 0 || typeof unit.amount !== 'number' || isNaN(unit.amount)) {
                invalid = true;
            }

            // amount does not match
            if (sum !== budgeted) {
                invalid = true;
            }

            // type empty
            if (!unit.type) {
                invalid = true;
            }

            unit.invalid = invalid;
            return invalid;
        }).find(Boolean);

        if (!invalid) {
            this.model.set({
                units: this.data.units.map(unit => {
                    const p = unit.type.split(':');
                    const json = {
                        id: unit.id,
                        amount: unit.amount,
                        memo: unit.memo
                    };

                    if (p[0] === 'INCOME' || p[0] === 'INCOME_NEXT') {
                        json.type = unit.type;
                    }
                    else if (p[0] === 'TRANSFER') {
                        json.type = 'TRANSFER';
                        json.transferAccountId = p[1];
                    }
                    else if (p[0] === 'BUDGET') {
                        json.type = 'BUDGET';
                        json.budgetId = p[1];
                    }

                    return json;
                })
            });
        }

        this.data.fields.showBudgetMemos = !!(
            this.data.units.length > 1 ||
            this.data.units.find(u => u.memo)
        );

        return invalid;
    },
    applyQuickUnit (e) {
        e.preventDefault();

        const budgetId = e.target.getAttribute('data-id');
        this.data.units.push({
            id: null,
            amount: this.model.get('amount') - this.getBudgetedAccount(),
            memo: null,
            type: 'BUDGET:' + budgetId
        });

        this.checkUnits();
    },
    async removeTransaction () {
        try {
            await this.model.destroy();
            await this.hide(false);
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
        }
    },

    enableDateTimeFallback () {
        this.data.dateTimeFallback.enabled = true;

        this.listenToAndCall(this.model, 'change:time', () => {
            const time = DateTime.fromISO(this.model.get('time'));
            this.data.dateTimeFallback.date = time.toISODate();
            this.data.dateTimeFallback.time = time.toFormat('HH:mm');
        });
    },
    updateModelDateFromFallback () {
        const time = this.data.dateTimeFallback.time.split(':');
        this.model.set({
            time: DateTime.fromISO(this.data.dateTimeFallback.date)
                .set({hour: time[0], minute: time[1]})
                .toJSON()
        });
    }
});

export default TransactionDetailsView;
