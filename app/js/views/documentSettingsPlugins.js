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
    className: 'document-settings-plugins loading',

    async render() {
        this.$el.html(DocumentSettingsPluginsTemplate());
        this.collection = this.model.getPluginInstances().live(this);

        this.listenToAndCall(this.collection, 'add remove reset sync request', this.showOrHideEmptyMessage);
        this.renderChildren(DocumentSettingsPluginView, {
            childOptions: {document: this.model}
        });

        this.listenToOnce(this.collection, 'sync', () => {this.$el.removeClass('loading');});
    },

    showOrHideEmptyMessage() {
        this.$('.document-settings-plugins_empty').toggleClass(
            'document-settings-plugins_empty--visible',
            this.collection.length === 0 && !this.collection.syncing
        );
    }
});
