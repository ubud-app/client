'use strict';

import BaseCollection from './_';
import ComponentModel from '../models/component';

const ComponentCollection = BaseCollection.extend({
    model: ComponentModel,
    url: 'components',
    dbStore: 'component'
});

export default ComponentCollection;