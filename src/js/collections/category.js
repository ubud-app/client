'use strict';

import BaseCollection from './_';
import CategoryModel from '../models/category';

const CategoryCollection = BaseCollection.extend({
    model: CategoryModel,
    url: 'categories',
    dbStore: 'category',
    comparator: 'name'
});

export default CategoryCollection;