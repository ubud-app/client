'use strict';

import {debounce} from 'underscore';

import BaseView from './_';
import BudgetView from './budget';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import tips from '../tips';
import BudgetTipsTemplate from '../../templates/budgetTips.html';


/**
 * BudgetTipsView
 *
 * @module views/budgetTips
 * @class BudgetTipsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const BudgetTipsView = BaseView.extend({
    className: 'budget-tips b-modal b-modal--hidden b-loader b-loader--light',

    _initialize (options) {
        this.month = options.month;
        this.categories = options.categories;
        this.budgets = options.budgets;
        this.portions = options.portions;
        this.document = options.document;

        this.currentTip = null;
        this.currentPreparations = null;
        this.preparations = {};
    },
    render () {
        this.data = {
            month: this.month,
            preview: [],
            rules: [],
            hide: () => this.hide(),
            scroll: debounce(this.onScroll, 10, {leading: false})
        };

        this.live(this.categories);
        this.live(this.budgets);

        this.categories.each(this.addCategory);
        this.listenTo(this.categories, 'add', this.addCategory);
        this.listenTo(this.categories, 'remove', this.removeCategory);
        this.listenTo(this.budgets, 'add', this.addBudget);
        this.listenTo(this.budgets, 'remove', this.removeBudget);

        this.loadRules();

        TemplateHelper.render({
            view: this,
            template: BudgetTipsTemplate,
            data: this.data
        });

        this.activateModal();

        Promise.all([
            this.categories.wait(),
            this.budgets.wait(),
            this.portions.wait()
        ]).then(() => this.onScroll());
    },

    loadRules () {
        this.data.rules = tips.map(Tip => ({
            id: Tip.id(),
            title: ConfigurationHelper.getString(`tips.${Tip.id()}.title`, Tip.title({
                month: this.month.id
            })),
            description: ConfigurationHelper.getString(`tips.${Tip.id()}.description`, Tip.description({
                month: this.month.id
            })),
            active: false,
            click: () => {
                // @todo scroll rule to center position
                this.applyFilter(Tip);
            },
            apply: () => {
                this.applyFilter(Tip);
            }
        }));
    },

    addCategory (category) {
        const entry = {
            id: category.id,
            name: null,
            budgets: []
        };

        this.listenToAndCall(category, 'change:name', () => {
            entry.name = category.get('name');
        });

        this.data.preview.splice(this.categories.indexOf(category), 0, entry);

        this.budgets
            .filter(b => b.get('categoryId') === category.id)
            .forEach(this.addBudget);
    },
    removeCategory (category) {
        const i = this.data.preview.findIndex(e => e.id === category.id);
        if (i > -1) {
            this.data.preview.splice(i, 1);
        }
    },
    addBudget (budget) {
        if (budget.get('hidden')) {
            return;
        }

        const entry = {
            id: budget.id,
            name: budget.get('name'),
            before: 123,
            after: null,
            selected: true,
            change: false,
            balance: {
                before: null,
                value: null,
                goal: budget.get('goal') || null,
                negative: false,
                percent: 0,
                complete: false
            },
            toggle: () => {
                entry.selected = !entry.selected;
                this.calculateChange(entry);
            }
        };

        this.listenTo(budget, 'change:name', () => {
            entry.name = budget.get('name');
        });
        this.listenTo(budget, 'change:goal', () => {
            entry.balance.goal = budget.get('goal') || null;
            this.calculateChange(entry);
        });

        BudgetView.appendBudgetToCategory(this, budget, this.data.preview, entry);

        const portion = this.portions.find(p => p.get('budgetId') === budget.id);
        this.listenToAndCall(portion, 'change:budgeted change:balance', () => {
            entry.before = portion.get('budgeted') || 0;
            entry.balance.before = portion.get('balance');
            this.calculateChange(entry);
        });
    },
    removeBudget (budget) {
        const category = this.data.preview.find(e => e.id === budget.get('categoryId'));
        if (!category) {
            return;
        }

        const i = category.budgets.findIndex(e => e.id === budget.id);
        if (i > -1) {
            category.budgets.splice(i, 1);
        }
    },

    onScroll (e) {
        const target = e && e.target ? e.target : this.$el.find('.budget-tips__rules').get(0);
        const position = target.scrollLeft;
        const width = target.offsetWidth;
        const center = (width / 2) + position;
        const rules = [...target.children];
        const match = rules.findIndex(el =>
            el.offsetLeft <= center && el.offsetLeft + el.offsetWidth >= center
        );

        if (match !== -1 && match !== this.onScroll._lastMatch) {
            this.onScroll._lastMatch = match;

            if (this.data.rules[match]) {
                this.data.rules[match].apply();
            }
        }
    },

    applyFilter (Tip) {
        this.data.rules.forEach(rule => rule.active = rule.id === Tip.id());

        this.$el.addClass('loading');
        this._applyFilter(Tip)
            .catch(error => {
                new ErrorView({error}).appendTo(AppHelper.view());
            })
            .finally(() => this.$el.removeClass('loading'));
    },
    async _applyFilter (Tip) {
        const i = this.data.rules.findIndex(r => r.active);
        if (i < 0) {
            return;
        }

        if (this.preparations[i] === undefined) {
            this.preparations[i] = await Tip.prepare({
                month: this.month.id,
                document: this.document
            }) || {};
        }

        this.currentTip = Tip;
        this.currentPreparations = this.preparations[i];
        this.data.preview.forEach(category => {
            category.budgets.forEach(entry => this.calculateChange(entry));
        });
    },
    calculateChange (entry) {
        if (!this.currentPreparations || !this.currentTip) {
            return;
        }

        const value = this.currentTip.process({
            budgetId: entry.id,
            budgeted: entry.before,
            balance: entry.balance.before,
            goal: entry.balance.goal
        }, this.currentPreparations);

        if (entry.selected) {
            entry.after = value;
        }
        else {
            entry.after = entry.before;
        }

        entry.change = entry.before !== entry.after;
        entry.possible = entry.before !== value;

        entry.balance.value = entry.balance.before - entry.before + entry.after;
        entry.balance.negative = entry.after < 0;
        entry.balance.percent = Math.max(0, entry.balance.value / entry.balance.goal);
        entry.balance.width = Math.min(100, Math.round(entry.balance.percent * 100)) + '%';
        entry.balance.complete = entry.balance.goal && entry.balance.value >= entry.balance.goal;
    },
    submit () {
        this.$el.addClass('loading');

        try {
            this.data.preview.forEach(category => {
                category.budgets.forEach(entry => {
                    if (!entry.change) {
                        return;
                    }

                    const portion = this.portions.find(p => p.get('budgetId') === entry.id);
                    portion.set({
                        budgeted: entry.after
                    });

                    // saving is performed in BudgetView
                });
            });

            this.hide();
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            this.$el.removeClass('loading')
        }
    }
});

export default BudgetTipsView;
