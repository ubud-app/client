'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import UserCollection from '../collections/user';
import DocumentSettingsPermissionsTemplate from '../../templates/documentSettingsPermissions.html';


/**
 * DocumentSettingsPermissionsView
 *
 * @module views/documentSettingsPermissions
 * @class DocumentSettingsPermissionsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const DocumentSettingsPermissionsView = BaseView.extend({
    className: 'document-settings-permissions',

    async render () {
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

        if(DataHelper.getUser().get('admin') && DataHelper.getUser().get('admin').isAdmin) {
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
                    new ErrorView({error}).appendTo(AppHelper.view());
                });
            }
        };

        this.listenToAndCall(this.model, 'change:users', () => {
            if(user.get('admin') && user.get('admin').isAdmin) {
                json.checked = true;
                json.readOnly = true;
                return;
            }

            const i = this.model.get('users').findIndex(u => u.id === user.id);
            json.checked = i > -1;
            json.readOnly = false;
        });

        this.pushAt(this.users, user, this.data.users, json);
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
        this.data.meta.leaving = true;
        this._leave()
            .then(() => AppHelper.removeDocumentLocallyAndRedirect(this.model))
            .catch(error => {
                this.data.meta.leaving = false;
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

export default DocumentSettingsPermissionsView;
