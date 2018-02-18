'use strict';

import $ from 'jquery';
import _ from 'underscore';
import BaseView from './_';
import BudgetsStatsView from './budgetsStats';
import BudgetsCategoriesView from './budgetsCategories';
import BudgetsTipsView from './budgetsTips';

/**
 * @module views/budgetsContainer
 * @class BudgetsContainerView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'budgets-container',
    rendered: false,

    _initialize (options) {
        this.document = options.document;
        this.month = options.month;
        this.categories = options.categories;
        this.budgets = options.budgets;
    },

    render () {
        const v = this;
        this.scroll = _.throttle(this._scroll, 10);

        v.$headerWrap = $('<div class="budgets-container-header" />').appendTo(v.$el);
        v.$tipWrap = $('<div class="budgets-container-tip" />').appendTo(v.$el);
        v.$containers = $('.budgets-containers');

        $('<span class="budgets-container_month" />')
            .text(this.month.format('MMMM'))
            .appendTo(v.$headerWrap);

        $('<span class="budgets-container_year" />')
            .text(this.month.format('YYYY'))
            .appendTo(v.$headerWrap);

        let portions, stats, categories;
        const $stats = $('<div class="budgets-container_stats" />').appendTo(v.$headerWrap);
        const $categories = $('<div class="budgets-container_categories loading" />').appendTo(v.$el);


        // Loading Indicator
        let active = false;
        let loading = true;
        Promise.all([v.categories, v.budgets].map(o => o.wait())).then(() => {
            if (active) {
                loading = false;
                $categories.removeClass('loading');
            }
        });


        // Activation / Deactivation
        v.on('active', function (a) {
            if (a && !stats) {
                active = true;
                portions = v.document.getPortionsByMonth(v.month);

                stats = new BudgetsStatsView({
                    document: v.document,
                    month: v.month
                }).appendTo(v, $stats);

                v.tips = new BudgetsTipsView({
                    document: v.document,
                    month: v.month,
                    portions: portions
                }).appendTo(v, $stats);

                categories = new BudgetsCategoriesView({
                    document: v.document,
                    month: v.month,
                    categories: v.categories,
                    budgets: v.budgets,
                    portions: portions
                }).appendTo(v, $categories);

                v.$containers.on('scroll', v.scroll);
                $(document).on('scroll', v.scroll);
                $(window).on('resize', v.scroll);
                v.scroll();

                if (!loading) {
                    $categories.removeClass('loading');
                }
            }
            else if (!a && stats) {
                active = false;
                portions = null;

                stats.remove();
                stats = null;

                categories.remove();
                categories = null;

                v.tips.remove();
                v.tips = null;

                v.$containers.off('scroll', v.scroll);
                $(document).off('scroll', v.scroll);
                $(window).off('resize', v.scroll);
                this.$headerWrap
                    .removeClass('budgets-container-header--fixed')
                    .css({left: null});

                $categories.addClass('loading');
            }
        });


        // Scroll Magic
        v.on('remove', () => {
            v.$containers.off('scroll', v.scroll);
            $(document).off('scroll', v.scroll);
            $(window).off('resize', v.scroll);
        });
    },

    active (value) {
        this.trigger('active', !!value);
    },

    _scroll () {
        const top = $(document).scrollTop();

        this.$headerWrap
            .addClass('budgets-container-header--fixed')
            .css({
                top: Math.max(45, 85 - top),
                left: this.$el.offset().left
            });

        if(this.tips) {
            this.tips.$el.css({
                top: Math.min(0, 43 - top)
            });
        }
    }
});
