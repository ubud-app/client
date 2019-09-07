'use strict';

import BaseView from './_';
import TemplateHelper from '../helpers/template';

import PlaceholderTemplate from '../../templates/placeholder.html';


/**
 * PlaceholderView
 *
 * @module views/placeholder
 * @class PlaceholderView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const PlaceholderView = BaseView.extend({
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

export default PlaceholderView;
