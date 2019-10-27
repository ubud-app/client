'use strict';

import BaseModel from './_';


/**
 * @module models/pluginInstance
 * @class PluginInstanceModel
 * @augments BaseModel
 */
const PluginInstanceModel = BaseModel.extend({
    urlRoot: 'plugin-instances',
    dbStore: 'pluginInstance'
});

export default PluginInstanceModel;
