'use strict';

import BaseTip from './_';
import BudgetedAverageTip from './budgeted-average';


/**
 * SpentAverageTip
 *
 * @author Sebastian Pekarek
 */
export default class SpentAverageTip extends BaseTip {

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
