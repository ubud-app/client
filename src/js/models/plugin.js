'use strict';

const BaseModel = require('./_');

/**
 * @module models/plugin
 * @class PluginModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'plugins',
    dbStore: 'plugin'
});