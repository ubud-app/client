'use strict';

import BaseModel from './_';


/**
 * @module models/document
 * @class DocumentModel
 * @augments BaseModel
 */
const DocumentModel = BaseModel.extend({
    urlRoot: 'documents',
    dbStore: 'document'
});

export default DocumentModel;