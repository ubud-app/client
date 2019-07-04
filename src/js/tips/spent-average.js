'use strict';

const Tip = require('./tip');
const BudgetedAverageTip = require('./budgeted-average');

/**
 * SpentAverageTip
 *
 * @author Sebastian Pekarek
 */
class BudgetedLastMonthTip extends Tip {

    static id () {
        return 'spentAverage';
    }

    static async prepare (params) {
        return BudgetedAverageTip.prepare(params);
    }

    static process (params, preparations) {
        if(params.budgeted) {
            return params.budgeted;
        }

        const outflows = preparations.portions
            .filter(portion => portion.get('budgetId') === params.budgetId)
            .map(portion => portion.get('outflow'));

        return outflows.reduce((a, b) => a + b, 0) / outflows.length;
    }
}


module.exports = BudgetedLastMonthTip;
