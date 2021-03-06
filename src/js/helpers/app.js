'use strict';

import $ from 'zepto';
import {Events} from 'backbone';
import {extend} from 'underscore';
import AppRouter from '../routers/app';
import DataHelper from './data';
import ConfigurationHelper from './configuration';


/**
 * @module helpers/app
 * @class AppHelper
 * @author Sebastian Pekarek
 */
class AppHelper {
    static initialize () {
        if (this.instance === undefined) {
            try {
                this.instance = new AppRouter({AppHelper: this});
            }
            catch (err) {
                this.instance = null;
                throw err;
            }
        }
        if (this.instance === null) {
            throw new Error('Not able to return AppRouter(): AppRouter threw an error during initialization…');
        }

        window.addEventListener('online', () => {
            this.trigger('online');
        });
        window.addEventListener('offline', () => {
            this.trigger('offline');
        });
    }

    static router () {
        AppHelper.initialize();
        return this.instance;
    }

    static view () {
        AppHelper.initialize();
        return this.instance.view;
    }

    static navigate (route, options) {
        AppHelper.initialize();
        return this.instance.navigate(route, options);
    }

    static title (title) {
        if(title === undefined) {
            return $('title').text();
        }
        else if(!title) {
            $('title').text(ConfigurationHelper.getString('app.name'));
        }
        else {
            $('title').text(title);
        }

        return this;
    }

    static back (fallback) {
        if(window.history.length > 1) {
            window.history.back();
        } else {
            AppHelper.navigate(fallback, {trigger: true});
        }
    }

    static offline () {
        return window.navigator && window.navigator.onLine === false;
    }

    static online () {
        return !this.offline();
    }

    static getDocumentId () {
        const parts = location.hash.substr(1).split('/');
        if(parts.length >= 2 && parts[0] !== 'admin' && parts[0] !== 'account') {
            return parts[0];
        }

        return null;
    }

    static getDocument (redirect = false) {
        const document = DataHelper.getDocuments().get(AppHelper.getDocumentId());
        if(redirect && !document) {
            AppHelper.navigate('', {trigger: true});
        }

        return document;
    }

    static removeDocumentLocallyAndRedirect (document) {
        const documents = DataHelper.getDocuments();
        documents.remove(document);

        if (documents.length > 0) {
            AppHelper.navigate(documents.first().id + '/budget', {trigger: true});
        }
        else {
            AppHelper.navigate('');
            location.reload();
        }
    }
}

extend(AppHelper, Events);
export default AppHelper;
