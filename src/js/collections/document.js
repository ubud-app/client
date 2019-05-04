'use strict';

const BaseCollection = require('./_');
const DocumentModel = require('../models/document');

const DocumentCollection = BaseCollection.extend({
    model: DocumentModel,
    url: 'documents',
    dbStore: 'document'
});

module.exports = DocumentCollection;