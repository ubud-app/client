'use strict';

/**
 * @module webworker
 * @author Sebastian Pekarek
 */


require('@babel/register');
require('@babel/polyfill');

const DataWorker = require('./helpers/data/worker');
const config = require('worker-config');

new DataWorker(self, config);
