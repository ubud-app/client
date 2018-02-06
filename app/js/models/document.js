'use strict';

import BaseModel from './_';
import AccountCollection from '../collections/account';
import BudgetCollection from '../collections/budget';
import CategoryCollection from '../collections/category';
import PortionCollection from '../collections/portion';
import SummaryCollection from '../collections/summary';
import PluginInstancesCollection from '../collections/pluginInstance';

/**
 * @module models/document
 * @class DocumentModel
 * @augments BaseModel
 */
export default BaseModel.extend({
    urlRoot: 'documents',

    getAccounts() {
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
    }
});