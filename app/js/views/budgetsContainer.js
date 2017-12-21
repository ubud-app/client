'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetsStatsView from './budgetsStats';
import BudgetsCategoriesView from './budgetsCategories';

/**
 * @module views/budgetsContainer
 * @class BudgetsContainerView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'budgets-container',
    rendered: false,

    _initialize(options) {
        this.document = options.document;
        this.month = options.month;
        this.categories = options.categories;
        this.budgets = options.budgets;
    },

    render() {
        const v = this;

        $('<span class="budgets-container_month" />')
            .text(this.month.format('MMMM'))
            .appendTo(v.$el);

        $('<span class="budgets-container_year" />')
            .text(this.month.format('YYYY'))
            .appendTo(v.$el);

        let stats, categories;
        const $stats = $('<div class="budgets-container_stats" />').appendTo(v.$el);
        const $categories = $('<div class="budgets-container_categories loading" />').appendTo(v.$el);

        let todo = 0;
        let active = false;
        const check = async function(o) {
            todo++;
            await o.wait();
            todo--;
            if(todo <= 0 && active) {
                $categories.removeClass('loading');
            }
        };

        check(v.categories);
        check(v.budgets);

        v.on('active', function (a) {
            if (a && !stats) {
                active = true;

                stats = new BudgetsStatsView({
                    document: v.document,
                    month: v.month
                }).appendTo(v, $stats);

                categories = new BudgetsCategoriesView({
                    document: v.document,
                    month: v.month,
                    categories: v.categories,
                    budgets: v.budgets
                }).appendTo(v, $categories);

                if(todo <= 0) {
                    $categories.removeClass('loading');
                }
            }
            else if (!a && stats) {
                active = false;

                stats.remove();
                stats = null;

                categories.remove();
                categories = null;

                $categories.addClass('loading');
            }
        });
    },

    active(value) {
        this.trigger('active', !!value);
    }
});
