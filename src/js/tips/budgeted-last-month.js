'use strict';

import BaseTip from './_';
import {DateTime} from 'luxon';
import PortionCollection from '../collections/portion';


/**
 * BudgetedLastMonthTip
 *
 * @author Sebastian Pekarek
 */
export default class BudgetedLastMonthTip extends BaseTip {

    static id () {
        return 'budgetedLastMonth';
    }

    static description(params) {
        const month = DateTime.fromISO(params.month)
            .startOf('month')
            .minus({months: 1});

        let string = month.toFormat('LLLL');
        if(!month.hasSame(DateTime.local(), 'year')) {
            string += ' ' + month.toFormat('yyyy');
        }

        return {month: string};
    }

    static async prepare (params) {
        const month = DateTime.fromISO(params.month)
            .startOf('month')
            .minus({months: 1});

        const portions = new PortionCollection();
        portions.resetFilters();
        portions.filterBy('document', params.document.id);
        portions.filterBy('month', month.toISODate().substr(0, 7));
        portions.filterBy('hidden', false);

        await portions.fetch();
        return { portions };
    }

    static process (params, preparations) {
        if(params.budgeted) {
            return params.budgeted;
        }

        const portion = preparations.portions.find(portion => portion.get('budgetId') === params.budgetId);
        return portion ? (portion.get('budgeted') || 0) : 0;
    }
}
