'use strict';

import $ from 'jquery';
import _ from 'underscore';
import BaseView from './_';
import PayeeModel from '../models/payee';
import PayeeCollection from '../collections/payee';
import StringHelper from '../helpers/string';
import AccountModel from '../models/account';

/**
 * @module views/transactionsEditorPayeeSelect
 * @class TransactionsEditorPayeeSelectView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'div',
    className: 'transactions-editor-payee-select',
    events: {
        'click .transactions-editor-payee-select_value': 'activate',
        'keyup .transactions-editor-payee-select_input': 'process',
        'keydown .transactions-editor-payee-select_input': 'selectByKeyboard',
        'blur .transactions-editor-payee-select_input': 'blur',
        'click .transactions-editor-payee-select_create': 'create'
    },

    _initialize (options) {
        this.document = options.document;
        this.accounts = options.accounts;
    },

    render () {
        const v = this;

        // input
        v.$input = $('<input class="transactions-editor-payee-select_input" tabindex="3" />').appendTo(v.$el);
        v.$input.on('focus', () => {
            this.activate();
        });

        // value
        v.$value = $('<span class="transactions-editor-payee-select_value" />').appendTo(v.$el);
        v.listenToAndCall(v.model, 'change:payeeId change:units', () => {

            // Transfers
            const transfers = (v.model.getUnits() || []).filter(unit => unit.get('type') === 'TRANSFER');
            if (transfers.length) {
                v.$value.text('-').addClass('transactions-editor-payee-select_value--temp');

                Promise
                    .all(transfers.map(async transfer => {
                        const account = new AccountModel({id: transfer.get('transferAccountId')});
                        await account.fetch();
                        return account.get('name');
                    }))
                    .then(accounts => {
                        v.$value
                            .removeClass('transactions-editor-payee-select_value--temp')
                            .text('→ ' + accounts.join(', '));
                        v.$input.attr('placeholder', '→ ' + accounts.join(', '));
                    });
                return;
            }

            if (!v.model.has('payeeId') && v.model.has('pluginsOwnPayeeId')) {
                v.$value.text(v.model.get('pluginsOwnPayeeId')).addClass('transactions-editor-payee-select_value--temp');
                v.$input.attr('placeholder', v.model.get('pluginsOwnPayeeId'));
                return;
            }
            if (!v.model.has('payeeId')) {
                v.$value.text('-').removeClass('transactions-editor-payee-select_value--temp');
                v.$input.attr('placeholder', '');
                return;
            }

            const payee = new PayeeModel({id: v.model.get('payeeId')});
            v.listenToOnce(payee, 'change:name', () => {
                v.$value.text(payee.get('name')).removeClass('transactions-editor-payee-select_value--temp');
                v.$input.attr('placeholder', payee.get('name'));
            });

            payee.fetch();
        });

        v._lastQ = '';
        v.$resultsBox = $('<div class="transactions-editor-payee-select_results-box" />').appendTo(v.$el);
        v.$results = $('<div class="transactions-editor-payee-select_results" />').appendTo(v.$resultsBox);
        v.$create = $('<div class="transactions-editor-payee-select_item transactions-editor-payee-select_create" />').appendTo(v.$resultsBox);
    },

    activate () {
        const v = this;
        v.$value.addClass('transactions-editor-payee-select_value--hidden');
        v.$input.addClass('transactions-editor-payee-select_input--visible');

        if (!v.$input.is(':focus')) {
            v.$input.focus();
        }
    },

    deactivate () {
        const v = this;
        v.$value.removeClass('transactions-editor-payee-select_value--hidden');
        v.$input.removeClass('transactions-editor-payee-select_input--visible').val('');
        if (v.$input.is(':focus')) {
            v.$input.blur();
        }

        v.$resultsBox.removeClass('transactions-editor-payee-select_results-box--visible');
    },

    blur () {
        const v = this;
        _.delay(() => {
            v.deactivate();
        }, 250);
    },

    async process (e) {
        const v = this;
        const q = v.$input.val();
        e.stopPropagation();

        if (!q && !v._lastQ && e.keyCode === 8) {
            v.deactivate();

            if(this.model.get('payeeId')) {
                v.model.set({payeeId: null});
            }
            else if(this.model.get('units').find(u => u.type === 'TRANSFER')) {
                v.model.set({units: []});
            }

            return;
        }
        if (q === v._lastQ) {
            return;
        }
        v._lastQ = q;

        if (q.length < 2) {
            v.$resultsBox.removeClass('transactions-editor-payee-select_results-box--visible');
            return;
        }

        const payees = new PayeeCollection();
        payees.id = 'document:' + v.document.id + '/limit:4/q:' + q.replace(/[:|/|*]/g, '%');
        await payees.fetch();
        if (q !== v._lastQ) {
            return;
        }

        v.$create.text(StringHelper.string('transactions.payeeSelect.create', {q}));
        v.$resultsBox.addClass('transactions-editor-payee-select_results-box--visible');

        v.$results.empty();

        let firstItem = false;
        this.accounts
            .filter(a =>
                a.get('name').indexOf(q) > -1 && !a.get('pluginInstanceId')
            )
            .forEach(account => {
                const $i = $('<div class="transactions-editor-payee-select_item" />')
                    .text('→ ' + account.get('name'))
                    .data('id', 'account:' + account.id)
                    .click(function () {
                        this.selectItem('account:' + account.id);
                    });

                if (!firstItem) {
                    firstItem = true;
                    $i.addClass('transactions-editor-payee-select_item--selected');
                }

                $i.appendTo(v.$results);
            });
        payees.each(payee => {
            const $i = $('<div class="transactions-editor-payee-select_item" />')
                .text(payee.get('name'))
                .data('id', 'payee:' + payee.id)
                .click(function () {
                    this.selectItem('payee:' + payee.id);
                });

            if (!firstItem) {
                firstItem = false;
                $i.addClass('transactions-editor-payee-select_item--selected');
            }

            $i.appendTo(v.$results);
        });

        v._selected = 0;
    },

    async create () {
        const v = this;
        const q = v.$input.val();

        v.$value.text(q);

        const payee = new PayeeModel({
            name: q,
            documentId: v.document.id
        });
        await payee.save();

        v.deactivate();
        v.model.set({
            payeeId: payee.id
        });
    },

    selectByKeyboard (e) {
        const v = this;

        if (e.keyCode !== 38 && e.keyCode !== 40 && e.keyCode !== 13) {
            return;
        }

        e.preventDefault();
        const $items = v.$resultsBox.find('.transactions-editor-payee-select_item');
        if (e.keyCode === 13 && $items.length > v._selected) {
            const id = $items.eq(v._selected).data('id');
            if (id) {
                v.deactivate();
                this.selectItem(id);
            }
            else {
                v.create();
            }
        }
        else if (e.keyCode === 13) {
            return;
        }

        $items.removeClass('transactions-editor-payee-select_item--selected');

        v._selected += e.keyCode === 38 ? -1 : 1;
        if (v._selected < 0) {
            v._selected = $items.length - 1;
        }
        if (v._selected >= $items.length) {
            v._selected = 0;
        }

        $items.eq(v._selected).addClass('transactions-editor-payee-select_item--selected');
    },
    selectItem (id) {
        if (id.substr(0, 6) === 'payee:') {
            this.model.set({
                payeeId: id.substr(6)
            });

            if ((this.model.get('units') || []).filter(u => u.type === 'TRANSFER')) {
                this.model.set({
                    units: []
                });
            }
        }
        else if (id.substr(0, 8) === 'account:') {
            this.model.set({
                payeeId: null,
                units: [{
                    type: 'TRANSFER',
                    transferAccountId: id.substr(8),
                    amount: this.model.get('amount')
                }]
            });
        }
    }
});
