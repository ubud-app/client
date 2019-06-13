'use strict';

const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');

const BudgetEditorTemplate = require('../../templates/budgetEditor.html');
const CategoryCollection = require('../collections/category');

/**
 * BudgetEditorView
 *
 * @module views/budgetEditor
 * @class BudgetEditorView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
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
            if(this.model.get('goal')) {
                this.data.goal.checkbox.checked = true;
                this.data.goal.input.disabled = false;
            } else {
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

        this.once('remove', this.save);
        return this;
    },
    clickGoalCheckbox (e) {
        if(!this.data.goal.checkbox.checked) {
            e.preventDefault();
            this.$el.find('.budget-editor__goal-input').focus();
        } else {
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
        try {
            await this.model.save();
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    }
});
