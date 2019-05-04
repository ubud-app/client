'use strict';

const BaseModel = require('./_');

/**
 * @module models/document
 * @class DocumentModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'documents',
    dbStore: 'document',

    /*getAccounts() {
        const accounts = new AccountCollection();
        accounts.id = 'document:' + this.id;
        accounts.addFilter = account => account.get('documentId') === this.id;
        return accounts;
    },

    getBudgets() {
        const budgets = new BudgetCollection();
        budgets.id = 'document:' + this.id;
        budgets.addFilter = budget => budget.get('documentId') === this.id;
        return budgets;
    },

    getCategories() {
        const categories = new CategoryCollection();
        categories.id = 'document:' + this.id;
        categories.addFilter = category => category.get('documentId') === this.id;
        return categories;
    },

    getPortionsByMonth(month) {
        const monthStr = month.format('YYYY-MM');
        const portions = new PortionCollection();
        portions.id = 'document:' + this.id + '/month:' + monthStr;
        portions.addFilter = portion => portion.get('documentId') === this.id && portion.get('month') === monthStr;
        return portions;
    },

    getSummaryByMonth(month) {
        const monthStr = month.format('YYYY-MM');
        const summaries = new SummaryCollection();
        summaries.id = 'document:' + this.id + '/month:' + monthStr;
        summaries.addFilter = summary => summary.get('documentId') === this.id && summary.get('month') === monthStr;
        return summaries;
    },

    getPluginInstances() {
        const plugins = new PluginInstancesCollection();
        plugins.id = 'document:' + this.id;
        plugins.addFilter = plugin => plugin.get('documentId') === this.id;
        return plugins;
    }*/
});