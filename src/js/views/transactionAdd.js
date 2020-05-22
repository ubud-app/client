'use strict';

import BaseView from './_';
import TemplateHelper from '../helpers/template';
import TransactionAddTemplate from '../../templates/transactionAdd.html';
import TransactionModel from '../models/transaction';
import AccountCollection from '../collections/account';
import ErrorView from './error';
import AppHelper from '../helpers/app';
import StoreHelper from '../helpers/store';
import {evaluate} from 'mathjs/number';


const OPERATOR2SIGN = {
    '/': '÷',
    '*': '×',
    '-': '−',
    '+': '+'
};


/**
 * TransactionAddView
 *
 * @module views/transactionAdd
 * @class TransactionAddView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const TransactionAddView = BaseView.extend({
    className: 'transaction-add b-modal b-modal--hidden',

    render () {
        this.model = new TransactionModel();
        this.data = {
            amount: {
                mode: 'outflow', // outflow, income or transfer
                calculation: null,
                value: 0
            },
            calculation: {
                stack: [],
                currentValue: 0
            },
            account: {
                index: -1,
                model: null,
                after: null
            },
            transferAccount: {
                index: -1,
                model: null,
                after: null
            },
            location: {
                id: null,
                coordinates: null,
                error: null
            },
            hide: () => this.hide(),
            save: () => this.save().catch(error => {
                new ErrorView({error}).appendTo(AppHelper.view());
            })
        };

        TemplateHelper.render({
            view: this,
            template: TransactionAddTemplate,
            data: this.data
        });

        this.activateModal();
        this.$el.find('.transaction-add__amount-input').focus();
        this.getAccounts().catch(error => {
            new ErrorView({error}).appendTo(AppHelper.view());
        });

        const lastUsedLocationOption = StoreHelper.get('saveLocation');
        if(lastUsedLocationOption === 1 || lastUsedLocationOption === null) {
            this.toggleLocation();
        }

        return this;
    },
    onKeyboardPress (e) {
        const button = e.target.innerHTML;
        const number = parseInt(button, 10);

        if (!isNaN(number)) {
            this.data.calculation.currentValue = (this.data.calculation.currentValue * 10) + number;
            this.updateCalculation();
        }
        else if (button === '←' && this.data.calculation.currentValue === 0 && this.data.calculation.stack.length) {
            this.data.calculation.stack.pop();
            this.data.calculation.currentValue = this.data.calculation.stack.pop();
            this.updateCalculation();
        }
        else if (button === '←') {
            this.data.calculation.currentValue = Math.floor(this.data.calculation.currentValue / 10);
            this.updateCalculation();
        }
        else if (button === '⇆' && this.data.amount.mode === 'outflow') {
            this.data.amount.mode = 'income';
        }
        else if (button === '⇆' && this.data.amount.mode === 'income' && this.accounts.length >= 2) {
            this.data.amount.mode = 'transfer';
        }
        else if (button === '⇆') {
            this.data.amount.mode = 'outflow';
        }
        else if (Object.values(OPERATOR2SIGN).includes(button)) {
            this.addOperatorToCalculation(
                Object.entries(OPERATOR2SIGN).find(([, sign]) => sign === button)[0]
            );
        }

        this.updateAccountAfter();

        if (this.data.amount.mode === 'transfer') {
            this.validateTransferAccount();
            this.updateTransferAccountAfter();
        }
    },
    async getAccounts () {
        const accounts = new AccountCollection();
        accounts.filterBy('pluginInstance', null);
        await accounts.fetch();
        this.accounts = [];

        const history = StoreHelper.get('cashAccounts') || [];
        history.sort((a, b) => b[1] - a[1]);
        history.forEach(([id]) => {
            const account = accounts.get(id);
            if (account) {
                this.accounts.push(account);
            }
        });

        const typeRanking = ['savings', 'cash'];
        accounts
            .filter(a => !this.accounts.find(b => a.id === b.id))
            .sort((a, b) => typeRanking.indexOf(b.get('type')) - typeRanking.indexOf(a.get('type')))
            .forEach(account => this.accounts.push(account));

        this.updateAccount();
        this.updateTransferAccount();
    },
    updateCalculation () {
        const calculation = this.data.calculation.stack.join(' ') + this.data.calculation.currentValue;
        this.data.amount.calculation = this.generateCalculationStr();

        const result = Math.round(evaluate(calculation)) || 0;
        this.data.amount.value = !isFinite(result) ? 0 : result;
    },
    generateCalculationStr () {
        if (this.data.calculation.stack.length === 0) {
            return null;
        }

        const parts = this.data.calculation.stack.map((part, i) => {
            if (i % 2 === 0 && i > 0 && ['*', '/'].includes(this.data.calculation.stack[i - 1])) {
                return part;
            }
            else if (i % 2 === 0) {
                return TemplateHelper.formatCurrency(part);
            }
            else {
                return OPERATOR2SIGN[part];
            }
        });
        if (['*', '/'].includes(this.data.calculation.stack[this.data.calculation.stack.length - 1])) {
            parts.push(this.data.calculation.currentValue);
        }
        else {
            parts.push(TemplateHelper.formatCurrency(this.data.calculation.currentValue));
        }

        return parts.join(' ');
    },
    addOperatorToCalculation (operator) {
        this.data.calculation.stack.push(this.data.calculation.currentValue, operator);
        this.data.calculation.currentValue = 0;

        this.updateCalculation();
    },
    updateAccount () {
        this.data.account.index++;
        if (this.data.account.index > this.accounts.length - 1) {
            this.data.account.index = 0;
        }

        this.data.account.model = this.accounts[this.data.account.index];

        if (this.data.amount.mode === 'transfer') {
            this.validateTransferAccount();
        }

        this.updateAccountAfter();
    },
    updateAccountAfter () {
        this.data.account.after = this.accounts[this.data.account.index].get('balance') +
            ((this.data.amount.mode === 'income' ? 1 : -1) * this.data.amount.value);
    },
    updateTransferAccount () {
        this.data.transferAccount.index++;

        const possibilities = this.accounts.filter(a =>
            a.get('documentId') === this.accounts[this.data.account.index].get('documentId')
        );
        if (possibilities.length < 2) {
            this.data.transferAccount.model = null;
            this.data.transferAccount.after = null;
            return;
        }

        if (this.data.transferAccount.index > possibilities.length - 1) {
            this.data.transferAccount.index = 0;
        }
        if (
            possibilities[this.data.transferAccount.index].id === this.accounts[this.data.account.index].id &&
            this.data.transferAccount.index > possibilities.length - 2
        ) {
            this.data.transferAccount.index = 0;
        }
        else if (possibilities[this.data.transferAccount.index].id === this.accounts[this.data.account.index].id) {
            this.data.transferAccount.index++;
        }

        this.data.transferAccount.model = possibilities[this.data.transferAccount.index];
        this.updateTransferAccountAfter();
    },
    validateTransferAccount () {
        if (
            this.data.transferAccount.model &&
            this.accounts[this.data.account.index].get('documentId') === this.data.transferAccount.model.get('documentId')
        ) {
            return;
        }

        this.data.transferAccount.index = -1;
        this.updateTransferAccount();
    },
    updateTransferAccountAfter () {
        this.data.transferAccount.after = this.data.transferAccount.model ?
            this.data.transferAccount.model.get('balance') + this.data.amount.value :
            null;
    },
    toggleLocation () {
        if(this.data.location.id !== null) {
            navigator.geolocation.clearWatch(this.data.location.id);
            this.data.location.id = null;
            this.data.location.coordinates = null;
            this.data.location.error = null;
            StoreHelper.set('saveLocation', 0);
            return;
        }

        StoreHelper.set('saveLocation', 1);
        this.data.location.id = navigator.geolocation.watchPosition(position => {
            this.data.location.coordinates = position.coords;
            this.data.location.error = false;
        }, () => {
            this.data.location.error = true;
        }, {
            enableHighAccuracy: true
        });
    },
    async save () {
        const model = new TransactionModel({
            time: new Date(),
            accountId: this.data.account.model.id,
            documentId: this.data.account.model.get('documentId'),
            amount: this.data.amount.value,
            approved: false,
            locationAccuracy: this.data.location.coordinates?.accuracy || null,
            locationLatitude: this.data.location.coordinates?.latitude || null,
            locationLongitude: this.data.location.coordinates?.longitude || null
        });

        if(this.data.amount.mode === 'outflow') {
            model.set('amount', this.data.amount.value * -1);
        }
        if(this.data.amount.mode === 'transfer') {
            model.set({
                accountId: this.data.transferAccount.model.id,
                approved: true,
                units: [{
                    id: null,
                    type: 'TRANSFER',
                    amount: this.data.amount.value,
                    transferAccountId: this.data.account.model.id
                }]
            });
        }

        try {
            this.$el.addClass('loading');
            await model.save();
        }
        catch(error) {
            this.$el.removeClass('loading');
            throw error;
        }

        const history = StoreHelper.get('cashAccounts') || [];
        const account = history.find(a => a[0] === model.get('accountId'));
        if (account) {
            account[1]++;
        }
        else {
            history.push([model.get('accountId'), 1]);
        }

        StoreHelper.set('cashAccounts', history);
        this.hide();
    }
});

export default TransactionAddView;
