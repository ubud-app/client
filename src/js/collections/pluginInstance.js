'use strict';

const BaseCollection = require('./_');
const PluginInstanceModel = require('../models/pluginInstance');

const PluginInstanceCollection = BaseCollection.extend({
    model: PluginInstanceModel,
    url: 'plugin-instances',
    dbStore: 'pluginInstance'
});

module.exports = PluginInstanceCollection;