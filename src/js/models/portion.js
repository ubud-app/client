'use strict';

const BaseModel = require('./_');

/**
 * @module models/portion
 * @class PortionModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'portions',
    dbStore: 'portion'
});