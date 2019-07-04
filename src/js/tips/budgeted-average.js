'use strict';

const Tip = require('./tip');
const {DateTime} = require('luxon');
const PortionCollection = require('../collections/portion');

/**
 * BudgetedAverageTip
 *
 * @author Sebastian Pekarek
 */
class BudgetedLastMonthTip extends Tip {

    static id () {
        return 'budgetedAverage';
    }

    static async prepare (params) {
        const month = DateTime.fromISO(params.month).startOf('month')
            .minus({months: 1});

        const portions = [];
        for(let i = 1; i <= 12; i += 1) {
            const collection = await this.fetchPortions(month, params.document.id, i);
            collection.each(portion => portions.push(portion));
        }

        return { portions };
    }
    static async fetchPortions (now, documentId, i) {
        const month = now.minus({months: i});

        const portions = new PortionCollection();
        portions.resetFilters();
        portions.filterBy('document', documentId);
        portions.filterBy('month', month.toISODate().substr(0, 7));
        portions.filterBy('hidden', false);

        await portions.fetch();
        return portions;
    }

    static process (params, preparations) {
        if(params.budgeted) {
            return params.budgeted;
        }

        const budgeted = preparations.portions
            .filter(portion => portion.get('budgetId') === params.budgetId)
            .map(portion => portion.get('budgeted'));

        const firstFilled = budgeted.findIndex(budgeted => budgeted > 0);
        let count = budgeted.length;
        if(firstFilled >= 0) {
            count = budgeted.length - firstFilled
        }

        return budgeted.reduce((a, b) => a + b, 0) / count;
    }
}


module.exports = BudgetedLastMonthTip;
