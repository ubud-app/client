'use strict';

const View = require('./_');
const ErrorView = require('./error');
const BudgetView = require('./budget');

const AppHelper = require('../helpers/app');
const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const CategoryCollection = require('../collections/category');
const BudgetCollection = require('../collections/budget');

const DocumentSettingsGeneralTemplate = require('../../templates/documentSettingsGeneral.html');


/**
 * DocumentSettingsGeneralView
 *
 * @module views/documentSettingsGeneral
 * @class DocumentSettingsGeneralView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-general',

    async render () {
        const AppHelper = require('../helpers/app');
        this.model = AppHelper.getDocument(true);
        if (!this.model) {
            return;
        }

        this.data = {
            document: this.model,
            categories: [],
            meta: {
                showHidden: false,
                deleting: false
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsGeneralTemplate,
            data: this.data
        });

        this.live(this.model);

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsGeneral.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        this.categories = new CategoryCollection();
        this.categories.filterBy('document', this.model.id);

        this.budgets = new BudgetCollection();
        this.budgets.filterBy('document', this.model.id);

        this.once('remove', () => {
            this.save();
        });

        await BudgetView.setupBudgets(this, this.data, this.categories, this.budgets);
        return this;
    },

    async submit (e) {
        e.preventDefault();

        await this.save();
        AppHelper.navigate(this.model.id + '/settings', {trigger: true});
    },

    async save () {
        if(this._deleted) {
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

    toggleHidden () {
        this.data.meta.showHidden = !this.data.meta.showHidden;
    },

    async addCategory () {
        const CategoryModel = require('../models/category');
        const category = new CategoryModel({
            documentId: this.model.id,
            name: ConfigurationHelper.getString('documentSettingsGeneral.budgets.newCategory')
        });

        this.categories.add(category);
        await category.save();

        BudgetView.openCategorySettings(category, true);
    },
    async addBudget () {
        if (this.categories.length === 0) {
            return;
        }

        const BudgetModel = require('../models/budget');
        const budget = new BudgetModel({
            categoryId: this.categories.first().id,
            name: ConfigurationHelper.getString('documentSettingsGeneral.budgets.newBudget')
        });

        this.budgets.add(budget);
        await budget.save();

        BudgetView.openBudgetSettings(budget, true);
    },

    delete () {
        if(!window.confirm(ConfigurationHelper.getString('documentSettingsGeneral.delete.confirm'))) {
            return;
        }

        this.data.meta.deleting = true;
        this._delete()
            .then(() => {
                const documentIdsLeft = DataHelper.getDocuments()
                    .map(document => document.id)
                    .filter(id => id !== this.model.id);

                if (documentIdsLeft.length > 0) {
                    AppHelper.navigate(documentIdsLeft[0] + '/budget', {trigger: true});
                }
                else {
                    AppHelper.navigate('');
                    location.reload();
                }
            })
            .catch(error => {
                this.data.meta.deleting = false;
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    async _delete () {
        this._deleted = 1;
        return this.model.destroy();
    }
});
