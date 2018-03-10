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

const BOOT_UNANIMATED_TIME = 250;

// initialize raven / sentry
if (ConfigurationHelper.isProduction() && ConfigurationHelper.getRavenURL()) {
    try {
        Raven
            .config(ConfigurationHelper.getRavenURL(), {
                release: ConfigurationHelper.getBuildVersion(),
                tags: {build: ConfigurationHelper.getBuildId()}
            })
            .install();
    }
    catch(err) {
        console.warn('Unable to enable raven: %s', err); // eslint-disable-line no-console
    }
}

// for startup animation purposes
const $app = $('#app');
_.delay(function () {
    $app.addClass('app--init-animate');
}, BOOT_UNANIMATED_TIME);


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
