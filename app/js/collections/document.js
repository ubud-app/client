'use strict';

import BaseCollection from './_';
import DocumentModel from '../models/document';

const DocumentCollection = BaseCollection.extend({
	model: DocumentModel,
	url: 'documents'
});

export default DocumentCollection;