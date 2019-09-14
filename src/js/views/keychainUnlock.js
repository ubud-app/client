'use strict';

import BaseView from './_';
import ErrorView from './error';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import KeychainUnlockTemplate from '../../templates/keychainUnlock.html';


/**
 * KeychainUnlockView
 *
 * @module views/keychainUnlock
 * @class KeychainUnlockView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const KeychainUnlockView = BaseView.extend({
    className: 'keychain-unlock b-modal b-modal--hidden',

    render () {
        this.data = {
            password: {
                value: null
            }
        };

        TemplateHelper.render({
            view: this,
            template: KeychainUnlockTemplate,
            data: this.data
        });

        this.activateModal();
        return this;
    },

    async submit (e) {
        e.preventDefault();

        try {
            await this.model.save({
                admin: Object.assign(
                    {},
                    this.model.get('admin'),
                    {
                        unlockPassword: this.data.password.value
                    }
                )
            });

            this.hide();
        }
        catch(error) {
            new ErrorView({error}).appendTo(AppHelper.view());
        }
    },

    close () {
        this.hide();
    }
});

export default KeychainUnlockView;
