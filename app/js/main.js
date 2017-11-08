'use strict';

require('babel-core/register');
require('babel-polyfill');

import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';
import Raven from 'raven-js';
import ConfigurationHelper from './helpers/configuration';
import AppHelper from './helpers/app';
import LoginView from './views/login';
import FirstSetupView from './views/firstSetup';
import SessionModel from './models/session';
import UserModel from './models/user';
import DocumentCollection from './collections/document';

// initialize raven / sentry
if (ConfigurationHelper.isProduction() && ConfigurationHelper.getRavenURL()) {
    Raven
        .config(ConfigurationHelper.getRavenURL(), {
            release: ConfigurationHelper.getBuildCommit(),
            environment: ConfigurationHelper.getBuildEnvironment(),
            tags: {buildId: ConfigurationHelper.getBuildId()}
        })
        .install();
}

// for startup animation purposes
const $app = $('#app');
_.delay(function () {
    $app.addClass('app--init-animate');
}, 250);


(async function () {
    await new LoginView().check({
        endpoint: ConfigurationHelper.getEndpoint(),
        SessionModel, UserModel, DocumentCollection
    });

    AppHelper.initialize();
    await new FirstSetupView().check();

    Backbone.history.start();
    $app.removeClass('app--initializing');
})();
