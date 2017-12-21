'use strict';

import BaseView from './_';
import UserCollection from '../collections/user';
import DocumentSettingsUserView from './documentSettingsUser';

/**
 * @module views/documentSettingsUsers
 * @class DocumentSettingsUsersView
 * @augments BaseView
 */
export default BaseView.extend({
    tagName: 'ul',
    className: 'document-settings-users loading',

    async render() {
        this.collection = new UserCollection().live(this);

        this.renderChildren(DocumentSettingsUserView, {
            childOptions: {document: this.model}
        });

        this.listenToOnce(this.collection, 'sync', () => {this.$el.removeClass('loading');});
    }
});
