'use strict';

import BaseCollection from './_';
import BudgetGuessModel from '../models/budgetGuess';

const BudgetGuessCollection = BaseCollection.extend({
    model: BudgetGuessModel,
    url: 'budget-guesses',
    dbStore: 'budgetGuess'
});

export default BudgetGuessCollection;