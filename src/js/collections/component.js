'use strict';

const BaseCollection = require('./_');
const ComponentModel = require('../models/component');

const ComponentCollection = BaseCollection.extend({
    model: ComponentModel,
    url: 'components',
    dbStore: 'component'
});

module.exports = ComponentCollection;