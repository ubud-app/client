'use strict';

const BaseCollection = require('./_');
const CategoryModel = require('../models/category');

const CategoryCollection = BaseCollection.extend({
    model: CategoryModel,
    url: 'categories',
    dbStore: 'category',
    comparator: 'name'
});

module.exports = CategoryCollection;