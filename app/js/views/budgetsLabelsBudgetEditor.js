'use strict';

import $ from 'jquery';
import BaseView from './_';
import BudgetsLabelsBudgetEditorTemplate from '../../templates/budgetsLabelsBudgetEditor.handlebars';
import StringHelper from '../helpers/string';

/**
 * @module views/budgetsLabelsBudgetEditor
 * @class BudgetsLabelsBudgetEditorView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'budgets-labels-budget-editor',
    events: {
        'click .budgets-labels-budget-editor_save': 'save',
        'click .budgets-labels-budget-editor_cancel': 'cancel',
        'click .budgets-labels-budget-editor_hide': 'hide'
    },

    _initialize(options) {
        this.document = options.document;
        this.categories = options.categories;
    },

    render() {
        const v = this;
        v.$el.html(BudgetsLabelsBudgetEditorTemplate());

        // Name
        const $name = v.$el.find('.budgets-labels-budget-editor_name');
        v.listenToAndCall(v.model, 'change:name', () => {
            $name.val(v.model.get('name'));
        });
        $name.on('change', () => {
            v.model.set('name', $name.val());
        });
        if (!v.model.id) {
            $name.focus();
        }

        // Category
        v.$category = v.$el.find('.budgets-labels-budget-editor_category');
        v.listenTo(v.categories, 'add', v.addCategory);
        v.categories.each(v.addCategory);
        v.listenToAndCall(v.model, 'change:categoryId', () => {
            v.$category.val(v.model.get('categoryId'));
        });
        v.model.set('categoryId', v.$category.val());

        // Goal
        const $goal = v.$el.find('.budgets-labels-budget-editor_goal');
        v.listenToAndCall(v.model, 'change:goal', () => {
            $goal.val(StringHelper.currency(this.document, v.model.get('goal') || 0));
        });
        $goal.on('change', () => {
            v.model.set('goal', StringHelper.parseCurrency(this.document, $goal.val()));
        });

        // Hide
        const $hide = v.$el.find('.budgets-labels-budget-editor_hide');
        v.listenToAndCall(v.model, 'change:id', () => {
            $hide.toggleClass('budgets-labels-budget-editor_hide--hidden', !v.model.id);
        });
    },
    addCategory(category) {
        const v = this;
        const $option = $('<option />').attr('value', category.id).appendTo(v.$category);

        v.listenToAndCall(category, 'change:name', () => {
            $option.text(category.get('name'));
        });
        v.listenTo(category, 'destroy', () => {
            $option.remove();
        });
    },
    save() {
        const v = this;
        v.remove();
        v.model.save({
            categoryId: v.$category.val()
        });
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
    hide() {
        const v = this;
        if (!v.model.id) {
            return;
        }

        v.remove();
        v.model.collection.remove(v.model);
        v.model.save({
            hidden: true
        });
    }
});
