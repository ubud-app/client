'use strict';

import $ from 'jquery';
import BaseView from './_';
import AppHelper from '../helpers/app';
import StringHelper from '../helpers/string';

/**
 * @module views/placeholder
 * @class PlaceholderView
 * @augments BaseView
 */
export default BaseView.extend({
    className: 'placeholder app_layout--page',

    _initialize(options) {
        this.view = options.view;
    },

    render() {
        AppHelper.title(this.view + '.title');

        $('<span class="placeholder_text" />').text(StringHelper.string(this.view + '.placeholder')).appendTo(this.$el);
    }
});
