'use strict';

import $ from 'jquery';
import _ from 'underscore';
import BaseView from './_';
import PayeeModel from '../models/payee';
import PayeeCollection from '../collections/payee';
import StringHelper from '../helpers/string';

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
        'click .transactions-aditor-payee-select_create': 'create'
    },

    _initialize(options) {
        this.document = options.document;
    },

    render() {
        const v = this;

        // input
        v.$input = $('<input class="transactions-editor-payee-select_input" />').appendTo(v.$el);

        // value
        v.$value = $('<span class="transactions-editor-payee-select_value" />').appendTo(v.$el);
        v.listenToAndCall(v.model, 'change:payeeId', () => {
            if(!v.model.has('payeeId')) {
                v.$value.text('-');
                v.$input.attr('placeholder', '');
                return;
            }

            const payee = new PayeeModel({id: v.model.get('payeeId')});
            v.listenToOnce(payee, 'change:name', () => {
                v.$value.text(payee.get('name'));
                v.$input.attr('placeholder', payee.get('name'));
            });

            payee.fetch();
        });

        v._lastQ = '';
        v.$resultsBox = $('<div class="transactions-editor-payee-select_results-box" />').appendTo(v.$el);
        v.$results = $('<div class="transactions-editor-payee-select_results" />').appendTo(v.$resultsBox);
        v.$create = $('<div class="transactions-editor-payee-select_item transactions-editor-payee-select_create" />').appendTo(v.$resultsBox);
    },

    activate() {
        const v = this;
        v.$value.addClass('transactions-editor-payee-select_value--hidden');
        v.$input.addClass('transactions-editor-payee-select_input--visible').focus();
    },

    deactivate() {
        const v = this;
        v.$value.removeClass('transactions-editor-payee-select_value--hidden');
        v.$input.removeClass('transactions-editor-payee-select_input--visible').val('');
        if(v.$input.is(':focus')) {
            v.$input.blur();
        }

        v.$resultsBox.removeClass('transactions-editor-payee-select_results-box--visible');
    },

    blur() {
        const v = this;
        _.delay(() => {
            v.deactivate();
        }, 100);
    },

    async process() {
        const v = this;
        const q = v.$input.val();

        if(!q && !v._lastQ) {
            v.deactivate();
            v.model.set({payeeId: null});
            return;
        }
        if(q === v._lastQ) {
            return;
        }
        v._lastQ = q;

        if(q.length < 4) {
            v.$resultsBox.removeClass('transactions-editor-payee-select_results-box--visible');
            return;
        }

        const payees = new PayeeCollection();
        payees.id = 'document:' + v.document.id + '/limit:4/q:' + q.replace(/[:|/|*]/g, '%');
        await payees.fetch();
        if(q !== v._lastQ) {
            return;
        }

        v.$create.text(StringHelper.string('transactions.payeeSelect.create', {q}));
        v.$resultsBox.addClass('transactions-editor-payee-select_results-box--visible');

        v.$results.empty();
        if(!payees.length) {
            v.$resultsBox.removeClass('transactions-editor-payee-select_results-box--visible');
        }
        payees.each((payee, i) => {
            const $i = $('<div class="transactions-editor-payee-select_item" />')
                .text(payee.get('name'))
                .data('id', payee.id)
                .click(function() {
                    v.deactivate();
                    v.model.set({
                        payeeId: payee.id
                    });
                });

            if(i === 0) {
                $i.addClass('transactions-editor-payee-select_item--selected');
            }

            $i.appendTo(v.$results);
        });

        v._selected = 0;
    },

    async create() {
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

    selectByKeyboard(e) {
        const v = this;

        if(e.keyCode !== 38 && e.keyCode !== 40 && e.keyCode !== 13) {
            return;
        }

        const $items = v.$resultsBox.find('.transactions-editor-payee-select_item');
        if(e.keyCode === 13 && $items.length > v._selected) {
            const id = $items.eq(v._selected).data('id');
            if(id) {
                v.deactivate();
                v.model.set({
                    payeeId: id
                });
            }else{
                v.create();
            }
        }
        else if(e.keyCode === 13) {
            return;
        }

        $items.removeClass('transactions-editor-payee-select_item--selected');

        v._selected += e.keyCode === 38 ? -1 : 1;
        if(v._selected < 0) {
            v._selected = $items.length - 1;
        }
        if(v._selected >= $items.length) {
            v._selected = 0;
        }

        $items.eq(v._selected).addClass('transactions-editor-payee-select_item--selected');
    }
});
