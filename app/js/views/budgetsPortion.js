'use strict';

import $ from 'jquery';
import BaseView from './_';
import StringHelper from '../helpers/string';

/**
 * @module views/budgetsPortion
 * @class BudgetsPortionView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'li',
    className: 'budgets-portion',

    _initialize(options) {
        this.document = options.document;
        this.portions = options.portions;
        this.budget = options.budget;
    },

    async render() {
        const v = this;

        await v.portions.wait();
        v.model = v.portions.getByBudgetId(v.budget.id);
        if (!v.model && !v.budget.id) {
            // seems to be an unsaved budget. wait till it's saved…
            await new Promise(cb => {
                v.listenTo(v.budget, 'change:id', () => {
                    cb();
                });
            });
        }

        if (!v.model && v.portions.syncing) {
            await v.portions.wait();
            v.model = v.portions.getByBudgetId(v.budget.id);
        }
        else if (!v.model) {
            await v.portions.fetch();
            v.model = v.portions.getByBudgetId(v.budget.id);
        }
        v.model.live(v);

        // Budgeted
        const $budgeted = $('<input class="budgets-portion_budgeted" />').appendTo(v.$el);
        v.listenToAndCall(v.model, 'change:budgeted', () => {
            if (!$budgeted.is(':focus')) {
                $budgeted.val(StringHelper.currency(this.document, v.model.get('budgeted') || 0));
            }
        });
        $budgeted.on('keyup change', () => {
            v.model.save({
                budgeted: StringHelper.parseCurrency(this.document, $budgeted.val()) || 0
            });
        });
        $budgeted.on('blur', () => {
            $budgeted.val(StringHelper.currency(this.document, v.model.get('budgeted') || 0));
        });

        const $outflow = $('<span class="budgets-portion_outflow" />').appendTo(v.$el);
        v.listenToAndCall(v.model, 'change:outflow', () => {
            $outflow.text(StringHelper.currency(this.document, v.model.get('outflow') || 0));
        });

        const $balance = $('<span class="budgets-portion_balance" />').appendTo(v.$el);
        const updateBalance = () => {
            const balance = v.model.get('balance') || 0;
            let text = StringHelper.currency(this.document, balance);

            $balance.empty();
            $balance.toggleClass('budgets-portion_balance--negative', balance < 0);
            $balance.toggleClass('budgets-portion_balance--goal', !!v.budget.get('goal'));

            if (v.budget.get('goal')) {
                const p = balance / v.budget.get('goal');
                
                $('<span class="budgets-portion_progress-value" />').text(text).appendTo($balance);

                const $g = $('<span class="budgets-portion_goal" />').attr({
                    title: StringHelper.percentage(p)
                }).appendTo($balance);

                $g.toggleClass('budgets-portion_goal--complete', p >= 1);
                $('<span class="budgets-portion_progress" />').css({
                    width: Math.min(100, p * 100) + '%'
                }).appendTo($g);
            }else{
                text = '= ' + text;
                $balance.text(text);
            }
        };
        v.listenToAndCall(v.model, 'change:balance', updateBalance);
        v.listenToAndCall(v.budget, 'change:goal', updateBalance);
    }
});
