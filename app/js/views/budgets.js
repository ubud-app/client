'use strict';

import moment from 'moment';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import BudgetsLabelsView from './budgetsLabels';
import BudgetsContainersView from './budgetsContainers';

/**
 * @module views/budgets
 * @class BudgetsView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'budgets',

    _initialize(options) {
        this.documentId = options.documentId;
        this.currentMonth = options.month ? moment(options.month, 'YYYY-MM') : moment();
        this.currentMonth = this.currentMonth.startOf('month');
        this.currentPosition = 0;
    },
    async render() {
        AppHelper.title('budget.title');

        const documents = await DataHelper.getDocuments().wait();
        const document = documents.get(this.documentId);
        if (!document) {
            AppHelper.navigate('/', {trigger: true, replace: true});
            return;
        }

        const categories = document.getCategories().live(this);
        const budgets = document.getBudgets().live(this);

        // new BudgetsTimePicker().appendTo(v);

        new BudgetsLabelsView({
            document,
            categories,
            budgets,
            parent: this
        }).appendTo(this);

        new BudgetsContainersView({
            document,
            categories,
            budgets,
            parent: this
        }).appendTo(this);
    },

    getPosition() {
        return {month: this.currentMonth, position: this.currentPosition};
    }
});
