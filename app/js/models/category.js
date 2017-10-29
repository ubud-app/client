'use strict';

import BaseModel from './_';
import BudgetCollection from '../collections/budget';

/**
 * @module models/category
 * @class CategoryModel
 * @augments BaseModel
 */
export default class CategoryModel extends BaseModel {
	urlRoot = 'categories';

	filterBudgets (budgets, v) {
		const result = new BudgetCollection(
			budgets.filter(budget => budget.get('categoryId') === this.id)
		);

		if(v) {
			v.listenTo(budgets, 'add', budget => {
				if(budget.get('categoryId') === this.id) {
					result.add(budget);
				}
			});
			v.listenTo(budgets, 'remove', budget => {
				if(budgets.get(budget.id)) {
					budgets.remove(budget);
				}
			});
		}

		return result;
	}
}