'use strict';

const View = require('./_');
const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const UserCollection = require('../collections/user');
const DocumentSettingsPermissionsTemplate = require('../../templates/documentSettingsPermissions.html');


/**
 * DocumentSettingsPermissionsView
 *
 * @module views/documentSettingsPermissions
 * @class DocumentSettingsPermissionsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'document-settings-permissions',

    async render () {
        const AppHelper = require('../helpers/app');
        this.model = AppHelper.getDocument(true);
        if(!this.model) {
            return;
        }

        this.data = {
            document: this.model,
            users: [],
            meta: {
                isAdmin: false,
                isUser: false,
                allowLeave: false,
                leaving: false,
                infoText: ''
            }
        };

        this.live(this.model);
        TemplateHelper.render({
            view: this,
            template: DocumentSettingsPermissionsTemplate,
            data: this.data
        });

        AppHelper.view().setTitle(ConfigurationHelper.getString('documentSettingsPermissions.headline'));
        this.listenToAndCall(this.model, 'change:name', () => {
            AppHelper.title(this.model.get('name'));
            this.data.meta.infoText = ConfigurationHelper.getString('documentSettingsPermissions.infoText', {
                document: this.model.get('name')
            });
        });

        if(DataHelper.getUser().get('isAdmin')) {
            this.renderAdminPermissions();
        } else {
            this.renderUserPermission();
        }

        return this;
    },
    renderAdminPermissions () {
        this.data.meta.isAdmin = true;

        this.users = new UserCollection();
        this.live(this.users);

        this.listenTo(this.users, 'add', this.addUser);
        this.listenTo(this.users, 'remove', this.removeUser);
        this.users.each(this.addUser);

        const updateLoader = () => {
            this.data.meta.loading = !this.model.isSynced() || !this.users.isSynced();
        };

        this.listenTo(this.model, 'sync cache', updateLoader);
        this.listenToAndCall(this.users, 'sync cache', updateLoader);
    },
    renderUserPermission () {
        this.data.meta.isUser = true;
        this.user = DataHelper.getUser().get('isAdmin');
        this.data.meta.loading = false;
        this.data.meta.allowLeave = !!this.model.get('users');
    },

    addUser(user) {
        const json = {
            id: user.id,
            elId: 'document-settings-permissions__checkbox--' + user.id,
            model: user,
            checked: false,
            readOnly: true,
            toggle: () => {
                const users = this.model.get('users');
                const i = users.findIndex(u => u.id === user.id);

                if(i > -1) {
                    users.splice(i, 1);
                } else {
                    users.push({
                        id: user.id,
                        email: user.email
                    });
                }

                this.model.save().catch(error => {
                    const ErrorView = require('./error');
                    const AppHelper = require('../helpers/app');

                    new ErrorView({error}).appendTo(AppHelper.view());
                });
            }
        };

        this.listenToAndCall(this.model, 'change:users', () => {
            if(user.get('isAdmin')) {
                json.checked = true;
                json.readOnly = true;
                return;
            }

            const i = this.model.get('users').findIndex(u => u.id === user.id);
            json.checked = i > -1;
            json.readOnly = false;
        });

        this.data.users.push(json);
        this.live(user);
    },
    removeUser (user) {
        const i = this.users.findIndex(a => a.id === user.id);
        if(i === -1) {
            return this;
        }

        this.data.users.splice(i, 1);
    },

    leave () {
        const AppHelper = require('../helpers/app');

        this.data.meta.leaving = true;
        this._leave()
            .then(() => {
                const documents = DataHelper.getDocuments();
                documents.remove(this.model);

                if (documents.length > 0) {
                    AppHelper.navigate(documents.first().id + '/budget', {trigger: true});
                }
                else {
                    AppHelper.navigate('');
                    location.reload();
                }
            })
            .catch(error => {
                this.data.meta.leaving = false;

                const ErrorView = require('./error');
                new ErrorView({error}).appendTo(AppHelper.view());
            });
    },
    async _leave () {
        const users = this.model.get('users');
        const me = DataHelper.getUser();
        const i = users.findIndex(u => u.id === me.id);

        if(i > -1) {
            users.splice(i, 1);
        }

        return this.model.save();
    }
});
