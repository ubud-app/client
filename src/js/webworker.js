'use strict';

/**
 * @module webworker
 * @author Sebastian Pekarek
 */


import '@babel/register';
import '@babel/polyfill';

import DataWorker from './helpers/data/worker';
import config from 'worker-config';

new DataWorker(self, config);
