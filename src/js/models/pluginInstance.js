'use strict';

const BaseModel = require('./_');

/**
 * @module models/pluginInstance
 * @class PluginInstanceModel
 * @augments BaseModel
 */
module.exports = BaseModel.extend({
    urlRoot: 'plugin-instances',
    dbStore: 'plugin-instance'
});