'use strict';

const View = require('./_');
const TemplateHelper = require('../helpers/template');

const PlaceholderTemplate = require('../../templates/placeholder.html');


/**
 * PlaceholderView
 *
 * @module views/placeholder
 * @class PlaceholderView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
    className: 'placeholder',

    _initialize (options) {
        this.icon = options.icon || 'paper-plane';
        this.text = options.text || 'ubud';
    },

    render () {
        TemplateHelper.render({
            view: this,
            template: PlaceholderTemplate,
            data: {
                content: {
                    text: this.text
                }
            }
        });

        this.$el.find('.placeholder__icon').addClass('icon-' + this.icon);
        return this;
    }
});
