'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';

import BudgetEditorTemplate from '../../templates/budgetEditor.html';
import CategoryCollection from '../collections/category';


/**
 * BudgetEditorView
 *
 * @module views/budgetEditor
 * @class BudgetEditorView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const BudgetEditorView = BaseView.extend({
    className: 'budget-editor b-modal b-modal--hidden',

    render () {
        // Document
        this.document = AppHelper.getDocument(true);
        if (!this.document) {
            return;
        }

        // Categories
        const categories = new CategoryCollection();
        categories.filterBy('document', this.document.id);
        this.live(categories);

        this.data = {
            model: this.model,
            categories,

            goal: {
                checkbox: {
                    checked: null
                },
                input: {
                    disabled: null
                }
            }
        };

        this.listenToAndCall(this.model, 'change:goal', () => {
            if (this.model.get('goal')) {
                this.data.goal.checkbox.checked = true;
                this.data.goal.input.disabled = false;
            }
            else {
                this.data.goal.checkbox.checked = false;
                this.data.goal.input.disabled = true;
            }
        });

        TemplateHelper.render({
            view: this,
            template: BudgetEditorTemplate,
            data: this.data
        });

        this.activateModal();
        this.$el.find('.b-form-input').focus();

        this.once('remove', this.save);
        return this;
    },
    clickGoalCheckbox (e) {
        if (!this.data.goal.checkbox.checked) {
            e.preventDefault();
            this.$el.find('.budget-editor__goal-input').focus();
        }
        else {
            this.model.set({goal: null});
        }
    },
    toggleHidden () {
        this.model.set({
            hidden: !this.model.get('hidden')
        });
    },

    async submit (e) {
        e.preventDefault();

        try {
            await this.save();
        }
        finally {
            this.$el.addClass('loading');
        }

        this.hide();
    },

    async save () {
        if (this._deleted) {
            return;
        }

        try {
            await this.model.save();
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    },

    async delete () {
        if (!this.model.get('deletable')) {
            return;
        }

        try {
            await this.model.destroy();
            this._deleted = true;
            this.hide();
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    }
});

export default BudgetEditorView;
