'use strict';

import BaseView from './_';

import AppHelper from '../helpers/app';
import TemplateHelper from '../helpers/template';
import SidebarTemplate from '../../templates/sidebar.html';
import TransactionAddView from './transactionAdd';


/**
 * SidebarView
 *
 * @module views/sidebar
 * @class SidebarView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const SidebarView = BaseView.extend({
    tagName: 'div',
    className: 'sidebar',

    render () {
        this.data = {
            budget: {
                active: true,
                url: '#',
                click: () => {
                    this.setActive('budget');
                }
            },
            transactions: {
                active: false,
                url: '#',
                click: () => {
                    this.setActive('transactions');
                }
            },
            add: {
                active: false,
                click: () => {
                    this.setActive('add');
                    new TransactionAddView().appendTo(AppHelper.view());
                }
            },
            settings: {
                active: false,
                url: '#',
                click: () => {
                    this.setActive('settings');
                }
            },
            reports: {
                active: false,
                url: '#',
                click: () => {
                    this.setActive('reports');
                }
            }
        };

        setTimeout(() => {
            this.listenToAndCall(AppHelper.router(), 'route', () => {
                const parts = location.hash.substr(1).split('/');
                const documentId = parts[0] && parts[0] !== 'account' && parts[0] !== 'admin' ? parts[0] : null;

                this.$el.toggleClass('sidebar--hidden', !documentId);
                ['budget', 'transactions', 'reports', 'settings'].forEach(s => {
                    this.data[s].url = '#' + documentId + '/' + s;
                    this.data[s].active = parts[1] === s;
                });
            });
        }, 50);

        TemplateHelper.render({
            view: this,
            template: SidebarTemplate,
            data: this.data
        });

        setTimeout(() => this.data.add.click(), 100);
        return this;
    },

    show (show = true) {
        this.$el.toggleClass('sidebar--hidden', show === false);
    },

    hide (hide = true) {
        this.$el.toggleClass('sidebar--hidden', hide !== false);
    },

    setActive (item) {
        Object.values(this.data).forEach(v => v.active = false);
        this.data[item].active = true;
    }
});

export default SidebarView;
