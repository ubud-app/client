'use strict';

import BaseModel from './_';
import BudgetCollection from '../collections/budget';

/**
 * @module models/category
 * @class CategoryModel
 * @augments BaseModel
 */
export default BaseModel.extend({
    urlRoot: 'categories',

    filterBudgets(budgets, v) {
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
    }
});