'use strict';

import $ from 'zepto';
import BaseView from './_';
import {DateTime} from 'luxon';

import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';

import HeaderConnectionStatusTemplate from '../../templates/headerConnectionStatus.html';


/**
 * HeaderConnectionStatusView
 *
 * @module views/headerConnectionStatus
 * @class HeaderConnectionStatusView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const HeaderConnectionStatusView = BaseView.extend({
    className: 'header-connection-status header-connection-status--hidden',
    events: {
        'click': 'closeHandler'
    },

    render () {
        this.data = {
            items: []
        };

        this.listenTo(DataHelper, 'log', message => {
            this.addLog(DateTime.local(), message);
        });
        DataHelper.getLogs().forEach(([time, message]) => {
            this.addLog(DateTime.fromMillis(time), message);
        });

        TemplateHelper.render({
            view: this,
            template: HeaderConnectionStatusTemplate,
            data: this.data
        });

        setTimeout(() => {
            this.$el.removeClass('header-connection-status--hidden');
        }, 0);

        return this;
    },

    addLog (time, message) {
        this.data.items.push({
            time: time.toFormat('HH:mm:ss:SSS'),
            message
        });
    },

    async hide () {
        this.trigger('hide');
        this.$el.addClass('header-connection-status--hidden');

        await new Promise(cb => {
            setTimeout(cb, 300);
        });
        this.remove();
    },

    closeHandler (e) {
        if ($(e.target).is('.header-connection-status') || $(e.target).is('.header-connection-status__content')) {
            this.hide();
        }
    }
});

export default HeaderConnectionStatusView;
