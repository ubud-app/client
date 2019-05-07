'use strict';

/**
 * @module main
 * @author Sebastian Pekarek
 */


require('@babel/register');
require('@babel/polyfill');


const Backbone = require('backbone');
const $ = require('jquery');
const Sentry = require('@sentry/browser');
const ConfigurationHelper = require('./helpers/configuration');
const AppHelper = require('./helpers/app');
const WorkerHelper = require('./helpers/worker');
const DataHelper = require('./helpers/data');


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
        SessionModel: require('./models/session'),
        UserModel: require('./models/user'),
        DocumentCollection: require('./collections/document')
    });

    const LoginView = require('./views/login');
    await new LoginView().check();

    const FirstSetupView = require('./views/firstSetup');
    await new FirstSetupView().check();

    AppHelper.initialize();
    Backbone.history.start();

    $app.removeClass('app--initializing');
})();