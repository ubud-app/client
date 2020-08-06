'use strict';

/**
 * @module webworker
 * @author Sebastian Pekarek
 */


/* eslint-disable node/no-unpublished-import */
import '@babel/register';
import '@babel/polyfill';
/* eslint-enable node/no-unpublished-import */

import DataWorker from './helpers/data/worker';

// worker-config is replaced with actual config path during build
// eslint-disable-next-line node/no-missing-import
import config from 'worker-config';

new DataWorker(self, config);
