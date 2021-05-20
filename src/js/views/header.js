'use strict';

import gravatar from 'js-gravatar';
import BaseView from './_';

import DataHelper from '../helpers/data';
import WorkerHelper from '../helpers/worker';
import TemplateHelper from '../helpers/template';

import HeaderTemplate from '../../templates/header.html';

import HeaderDocumentsView from './headerDocuments';
import HeaderSettingsView from './headerSettings';
import HeaderConnectionStatusView from './headerConnectionStatus';


/**
 * HeaderView
 *
 * @module views/header
 * @class HeaderView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const HeaderView = BaseView.extend({
    tagName: 'nav',
    className: 'header',

    render () {
        this.data = {
            documents: {
                active: false
            },
            connection: {
                disconnected: false,
                connecting: false,
                connected: false,
                authenticating: false,
                string: 'header.connection.disconnected'
            },
            avatar: {
                url: null,
                visible: false
            },
            settings: {
                active: false,
                indicator: false
            },
            title: {
                content: null
            }
        };

        this.listenToAndCall(DataHelper, 'socket:state', () => {
            this.updateConnection();
        });

        TemplateHelper.render({
            view: this,
            template: HeaderTemplate,
            data: this.data
        });


        const user = DataHelper.getUser();
        this.live(user);
        this.listenToAndCall(user, 'change:email', () => {
            this.updateAvatar(user);
        });

        const components = DataHelper.getComponents();
        this.listenTo(WorkerHelper, 'updateAvailable', () => this.updateSettingsBadge(components));
        this.listenToAndCall(components, 'add remove sync', () => this.updateSettingsBadge(components));
        this.live(components);

        return this;
    },

    updateConnection () {
        ['disconnected', 'connecting', 'connected', 'authenticating'].forEach(state => {
            this.data.connection[state] = DataHelper.state() === state;
        });

        this.data.connection.string = 'header.connection.' + DataHelper.state();
    },

    async updateAvatar (user) {
        if (!user.get('email')) {
            this.data.avatar.url = null;
            this.data.avatar.visible = false;
            return;
        }

        const url = gravatar({
            email: user.get('email'),
            size: (window.devicePixelRatio || 1) * 80,
            defaultImage: '404'
        });

        await new Promise(resolve => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
        });

        this.data.avatar.url = url;
        this.data.avatar.visible = true;
    },

    updateSettingsBadge (components) {
        const server = components.find(c => c.id === 'server');
        this.data.settings.indicator = WorkerHelper.isUpdateAvailable() ||
            (server && server.get('updateAvailable'));
    },

    setTitle (title) {
        this.data.title.content = title;
    },

    toggleDocuments () {
        if (this._documents) {
            this._documents.hide();
            return;
        }

        this.data.documents.active = true;

        this._documents = new HeaderDocumentsView().appendTo(this);
        this.listenToOnce(this._documents, 'hide', () => {
            this.data.documents.active = false;
            delete this._documents;
        });
    },

    toggleSettings () {
        if (this._settings) {
            this._settings.hide();
            return;
        }

        this.data.settings.active = true;

        this._settings = new HeaderSettingsView({avatarUrl: this.data.avatar.url}).appendTo(this);
        this.listenToOnce(this._settings, 'hide', () => {
            this.data.settings.active = false;
            delete this._settings;
        });
    },

    toggleConnectionStatus () {
        if (this._status) {
            this._status.hide();
            return;
        }

        this._status = new HeaderConnectionStatusView().appendTo(this);
        this.listenToOnce(this._status, 'hide', () => {
            delete this._status;
        });
    }
});

export default HeaderView;
