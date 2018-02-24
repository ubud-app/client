'use strict';

import BaseView from './_';
import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import DocumentModel from '../models/document';
import DashboardItemView from './dashboardItem';
import DashboardTemplate from '../../templates/dashboard.handlebars';
import StringHelper from '../helpers/string';

/**
 * @module views/dashboard
 * @class DashboardView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'dashboard app_layout--page',
    events: {
        'click .dashboard_add': 'addDocument'
    },

    $ul: null,

    render() {
        AppHelper.title('dashboard.title');
        this.$el.html(DashboardTemplate());
        this.$ul = this.$('.dashboard_list');

        this.collection = DataHelper.getDocuments().live(this);
        this.listenTo(this.collection, 'add', this.addDocument);
        this.listenToAndCall(this.collection, 'add remove reset', this.showOrHideEmptyMessage);
        this.collection.each(this.addDocument);
    },

    showOrHideEmptyMessage() {
        this.$('.dashboard_list-empty').toggleClass('dashboard_list-empty--hidden', this.collection.length > 0);
    },

    addDocument(document) {
        if (!document || !(document instanceof DocumentModel)) {
            document = new DocumentModel({
                settings: {
                    language: StringHelper.string('firstSetup.newDocument.language')
                }
            });
            this.collection.add(document);
            return;
        }

        const view = new DashboardItemView({model: document}).appendTo(this, this.$ul);
        this.listenTo(this.collection, 'remove', removed => {
            if (removed.id === document.id) {
                view.remove();
            }
        });
    }
});
