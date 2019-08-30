'use strict';

import BaseModel from './_';


/**
 * @module models/component
 * @class ComponentModel
 * @augments BaseModel
 */
const ComponentModel = BaseModel.extend({
    urlRoot: 'components',
    dbStore: 'component'
});

export default ComponentModel;
