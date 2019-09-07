'use strict';

import BaseCollection from './_';
import DocumentModel from '../models/document';

const DocumentCollection = BaseCollection.extend({
    model: DocumentModel,
    url: 'documents',
    dbStore: 'document'
});

export default DocumentCollection;