'use strict';

import BaseModel from './_';


/**
 * @module models/plugin
 * @class PluginModel
 * @augments BaseModel
 */
const PluginModel = BaseModel.extend({
    urlRoot: 'plugins',
    dbStore: 'plugin'
});

export default PluginModel;
