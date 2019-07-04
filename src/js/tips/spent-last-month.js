'use strict';

const Tip = require('./tip');
const BudgetedLastMonthTip = require('./budgeted-last-month');

/**
 * SpentLastMonthTip
 *
 * @author Sebastian Pekarek
 */
class SpentLastMonthTip extends Tip {

    static id () {
        return 'spentLastMonth';
    }

    static description (params) {
        return BudgetedLastMonthTip.description(params);
    }

    static async prepare (params) {
        return BudgetedLastMonthTip.prepare(params);
    }

    static process (params, preparations) {
        if(params.budgeted) {
            return params.budgeted;
        }

        const portion = preparations.portions.find(portion => portion.get('budgetId') === params.budgetId);
        return portion ? (portion.get('outflow') || 0) : 0;
    }
}


module.exports = SpentLastMonthTip;
