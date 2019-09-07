'use strict';

import BaseCollection from './_';
import PluginModel from '../models/plugin';

const PluginCollection = BaseCollection.extend({
    model: PluginModel,
    url: 'plugins',
    dbStore: 'plugin'
});

export default PluginCollection;