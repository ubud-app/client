'use strict';

import BaseModel from './_';


/**
 * @module models/portion
 * @class PortionModel
 * @augments BaseModel
 */
const PortionModel = BaseModel.extend({
    urlRoot: 'portions',
    dbStore: 'portion'
});

export default PortionModel;
