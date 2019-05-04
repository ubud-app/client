'use strict';

const $ = require('zepto');
const {debounce} = require('underscore');
const {DateTime} = require('luxon');

const View = require('./_');
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
module.exports = View.extend({
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
        this.document = DataHelper.getDocuments().get(AppHelper.getDocumentId());
        this.live(this.document);
        this.listenToAndCall(this.document, 'change:name', () => {
            AppHelper.title(this.document.get('name'));
        });

        // Categories
        this.categories = new CategoryCollection();
        this.categories.filterBy('document', this.document.id);
        this.live(this.categories);

        // Budgets
        this.budgets = new BudgetCollection();
        this.budgets.filterBy('document', this.document.id);
        this.budgets.filterBy('hidden', false);
        this.live(this.budgets);

        await Promise.all([
            this.categories.wait(),
            this.budgets.wait()
        ]);

        this.categories.each(this.addCategory);
        this.listenTo(this.categories, 'add', this.addCategory);
        this.listenTo(this.categories, 'remove', this.removeCategory);
        this.listenTo(this.budgets, 'add', this.addBudget);
        this.listenTo(this.budgets, 'remove', this.removeBudget);

        return this;
    },

    addMonth (month, after = false) {
        this.data.months[after ? 'push' : 'unshift']({
            id: month.toISODate().substr(0, 7),
            current: month.hasSame(DateTime.local(), 'month'),
            activated: false,
            availableNegative: false,
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

    addCategory (category) {
        const entry = {
            id: category.id,
            name: null,
            settings: () => {
                this.openCategorySettings(category);
            },
            budgets: []
        };

        this.listenToAndCall(category, 'change:name', () => {
            entry.name = category.get('name');
        });

        this.data.categories.splice(this.categories.indexOf(category), 0, entry);

        this.budgets
            .filter(b => b.get('categoryId') === category.id)
            .forEach(b => this.addBudget(b));
    },
    removeCategory (category) {
        const i = this.data.categories.findIndex(e => e.id === category.id);
        if (i > -1) {
            this.data.categories.splice(i, 1);
        }
    },

    addBudget (budget) {
        const categoryEntry = this.data.categories.find(e => e.id === budget.get('categoryId'));
        if (!categoryEntry) {
            return;
        }

        const entry = {
            id: budget.id,
            name: null,
            settings: () => {
                this.openBudgetSettings(budget);
            }
        };

        this.listenToAndCall(budget, 'change:name', () => {
            entry.name = budget.get('name');
        });

        const sort = categoryEntry.budgets.sort((a, b) => String(a.name).localeCompare(
            b.name,
            ConfigurationHelper.getCurrentLanguage(),
            {sensitivity: 'base'}
        ));

        categoryEntry.budgets.splice(sort.indexOf(budget.get('name')), 0, entry);
    },
    removeBudget (budget) {
        const categoryEntry = this.data.categories.find(e => e.id === budget.get('categoryId'));
        if (!categoryEntry) {
            return;
        }

        const i = categoryEntry.budgets.findIndex(e => e.id === budget.id);
        if (i > -1) {
            categoryEntry.budgets.splice(i, 1);
        }
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

        const update = debounce(() => this.updateMonthBody(month, portions), 25);
        this.updateMonthBody(month, portions);

        await portions.wait();
        month.deactivate.push(this.live(portions));

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
                                left: Math.max(0, budgetModel.get('goal') - portionModel.get('balance'))
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

    openCategorySettings (category) {
        alert('Category: ' + category.get('name'));
    },
    openBudgetSettings (category) {
        alert('Budget: ' + category.get('name'));
    }
});
