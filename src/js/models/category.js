'use strict';

const BaseModel = require('./_');

/**
 * @module models/category
 * @class CategoryModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'categories',
    dbStore: 'category'

    /*filterBudgets(budgets, v) {
        const result = new BudgetCollection(
            budgets.filter(budget => budget.get('categoryId') === this.id)
        );

        if (v) {
            budgets.each(budget => {
                v.listenToAndCall(budget, 'change:categoryId', () => {
                    result[budget.get('categoryId') === this.id ? 'add' : 'remove'](budget);
                });
            });
            v.listenTo(budgets, 'add', budget => {
                v.listenToAndCall(budget, 'change:categoryId', () => {
                    result[budget.get('categoryId') === this.id ? 'add' : 'remove'](budget);
                });
            });
            v.listenTo(budgets, 'remove', budget => {
                result.remove(budget);
            });
        }

        return result;
    }*/
});