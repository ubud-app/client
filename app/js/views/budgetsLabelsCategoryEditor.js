'use strict';

import BaseView from './_';
import BudgetsLabelsCategoryEditorTemplate from '../../templates/budgetsLabelsCategoryEditor.handlebars';
import StringHelper from '../helpers/string';

/**
 * @module views/budgetsLabelsCategoryEditor
 * @class BudgetsLabelsCategoryEditorView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'budgets-labels-category-editor',
    events: {
        'click .budgets-labels-category-editor_save': 'save',
        'click .budgets-labels-category-editor_cancel': 'cancel',
        'click .budgets-labels-category-editor_remove': 'destroy'
    },

    _initialize(options) {
        this.budgets = options.budgets;
    },

    render() {
        const v = this;
        v.$el.html(BudgetsLabelsCategoryEditorTemplate());

        // Name
        const $name = v.$el.find('.budgets-labels-category-editor_name');
        v.listenToAndCall(v.model, 'change:name', () => {
            $name.val(v.model.get('name'));
        });
        $name.on('change', () => {
            v.model.set('name', $name.val());
        });
        if (!v.model.id) {
            $name.focus();
        }

        // Remove
        const $remove = v.$el.find('.budgets-labels-category-editor_remove');
        v.myBudgets = v.model.filterBudgets(v.budgets, v);
        v.listenToAndCall(v.myBudgets, 'add remove sync', () => {
            $remove.prop('disabled', !!v.myBudgets.length);

            let title;
            if (v.myBudgets.length === 1) {
                title = StringHelper.string('budget.labels.editCategory.remove.hasBudgets.one', {count: v.myBudgets.length});
            }
            else if (v.myBudgets.length > 1) {
                title = StringHelper.string('budget.labels.editCategory.remove.hasBudgets.other', {count: v.myBudgets.length});
            }
            $remove.attr({title});
        });
    },
    save() {
        const v = this;
        v.remove();
        v.model.save();
        v.model.collection.sort();
    },
    cancel() {
        const v = this;
        if (!v.model.id) {
            v.remove();
            v.model.collection.remove(v.model);
            return;
        }

        v.model.set(v.model.previousAttributes());
        v.model.fetch();
        v.remove();
    },
    destroy() {
        const v = this;
        if (!v.model.id) {
            v.remove();
            v.model.collection.remove(v.model);
            return;
        }

        if (v.myBudgets.length > 0) {
            return;
        }

        v.model.destroy();
        v.remove();
    },
});
