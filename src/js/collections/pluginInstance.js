'use strict';

import BaseCollection from './_';
import PluginInstanceModel from '../models/account';

const PluginInstanceCollection = BaseCollection.extend({
    model: PluginInstanceModel,
    url: 'plugin-instances',
    dbStore: 'pluginInstance'
});

export default PluginInstanceCollection;