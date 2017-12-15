'use strict';

import BaseCollection from './_';
import PluginInstanceModel from '../models/pluginInstance';

const PluginInstanceCollection = BaseCollection.extend({
    model: PluginInstanceModel,
    url: 'plugin-instances'
});

export default PluginInstanceCollection;