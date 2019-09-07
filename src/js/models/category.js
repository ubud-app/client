'use strict';

import BaseModel from './_';


/**
 * @module models/category
 * @class CategoryModel
 * @augments BaseModel
 */
const CategoryModel = BaseModel.extend({
    urlRoot: 'categories',
    dbStore: 'category'
});

export default CategoryModel;
