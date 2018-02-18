'use strict';

import BaseView from './_';
import moment from 'moment';
import StringHelper from '../helpers/string';
import $ from 'jquery';

/**
 * @module views/budgetsTips
 * @class BudgetsTipsView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'budgets-tips icon-lightbulb',

    _initialize (options) {
        this.month = options.month;
        this.document = options.document;
        this.portionsThisMonth = options.portions || this.document.getPortionsByMonth(this.month);
        this.portionsLastMonth = null;
    },

    render () {
        const v = this;
        const $wrap = $('<div class="budgets-tips_wrap" />').appendTo(v.$el);

        v.portionsThisMonth.live(v);
        v.portionsLastMonth = this.document.getPortionsByMonth(moment(this.month).subtract(1, 'month')).live(v);

        v.tips = [
            {
                name: 'useBudgetedLastMonth',
                showWhen: v.showUseLastMonthsBudgetedAction,
                action: v.useLastMonthsBudgetedAction
            }
        ];

        // build buttons
        v.tips.forEach(tip => {
            tip.$button = $('<button class="button button--text button--small budgets-tips_action--hidden" />')
                .text(StringHelper.string('budget.tips.actions.' + tip.name))
                .click(e => {
                    e.preventDefault();
                    v.$el.addClass('budgets-tips--block');
                    tip.action();
                    setTimeout(() => {
                        v.$el.removeClass('budgets-tips--block');
                    }, 50);
                })
                .appendTo($wrap);
        });

        // visibility
        v.listenTo(v.portionsThisMonth, 'add', portion => {
            portion.live(v);
            v.listenTo(portion, 'change:budgeted', v.updateVisibility);
            v.updateVisibility();
        });
        v.portionsThisMonth.each(portion => {
            portion.live(v);
            v.listenTo(portion, 'change:budgeted', v.updateVisibility);
        });

        v.listenTo(v.portionsLastMonth, 'add', portion => {
            portion.live(v);
            v.listenTo(portion, 'change:budgeted', v.updateVisibility);
            v.updateVisibility();
        });
        v.portionsLastMonth.each(portion => {
            portion.live(v);
            v.listenTo(portion, 'change:budgeted', v.updateVisibility);
        });

        v.updateVisibility();
    },

    updateVisibility () {
        const v = this;
        let hasTip = false;
        v.tips.forEach(tip => {
            const show = tip.showWhen();
            tip.$button.toggleClass('budgets-tips_action--hidden', !show);

            if(show) {
                hasTip = true;
            }
        });

        v.$el.toggleClass('budgets-tips--hidden', !hasTip);
    },

    showUseLastMonthsBudgetedAction () {
        return this.portionsThisMonth.find(thisMonthsPortion => {
            if(thisMonthsPortion.get('budgeted')) {
                return false;
            }

            return this.portionsLastMonth.find(lastMonthsPortion => {
                return (
                    thisMonthsPortion.get('budgetId') === lastMonthsPortion.get('budgetId') &&
                    lastMonthsPortion.get('budgeted')
                );
            });
        });
    },
    async useLastMonthsBudgetedAction () {
        this.portionsThisMonth.each(thisOne => {
            if(thisOne.get('budgeted') !== null && thisOne.get('budgeted') !== 0) {
                return;
            }

            const lastOne = this.portionsLastMonth.find(lastOne =>
                thisOne.get('budgetId') === lastOne.get('budgetId')
            );
            if(lastOne && lastOne.get('budgeted')) {
                thisOne.save({
                    budgeted: lastOne.get('budgeted')
                });
            }
        });
    }
});
