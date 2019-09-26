'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';

import CategoryCollection from '../collections/category';
import BudgetCollection from '../collections/budget';

import CategoryEditorTemplate from '../../templates/categoryEditor.html';


/**
 * CategoryEditorView
 *
 * @module views/categoryEditor
 * @class CategoryEditorView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const CategoryEditorView = BaseView.extend({
    className: 'category-editor b-modal b-modal--hidden',

    _initialize (options = {}) {
        this.allowDelete = options.allowDelete;
        this.deleted = false;
    },

    render () {
        // Document
        this.document = AppHelper.getDocument(true);
        if (!this.document) {
            return;
        }

        this.data = {
            model: this.model,
            delete: {
                showDeleteAndMove: false,
                showDelete: false,
                categoryId: null,
                categories: []
            }
        };

        // Categories
        const categories = new CategoryCollection();
        categories.filterBy('document', this.document.id);
        this.listenTo(categories, 'add', category => {
            if (category.id !== this.model.id) {
                this.pushAt(categories, category, this.data.delete.categories, category);
            }
        });
        this.listenTo(categories, 'remove', category => {
            const i = this.data.delete.categories.indexOf(category);
            if (i > -1) {
                this.data.delete.categories.splice(i, 1);
            }
        });
        this.listenToOnce(categories, 'sync', () => {
            const firstCategoryAllowed = categories.find(c => c.id !== this.model.id);
            if (!this.data.delete.categoryId) {
                this.data.delete.categoryId = firstCategoryAllowed.id;
            }
            if (!firstCategoryAllowed) {
                this.data.delete.showDeleteAndMove = false;
                this.data.delete.showDelete = false;
            }
        });
        if (this.allowDelete) {
            this.live(categories);
        }

        // Budgets
        this.budgets = new BudgetCollection();
        this.budgets.filterBy('category', this.model.id);
        this.listenToAndCall(this.budgets, 'add remove sync', () => {
            this.data.delete.showDeleteAndMove = this.allowDelete && this.budgets.isSynced() && this.budgets.length > 0;
            this.data.delete.showDelete = this.allowDelete && this.budgets.isSynced() && this.budgets.length === 0;
        });
        if (this.allowDelete) {
            this.live(this.budgets);
        }

        TemplateHelper.render({
            view: this,
            template: CategoryEditorTemplate,
            data: this.data
        });

        this.activateModal();

        this.once('remove', this.save);
        return this;
    },

    async submit (e) {
        e.preventDefault();
        await this.save();
        this.hide();
    },

    async save () {
        if (this.deleted) {
            return;
        }

        try {
            await this.model.save();
        }
        catch (error) {
            if (error === 404) {
                this.hide();
                return;
            }

            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    },

    async moveAndDelete () {
        this.data.delete.deleting = true;

        try {
            await Promise.all(this.budgets.map(async budget =>
                budget.save({categoryId: this.data.delete.categoryId})
            ));
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }

        await this.delete();
    },
    async delete () {
        this.data.delete.deleting = true;

        try {
            this.deleted = true;
            await this.model.destroy();
            this.remove();
        }
        catch (error) {
            new ErrorView({error}).appendTo(AppHelper.view());
            throw error;
        }
    }
});

export default CategoryEditorView;
