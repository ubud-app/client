'use strict';

const {debounce} = require('underscore');
const View = require('./_');
const ErrorView = require('./error');

const AppHelper = require('../helpers/app');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const PluginCollection = require('../collections/plugin');
const DocumentSettingsAccountAddSearchTemplate = require('../../templates/documentSettingsPluginAdd.html');


/**
 * DocumentSettingsPluginAdd
 *
 * @module views/documentSettingsPluginAdd
 * @class DocumentSettingPluginAddView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-plugin-add b-form',

    _initialize (options) {
        this.q = options.q;
        this.type = options.type || 'default';
        this.prefix = options.type === 'account' ? '/settings/accounts/add/current' : '/settings/plugins/add';
    },

    async render () {
        this.model = this.model || AppHelper.getDocument(true);
        if (!this.model) {
            return;
        }

        this.plugins = new PluginCollection();

        this.data = {
            document: this.model,
            plugins: this.plugins,
            prefix: 'documentSettingsPluginAdd.' + this.type,
            meta: {
                q: this.q || '',
                hideAnimation: true,
                runAnimation: false,
                empty: false,
                list: false,
                results: []
            }
        };

        TemplateHelper.render({
            view: this,
            template: DocumentSettingsAccountAddSearchTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsAccountAdd.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
        });

        this.scheduleSearch = debounce(() => this.search(), 100);
        this.listenTo(this.plugins, 'add', this.addPlugin);
        this.listenTo(this.plugins, 'remove', this.removePlugin);

        this.$el.find('#document-settings-plugin-add__input--q').focus();
        if (this.data.meta.q.length > 2) {
            this.search();
        }

        return this;
    },

    goBack () {
        AppHelper.back(this.model.id + '/settings');
    },

    createManual () {
        const AccountModel = require('../models/account');
        const DocumentSettingsAccountAddManualView = require('./documentSettingsAccountAddManual');
        const model = new AccountModel({
            documentId: this.model.id,
            name: this.data.meta.q,
            type: 'checking'
        });

        AppHelper.navigate(this.model.id + '/settings/accounts/add/other');
        AppHelper.view().renderView(new DocumentSettingsAccountAddManualView({model}));
    },

    keyup () {
        const q = String(this.data.meta.q);

        if (q.length > 2) {
            this.scheduleSearch();
            this.data.meta.hideAnimation = false;
            AppHelper.navigate(this.model.id + this.prefix + '?q=' + encodeURIComponent(q), {
                replace: true
            });
        }
        else {
            this.plugins.set([]);

            this.data.meta.hideAnimation = true;
            this.data.meta.runAnimation = false;
            this.data.meta.empty = false;
            this.data.meta.list = false;

            AppHelper.navigate(this.model.id + this.prefix);
        }
    },

    search () {
        this.data.meta.runAnimation = true;
        this._search().catch(error => {
            new ErrorView({error}).appendTo(AppHelper.view());
        });
    },
    async _search () {
        const q = String(this.data.meta.q);

        this.plugins.resetFilters();
        this.plugins.filterBy('accounts', 1);
        this.plugins.filterBy('q', q);
        await this.plugins.fetch();

        if (this.data.meta.q.length <= 2) {
            this.data.meta.hideAnimation = true;
            this.data.meta.runAnimation = false;
            this.data.meta.empty = false;
            this.data.meta.list = false;
        }
        else if (String(this.data.meta.q) === q) {
            this.data.meta.runAnimation = false;
            this.data.meta.hideAnimation = true;
            this.data.meta.empty = !this.plugins.length;
            this.data.meta.list = !!this.plugins.length;
        }
    },

    addPlugin (plugin) {
        this.data.meta.results.push({
            model: plugin,
            select: () => {
                this.openDetails(plugin);
            }
        });

        this.data.meta.empty = false;
        this.data.meta.list = true;
    },
    removePlugin (plugin) {
        const i = this.data.meta.results.findIndex(r => r.model.id === plugin.id);
        if (i === -1) {
            return this;
        }

        this.data.meta.results.splice(i, 1);

        this.data.meta.empty = !this.plugins.length;
        this.data.meta.list = !!this.plugins.length;
    },

    openDetails (model) {
        const AppHelper = require('../helpers/app');
        const DocumentSettingsPluginAddDetailsView = require('../views/documentSettingsPluginAddDetails');

        AppHelper.navigate(this.model.id + '/settings/plugins/add/' + model.id);
        AppHelper.view().renderView(new DocumentSettingsPluginAddDetailsView({model}));
    }
});
