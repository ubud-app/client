'use strict';

import BaseModel from './_';


/**
 * @module models/pluginInstance
 * @class PluginInstanceModel
 * @augments BaseModel
 */
const PluginInstanceModel = BaseModel.extend({
    urlRoot: 'plugin-instances',
    dbStore: 'plugin-instance'
});

export default PluginInstanceModel;
