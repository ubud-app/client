'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import ReconcileTemplate from '../../templates/reconcile.html';

import TransactionModel from '../models/transaction';
import AccountCollection from '../collections/account';


/**
 * ReconcileView
 *
 * @module views/reconcile
 * @class ReconcileView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const ReconcileView = BaseView.extend({
    className: 'reconcile b-modal b-modal--hidden b-loader b-loader--light',

    render () {

        this.data = {
            accounts: {
                currentId: null,
                checkedIds: [],
                models: []
            },
            form: {
                currentValue: 0
            },
            adjustment: {
                positive: false,
                negative: false,
                text: null
            },
            buttons: {
                nextLabel: 'reconcile.saveAndNext'
            },
            hide: () => this.hide()
        };

        TemplateHelper.render({
            view: this,
            template: ReconcileTemplate,
            data: this.data
        });

        // Accounts
        this.accounts = new AccountCollection();
        this.accounts.filterBy('document', AppHelper.getDocumentId());
        this.listenTo(this.accounts, 'add', this.addAccount);
        this.listenTo(this.accounts, 'remove', this.removeAccount);
        this.live(this.accounts);

        this.activateModal();

        this.accounts.wait().then(() => {
            if (!this.data.accounts.currentId) {
                this.goToAccount(this.accounts.first().id);
            }
        });
    },

    addAccount (account) {
        this.listenToAndCall(account, 'change:pluginInstanceId', () => {
            if (!account.get('pluginInstanceId') && !this.data.accounts.models.includes(account)) {
                this.pushAt(this.accounts, account, this.data.accounts.models, account);
            }
            else if (account.get('pluginInstanceId') && this.data.accounts.models.includes(account)) {
                const i = this.data.accounts.models.indexOf(account);
                this.data.accounts.models.splice(i, 1);
            }
        });
        this.listenTo(account, 'change:balance', () => {
            if (this.data.accounts.currentId === account.id) {
                this.data.form.currentValue = account.get('balance');
            }
        });
    },
    removeAccount (account) {
        this.stopListening(account, 'change:pluginInstanceId');

        const i = this.data.accounts.models.indexOf(account);
        if (i > -1) {
            this.data.accounts.models.splice(i, 1);
        }
    },

    goToAccount (accountId) {
        if (typeof accountId === 'string') {
            this.data.accounts.currentId = accountId;
        }

        const id = this.data.accounts.currentId;
        const account = this.accounts.get(id);
        if (!account) {
            return;
        }

        this.data.buttons.nextLabel = 'reconcile.save' + (
            this.accounts.indexOf(account) === this.accounts.length - 1 ? '' : 'AndNext'
        );

        this.data.form.currentValue = account.get('balance');
        this.updateAdjustment();
    },
    updateAdjustment () {
        const id = this.data.accounts.currentId;
        const account = this.accounts.get(id);
        if (!account) {
            return;
        }

        const diff = this.data.form.currentValue - account.get('balance');
        this.data.adjustment.positive = diff > 0;
        this.data.adjustment.negative = diff < 0;
        this.data.adjustment.text = ConfigurationHelper.getString('reconcile.' + (diff >= 0 ? 'positive' : 'negative'), {
            amount: TemplateHelper.formatCurrency(diff)
        });
    },

    submit (e) {
        e.preventDefault();

        const id = this.data.accounts.currentId;
        const account = this.accounts.get(id);
        if (!account) {
            return;
        }

        const diff = this.data.form.currentValue - account.get('balance');
        const model = new TransactionModel({
            time: new Date(),
            amount: diff,
            status: 'cleared',
            accountId: account.id,
            reconcile: true
        });

        model.save()
            .then(() => this.accounts.fetch())
            .catch(error => {
                new ErrorView({error}).appendTo(AppHelper.view());
            });

        this.data.accounts.checkedIds.push(account.id);
        const nextAccount = this.accounts.find(a => !this.data.accounts.checkedIds.includes(a.id));
        if (nextAccount) {
            this.goToAccount(nextAccount.id);
        }
        else {
            this.hide();
        }
    }
});

export default ReconcileView;
