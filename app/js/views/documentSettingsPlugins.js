'use strict';

import BaseView from './_';
import DocumentSettingsPluginsTemplate from '../../templates/documentSettingsPlugins.handlebars';
import DocumentSettingsPluginView from './documentSettingsPlugin';

/**
 * @module views/documentSettingsPlugins
 * @class DocumentSettingsPluginsView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'ul',
    className: 'document-settings-plugins',

    async render() {
        this.$el.html(DocumentSettingsPluginsTemplate());
        this.collection = this.model.getPluginInstances().live(this);

        this.listenToAndCall(this.collection, 'add remove reset', this.showOrHideEmptyMessage);
        this.renderChildren(DocumentSettingsPluginView, {
            childOptions: {document: this.model}
        });
    },

    showOrHideEmptyMessage() {
        this.$('.document-settings-plugins_empty').toggleClass(
            'document-settings-plugins_empty--visible',
            this.collection.length === 0
        );
    }
});
