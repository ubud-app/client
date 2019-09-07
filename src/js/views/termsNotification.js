'use strict';

import BaseView from './_';
import $ from 'zepto';

import AppHelper from '../helpers/app';
import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import ErrorView from './error';
import TermsNotificationTemplate from '../../templates/termsNotification.html';


/**
 * TermsNotificationView
 *
 * @module views/termsNotification
 * @class TermsNotificationView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const TermsNotificationView = BaseView.extend({
    className: 'terms-notification',

    render () {
        const currentTerms = DataHelper.getUser().get('terms').current;
        const message = {};

        ['tos', 'privacy'].forEach(type => {
            message[type] = $('<a target="_blank">')
                .text(ConfigurationHelper.getString('termsNotification.' + type))
                .attr('href', currentTerms[type].updateUrl)
                .get(0)
                .outerHTML;
        });

        TemplateHelper.render({
            view: this,
            template: TermsNotificationTemplate,
            data: {
                message
            }
        });

        return this;
    },

    accept () {
        this.$el.hide();
        this._accept().catch(error => {
            this.$el.show();
            new ErrorView({error}).appendTo(AppHelper.view());
        });
    },
    async _accept() {
        const user = DataHelper.getUser();
        const terms = user.get('terms');
        terms.accepted = terms.current.version;

        await user.save({terms});
        this.remove();
    },

    reject () {
        this.$el.hide();

        setTimeout(() => {
            this.$el.show();
        }, 3600000);
    }
});

export default TermsNotificationView;
