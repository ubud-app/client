'use strict';

const View = require('./_');
const $ = require('zepto');

const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const TermsNotificationTemplate = require('../../templates/termsNotification.html');


/**
 * TermsNotificationView
 *
 * @module views/termsNotification
 * @class TermsNotification
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
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
            const AppHelper = require('../helpers/app');
            const ErrorView = require('./error');

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
