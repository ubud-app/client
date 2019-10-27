'use strict';

import BaseModel from './_';


/**
 * @module models/budgetGuess
 * @class BudgetGuessModel
 * @augments BaseModel
 */
const BudgetGuessModel = BaseModel.extend({
    urlRoot: 'budget-guesses',
    dbStore: 'budgetGuess'
});

export default BudgetGuessModel;
