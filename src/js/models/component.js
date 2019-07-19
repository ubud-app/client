'use strict';

const BaseModel = require('./_');

/**
 * @module models/component
 * @class ComponentModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'components',
    dbStore: 'component'
});