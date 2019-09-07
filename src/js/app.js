'use strict';

/**
 * @module main
 * @author Sebastian Pekarek
 */


import '@babel/register';
import '@babel/polyfill';

import Backbone from 'backbone';
import $ from 'zepto';
import * as Sentry from '@sentry/browser';

import ConfigurationHelper from './helpers/configuration';
import AppHelper from './helpers/app';
import WorkerHelper from './helpers/worker'
import DataHelper from './helpers/data';

import SessionModel from './models/session';
import UserModel from './models/user';

import ComponentCollection from './collections/component';
import DocumentCollection from './collections/document';

import LoginView from './views/login';
import FirstSetupView from './views/firstSetup';


// initialize raven / sentry
if (ConfigurationHelper.getSentryDSN()) {
    Sentry.init({
        dsn: ConfigurationHelper.getSentryDSN(),
        release: ConfigurationHelper.getVersion(),
        environment: ConfigurationHelper.getBuildEnvironment(),
        tags: {
            commit: ConfigurationHelper.getBuildCommit()
        }
    });
}

Error.stackTraceLimit = 50;

(async () => {
    const $app = $('#app');

    await WorkerHelper.initialize();
    await DataHelper.initialize({
        endpoint: ConfigurationHelper.getEndpoint(),

        SessionModel,
        UserModel,
        ComponentCollection,
        DocumentCollection
    });

    $app.removeClass('app--initializing');

    await new LoginView().check();
    await new FirstSetupView().check();

    AppHelper.initialize();
    Backbone.history.start();
})();