'use strict';

const BaseCollection = require('./_');
const PluginModel = require('../models/plugin');

const PluginCollection = BaseCollection.extend({
    model: PluginModel,
    url: 'plugins',
    dbStore: 'plugin'
});

module.exports = PluginCollection;