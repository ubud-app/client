'use strict';

import BaseCollection from './_';
import UnitModel from '../models/unit';

const UnitCollection = BaseCollection.extend({
    model: UnitModel,
    url: 'units'
});

export default UnitCollection;