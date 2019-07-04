'use strict';

const $ = require('zepto');
const {debounce} = require('underscore');
const {DateTime} = require('luxon');

const View = require('./_');
const CategoryEditorView = require('./categoryEditor');
const BudgetEditorView = require('./budgetEditor');

const AppHelper = require('../helpers/app');
const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const BudgetTemplate = require('../../templates/budget.html');

const CategoryCollection = require('../collections/category');
const BudgetCollection = require('../collections/budget');
const SummaryCollection = require('../collections/summary');
const PortionCollection = require('../collections/portion');


/**
 * BudgetView
 *
 * @module views/budget
 * @class BudgetView
 * @augments View
 * @author Sebastian Pekarek
 */
const BudgetView = View.extend({
    className: 'budget',

    async render () {
        this.data = {
            categories: [
                /*{
                    name: '',
                    settings: () => {},
                    budgets: [
                        {
                            name: '',
                            settings: () => {}
                        }
                    ]
                }*/
            ],
            months: [
                /*{
                    id: '2019-04',
                    current: true,
                    highlightTip: false,
                    month: 'April',
                    year: '2019'
                }*/
            ],
            meta: {
                locked: true
            }
        };

        this.listenToAndCall(DataHelper, 'socket:state', () => {
            this.data.meta.locked = DataHelper.state() !== 'ready';
        });

        this._onScroll = debounce(this.onScroll, 50);
        this.initializeMonths();
        TemplateHelper.render({
            view: this,
            template: BudgetTemplate,
            data: this.data
        });
        this.initializeScrollPosition();


        // Document
        this.document = AppHelper.getDocument(true);
        if (!this.document) {
            return;
        }

        this.live(this.document);
        this.listenToAndCall(this.document, 'change:name', () => {
            AppHelper.title(this.document.get('name'));
        });

        // Categories
        this.categories = new CategoryCollection();
        this.categories.filterBy('document', this.document.id);

        // Budgets
        this.budgets = new BudgetCollection();
        this.budgets.filterBy('document', this.document.id);
        this.budgets.filterBy('hidden', false);

        await BudgetView.setupBudgets(this, this.data, this.categories, this.budgets);
        return this;
    },

    addMonth (month, after = false) {
        this.data.months[after ? 'push' : 'unshift']({
            id: month.toISODate().substr(0, 7),
            current: month.hasSame(DateTime.local(), 'month'),
            activated: false,
            rendered: false,
            availableNegative: false,
            highlightTip: false,
            month: month.toFormat('LLLL'),
            year: month.toFormat('yyyy'),
            statsPage: [true, false, false],
            categories: []
        });
    },
    initializeMonths () {
        const now = DateTime.local();

        const start = now
            .startOf('month')
            .minus({months: Math.ceil(window.innerWidth / 300)});

        const end = now
            .endOf('month')
            .plus({months: Math.ceil(window.innerWidth / 300)});

        let i = start;
        do {
            this.addMonth(i, true);
            i = i.plus({months: 1});
        } while (i < end);

        this.months = [start, end];
    },
    initializeScrollPosition () {
        const $container = this.$el.find('.budget__container');
        const $current = this.$el.find('.budget__month--current');
        const $labels = this.$el.find('.budget__labels');

        const monthWidth = $current.width();
        const items = Math.round($container.width() / monthWidth);
        const padding = Math.max(Math.floor((items - 1) / 2), 0);
        const left = $current.position().left - $labels.width() - (padding * monthWidth);

        this.$el.find('.budget__container').scrollLeft(left);
    },

    onScroll () {
        if (!this.months) {
            return;
        }

        const $container = this.$el.find('.budget__container');
        const labelWidth = this.$el.find('.budget__labels').width();
        const monthWidth = this.$el.find('.budget__month').width();
        let position = $container.scrollLeft();

        // add months before
        if (position < 5 * monthWidth) {
            this.months[0] = this.months[0].minus({months: 1});
            this.addMonth(this.months[0]);

            position += monthWidth;

            $container.css('-webkit-overflow-scrolling', 'auto');
            $container.scrollLeft(position);
            $container.css('-webkit-overflow-scrolling', 'touch');
        }

        let currentMonth;

        this.$el.find('.budget__month').forEach(month => {
            const $month = $(month);
            const monthPosition = $($month).position().left - labelWidth;
            const data = this.data.months.find(m => m.id === $month.data('id'));

            const sidebarWidth = $('.sidebar').width();
            const activated = monthPosition > 0 - (monthWidth * 0.5) &&
                monthPosition < window.innerWidth - labelWidth - (
                    sidebarWidth === window.innerWidth ? 0 : sidebarWidth
                ) - 100;

            if (activated && !data.activated) {
                this.activateMonth(data);
            }
            if (!activated && data.activated) {
                this.deactivateMonth(data);
            }

            const isCurrentMonth = !currentMonth && activated && monthPosition > 0 - (monthWidth * 0.5);
            if (isCurrentMonth) {
                currentMonth = true;
                AppHelper.view().setTitle(data.month + ' ' + data.year);
            }
        });

        this.onScroll.done = true;
    },

    async activateMonth (month) {
        month.activated = true;
        month.deactivate = month.deactivate || [];

        const summaries = new SummaryCollection();
        summaries.resetFilters();
        summaries.filterBy('document', this.document.id);
        summaries.filterBy('month', month.id);
        month.deactivate.push(this.live(summaries));

        month.summary = null;
        month.availableNegative = false;
        this.listenToAndCall(summaries, 'add remove', () => {
            if (summaries.length) {
                month.summary = summaries.first();
                month.deactivate.push(this.live(month.summary));

                this.listenToAndCall(month.summary, 'change:available', () => {
                    month.availableNegative = summaries.first().get('available') < 0;
                });
            }
        });

        month.statsClick = () => {
            // month.statsPage.unshift(month.statsPage.pop());

            const i = month.statsPage.indexOf(true);
            month.statsPage[0] = i === 2;
            month.statsPage[1] = i === 0;
            month.statsPage[2] = i === 1;
        };

        const portions = new PortionCollection();
        portions.resetFilters();
        portions.filterBy('document', this.document.id);
        portions.filterBy('month', month.id);
        portions.filterBy('hidden', false);

        month.openAutoFill = () => {
            this.openAutoFill(month, portions);
        };

        const update = debounce(() => this.updateMonthBody(month, portions), 25);
        if (!month.rendered) {
            month.rendered = true;
            this.updateMonthBody(month, portions);
        }

        await portions.wait();
        month.deactivate.push(this.live(portions));

        this.on('budgetsUpdated', () => update());
        this.listenTo(this.categories, 'add remove', () => update());
        this.listenTo(this.budgets, 'add remove', () => update());
        this.listenTo(portions, 'add remove', () => update());
        month.deactivate.push(() => {
            this.stopListening(this.categories, 'add remove', () => update);
            this.stopListening(this.budgets, 'add remove', () => update);
            this.stopListening(portions, 'add remove', () => update);

            month.categories.length = 0;
        });

        update();
    },
    updateMonthBody (month, portions) {
        this.trigger('updateMonthBody:' + month.id);
        month.categories.length = 0; // reset array

        this.data.categories.forEach(categoryData => {
            const category = {
                portions: []
            };

            categoryData.budgets.forEach(budget => {
                const budgetModel = this.budgets.get(budget.id);
                const portionModel = portions.length && portions.find(p => p.get('budgetId') === budget.id);
                const portion = {
                    model: portionModel || null,
                    negative: null,
                    goal: null,
                    active: [true, false, false],
                    toggleGoal: () => {
                        if (!portion.goal) {
                            portion.active[0] = true;
                            portion.active[1] = false;
                            portion.active[2] = false;
                            return;
                        }

                        const i = portion.active.indexOf(true);
                        portion.active[0] = i === 2;
                        portion.active[1] = i === 0;
                        portion.active[2] = i === 1;
                    }
                };

                if (portionModel) {
                    const updateGoal = () => {
                        portion.negative = portionModel.get('balance') < 0;

                        if (budgetModel.get('goal')) {
                            portion.goal = {
                                width: Math.min(
                                    100,
                                    Math.round(portionModel.get('balance') / budgetModel.get('goal') * 100)
                                ) + '%',
                                percent: portionModel.get('balance') / budgetModel.get('goal'),
                                complete: portionModel.get('balance') >= budgetModel.get('goal'),
                                left: TemplateHelper.formatCurrency(
                                    Math.max(0, budgetModel.get('goal') - portionModel.get('balance'))
                                )
                            };
                        }
                        else {
                            portion.goal = null;
                            portion.toggleGoal();
                        }
                    };
                    const updateBudgetedRemote = debounce(() => {
                        portionModel.save().catch(error => {
                            const ErrorView = require('./error');
                            new ErrorView({error}).appendTo(AppHelper.view());
                        });
                    }, 1000);

                    this.listenTo(portionModel, 'change:budgeted', () => {
                        const change = portionModel.get('budgeted') - portionModel.previous('budgeted');
                        portionModel.set({
                            balance: portionModel.get('balance') + change
                        });

                        if (month.summary) {
                            month.summary.set({
                                available: month.summary.get('available') - change
                            });
                        }

                        updateBudgetedRemote();
                    });

                    this.listenTo(budgetModel, 'change:goal', updateGoal);
                    this.listenToAndCall(portionModel, 'change:balance', updateGoal);

                    this.once('updateMonthBody:' + month.id, () => {
                        this.stopListening(portionModel, 'change:budgeted');
                        this.stopListening(budgetModel, 'change:goal', updateGoal);
                        this.stopListening(portionModel, 'change:balance', updateGoal);
                    });
                }

                category.portions.push(portion);
            });


            month.categories.push(category);
        });
    },
    deactivateMonth (month) {
        if (month.deactivate) {
            month.deactivate.forEach(f => f());
            delete month.deactivate;
        }
        month.activated = false;
    },
    openAutoFill (month, portions) {
        const BudgetTipsView = require('./budgetTips');
        const budgetTipsView = new BudgetTipsView({
            month: month,
            categories: this.categories,
            budgets: this.budgets,
            portions,
            document: this.document
        });

        budgetTipsView.appendTo(this, AppHelper.view());
    }
}, {
    async setupBudgets (view, data, categories, budgets) {
        await Promise.all([
            categories.wait(),
            budgets.wait()
        ]);

        view.live(categories);
        view.live(budgets);

        categories.each(category => this.addCategory(view, data, category));
        view.listenTo(categories, 'add', category => this.addCategory(view, data, category));
        view.listenTo(categories, 'remove', category => this.removeCategory(data, category));
        view.listenTo(budgets, 'add', budget => this.addBudget(view, data, budget));
        view.listenTo(budgets, 'remove', budget => this.removeBudget(data, budget));
    },
    addCategory (view, data, category) {
        const entry = {
            id: category.id,
            name: null,
            settings: () => this.openCategorySettings(view, category, !(view instanceof BudgetView)),
            mobileSettings: () => {
                if (window.innerWidth <= 920) {
                    entry.settings();
                }
            },
            budgets: []
        };

        view.listenToAndCall(category, 'change:name', () => {
            entry.name = category.get('name');
        });

        data.categories.splice(view.categories.indexOf(category), 0, entry);

        view.budgets
            .filter(b => b.get('categoryId') === category.id)
            .forEach(b => this.addBudget(view, data, b));
    },
    removeCategory (data, category) {
        const i = data.categories.findIndex(e => e.id === category.id);
        if (i > -1) {
            data.categories.splice(i, 1);
        }
    },
    addBudget (view, data, budget) {
        const entry = {
            id: budget.id,
            name: null,
            hidden: null,
            settings: () => this.openBudgetSettings(view, budget),
            mobileSettings: () => {
                if (window.innerWidth <= 920) {
                    entry.settings();
                }
            }
        };

        view.listenToAndCall(budget, 'change:name', () => {
            entry.name = budget.get('name');
        });
        view.listenToAndCall(budget, 'change:hidden', () => {
            entry.hidden = budget.get('hidden');
        });

        this.appendBudgetToCategory(view, budget, data.categories, entry);
    },
    appendBudgetToCategory (view, budget, data, entry) {
        const append = force => {
            if (!force && budget.previous('categoryId') === budget.get('categoryId')) {
                return;
            }

            Object.values(data).forEach(categoryEntry => {
                if (categoryEntry.budgets) {
                    const i = categoryEntry.budgets.findIndex(e => e.id === budget.id);
                    if (i > -1) {
                        categoryEntry.budgets.splice(i, 1);
                    }
                }
            });

            const newCategoryEntry = data.find(e => e.id === budget.get('categoryId'));
            const sort = newCategoryEntry.budgets
                .map(b => b.name)
                .concat([budget.get('name')])
                .sort((a, b) =>
                    String(a).localeCompare(b, ConfigurationHelper.getCurrentLanguage(), {sensitivity: 'base'})
                );

            newCategoryEntry.budgets.splice(sort.indexOf(budget.get('name')), 0, entry);

            if (budget.previous('categoryId')) {
                view.trigger('budgetsUpdated');
            }
        };

        view.listenTo(budget, 'change:categoryId', () => {
            append();
        });

        append(true);
    },
    removeBudget (data, budget) {
        const categoryEntry = data.categories.find(e => e.id === budget.get('categoryId'));
        if (!categoryEntry) {
            return;
        }

        const i = categoryEntry.budgets.findIndex(e => e.id === budget.id);
        if (i > -1) {
            categoryEntry.budgets.splice(i, 1);
        }
    },
    openCategorySettings (view, category, allowDelete) {
        new CategoryEditorView({
            model: category,
            allowDelete
        }).appendTo(view, AppHelper.view());
    },
    openBudgetSettings (view, budget) {
        new BudgetEditorView({
            model: budget
        }).appendTo(view, AppHelper.view());
    }
});

module.exports = BudgetView;
