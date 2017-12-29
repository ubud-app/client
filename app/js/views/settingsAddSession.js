'use strict';

import BaseView from './_';
import $ from 'jquery';
import QRCode from 'qrcode-svg';
import SessionModel from '../models/session';
import StringHelper from '../helpers/string';
import AppHelper from '../helpers/app';

/**
 * @module views/settingsAddSession
 * @class SettingsAddSessionView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'settings-add-session app_layout--page',
    events: {
        'click .settings_cancel': 'remove',
        'click .settings-add-session_accept': 'accept',
        'click .settings-add-session_deny': 'deny'
    },

    async render () {
        AppHelper.title('settings.addSession.title');
        this.model = new SessionModel({
            name: StringHelper.string('settings.addSession.deviceName')
        });


        // Headline
        $('<h2 class="b-headline-l1" />')
            .text(StringHelper.string('settings.addSession.headline'))
            .appendTo(this.$el);

        const $message = $('<p />').text(StringHelper.string('settings.addSession.info.scan')).appendTo(this.$el);


        // QR-Code
        this.$qr = $('<div class="settings-add-session_qr loading" />').appendTo(this.$el);

        await this.generateCode();
        this.$qr.removeClass('loading');

        let i = setInterval(() => {
            this.generateCode();
        }, 30000);
        this.once('remove', () => {
            if (i) {
                clearInterval(i);
                i = null;
            }
        });
        this.listenToOnce(this.model, 'change:name', () => {
            if (i) {
                clearInterval(i);
                i = null;
            }
        });


        // Accept or Deny
        this.listenToOnce(this.model, 'change:name', () => {
            $message.text(StringHelper.string('settings.addSession.info.accept', {
                name: this.model.get('name')
            }));

            this.$qr.remove();

            $('<button class="settings-add-session_button settings-add-session_accept button" />')
                .text(StringHelper.string('settings.addSession.accept'))
                .appendTo(this.$el);

            $('<button class="settings-add-session_button settings-add-session_deny button button--secondary" />')
                .text(StringHelper.string('settings.addSession.deny'))
                .appendTo(this.$el);
        });


        // Destroy
        this.once('remove', () => {
            if(!this.model.get('accepted')) {
                this.model.destroy();
            }
        });
    },

    async generateCode () {
        if (this.model.id) {
            this.model.destroy();
        }

        await this.model.save({id: null});
        this.model.live(this);

        const url = 'dwimm://' + this.model.id + ':' + this.model.get('secret') + '@' + document.location.host;
        console.log('Current QR-Code URL:', url);

        this.$qr.html(
            new QRCode({
                content: url,
                padding: 0,
                color: '#2A2F36',
                background: 'transparent',
                width: 280,
                height: 280
            }).svg()
        );
    },

    deny () {
        window.history.back();
    },

    async accept () {
        await this.model.save({accepted: true});
        window.history.back();
    }
});
