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
    className: 'document-settings-users',

    async render() {
        this.collection = new UserCollection().live(this);

        this.renderChildren(DocumentSettingsUserView, {
            childOptions: {document: this.model}
        });
    }
});
