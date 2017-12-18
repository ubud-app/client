'use strict';

import moment from 'moment';
import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import StringHelper from '../helpers/string';
import AccountModel from '../models/account';
import TransactionModel from '../models/transaction';
import DocumentAccountSettingsTemplate from '../../templates/documentAccountSettings.handlebars';

/**
 * @module views/documentAccountSettings
 * @class DocumentAccountSettingsView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'form',
    className: 'document-account-settings app_layout--page',
    events: {
        'submit': 'save',
        'reset': 'back'
    },

    _initialize(options) {
        this.documentId = options.documentId;
        this.accountId = options.accountId;
        this.accountType = options.accountType;
    },

    async render() {
        AppHelper.title('documentAccountSettings.title');

        const documents = await DataHelper.getDocuments().wait();
        this.document = documents.get(this.documentId);
        if (!this.document) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        if(this.model && this.model.id) {
            this.model.live(this);
        }
        else if (!this.model && this.accountId) {
            this.model = await new AccountModel({id: this.accountId}).wait();
            if (!this.model) {
                AppHelper.navigate('/' + this.document.id + '/settings', {trigger: true, replace: true});
            }

            this.model.live(this);
        }
        else {
            this.model = this.model || new AccountModel();
            this.model.set({documentId: this.document.id, type: this.accountType || 'cash'});
        }

        this.$el.html(DocumentAccountSettingsTemplate({
            headline: StringHelper.string('documentAccountSettings.headline.' + (this.model.id ? 'edit' : 'add'))
        }));

        // ID
        this.listenTo(this.model, 'change:id', () => {
            AppHelper.navigate( + '/settings/accounts/' + this.model.id);
        });

        // Name
        const $name = this.$('#document-account-settings_name');
        this.listenToAndCall(this.model, 'change:name', () => {
            $name.val(this.model.get('name'));
        });
        $name.on('change', () => {
            this.model.set({name: $name.val()});
        });

        // Type
        const $type = this.$('#document-account-settings_type');
        this.listenToAndCall(this.model, 'change:type', () => {
            $type.val(this.model.get('type'));
        });
        $type.on('change', () => {
            this.model.set({type: $type.val()});
        });

        // Balance Wrap
        const $balanceWrap = this.$('.document-account-settings_transaction');
        this.listenToAndCall(this.model, 'change:id', () => {
            $balanceWrap.toggleClass('document-account-settings_transaction--visible', !this.model.id);
        });

        // Balance
        const $balance = this.$('#document-account-settings_balance');
        $balance.attr('placeholder', StringHelper.currency(this.document, 0));
        $balance.on('change', () => {
            const v = StringHelper.parseCurrency(this.document, $balance.val());
            $balance.val(v ? StringHelper.currency(this.document, v) : '');
        });

        // Record date
        const $recordDate = this.$('#document-account-settings_record-date');
        $recordDate.attr('placeholder', moment().format('L'));
        $recordDate.on('change', () => {
            const m = moment($recordDate.val(), 'L');
            $recordDate.val((m.isValid() ? m : moment()).format('L'));
        });
    },
    async save(e) {
        e.preventDefault();

        // name
        if(!this.model.get('name')) {
            this.model.set('name', StringHelper.string('documentAccountSettings.name.default'));
        }

        const isNew = !this.model.id;
        await this.model.save();

        if(!isNew) {
            AppHelper.navigate(this.document.id + '/settings', {trigger: true});
            return;
        }

        const balance = StringHelper.parseCurrency(this.document, this.$('#document-account-settings_balance').val());
        const date = moment(this.$('#document-account-settings_record-date').val(), 'L');

        if(balance > 0) {
            const transaction = new TransactionModel({
                accountId: this.model.id,
                amount: balance,
                time: (date.isValid() ? date : moment()).toJSON(),
                memo: StringHelper.string('documentAccountSettings.transaction.memo'),
                units: [{
                    budgetId: 'income-0',
                    amount: balance
                }]
            });

            await transaction.save();
        }

        AppHelper.navigate(this.document.id + '/settings', {trigger: true});
    },
    back(e) {
        e.preventDefault();
        window.history.back();
    }
});
