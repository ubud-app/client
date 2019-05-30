'use strict';

const $ = require('jquery');
const View = require('./_');
const {DateTime} = require('luxon')

const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');

const HeaderConnectionStatusTemplate = require('../../templates/headerConnectionStatus.html');


/**
 * HeaderConnectionStatusView
 *
 * @module views/headerConnectionStatus
 * @class HeaderConnectionStatusView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
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
            this.addLog(DateTime.fromMillis(time), message)
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

        await new Promise(cb => setTimeout(cb, 300));
        this.remove();
    },

    closeHandler (e) {
        if ($(e.target).is('.header-connection-status') || $(e.target).is('.header-connection-status__content')) {
            this.hide();
        }
    }
});
