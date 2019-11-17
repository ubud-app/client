'use strict';

import $ from 'zepto';
import BaseView from './_';
import * as Sentry from '@sentry/browser';
import {DateTime} from 'luxon';

import DataHelper from '../helpers/data';
import TemplateHelper from '../helpers/template';
import ConfigurationHelper from '../helpers/configuration';

import SummaryCollection from '../collections/summary';
import DocumentModel from '../models/document';

import HeaderDocumentsTemplate from '../../templates/headerDocuments.html';


/**
 * HeaderDocumentsView
 *
 * @module views/headerDocuments
 * @class HeaderDocumentsView
 * @augments BaseView
 * @author Sebastian Pekarek
 */
const HeaderDocumentsView = BaseView.extend({
    className: 'header-documents header-documents--hidden',
    events: {
        'click': 'closeHandler'
    },

    render () {
        this.nextShow = new Date().getTime() + 150;
        this.data = {
            add: {
                hidden: true,
                click: this.newItem
            },
            documents: []
        };

        this.collection = DataHelper.getDocuments();
        this.listenTo(this.collection, 'add', this.addItem);
        this.collection.each(this.addItem);
        this.listenTo(this.collection, 'remove', removed => {
            const i = this.data.documents.findIndex(i => i.model.id === removed.id);
            if (i > -1) {
                this.data.documents.splice(i, 1);
            }
        });
        this.listenToAndCall(this.collection, 'sync', () => {
            if (this.collection.isSynced()) {
                const delay = Math.max(this.nextShow - new Date().getTime(), 0);
                setTimeout(() => {
                    this.data.add.hidden = false;
                }, delay);
            }
        });

        this.live(this.collection);


        TemplateHelper.render({
            view: this,
            template: HeaderDocumentsTemplate,
            data: this.data
        });

        setTimeout(() => {
            this.$el.removeClass('header-documents--hidden');
        }, 0);

        return this;
    },

    addItem (document) {
        const item = {
            hidden: true,
            link: null,
            model: document,
            tasks: 'Keine offenen Aufgaben', //@todo
            click: () => {
                this.hide();
            }
        };

        this.listenToAndCall(document, 'change:id', async () => {
            item.link = '#' + document.id + '/';
            item.tasks = '';

            try {
                const summary = new SummaryCollection();
                summary.filterBy('document', document.id);
                summary.filterBy('month', DateTime.local().toISODate().substr(0, 7));

                this.live(summary);
                await summary.fetch();

                this.listenToAndCall(summary, 'add remove', () => {
                    const model = summary.first();
                    this.live(model);

                    this.listenToAndCall(model, 'change:available', () => this.updateItemText(item, model));
                });
            }
            catch (error) {
                Sentry.captureException(error);
            }
        });

        this.data.documents.push(item);

        const delay = Math.max(this.nextShow - new Date().getTime(), 0);
        this.nextShow += 50;

        setTimeout(() => {
            item.hidden = false;
        }, delay);
    },

    updateItemText (item, summary) {
        if (summary && summary.get('available') > 0) {
            item.tasks = ConfigurationHelper.getString('header.documents.tasks.positive', {
                amount: TemplateHelper.formatCurrency(summary.get('available'))
            });
        }
        else if (summary && summary.get('available') === 0) {
            item.tasks = ConfigurationHelper.getString('header.documents.tasks.zero');
        }
        else {
            item.tasks = ConfigurationHelper.getString('header.documents.tasks.negative', {
                amount: TemplateHelper.formatCurrency(summary.get('available'))
            });
        }
    },

    async hide () {
        this.trigger('hide');
        this.$el.addClass('header-documents--hidden');
        this.data.documents.forEach(i => i.hidden = true);
        this.data.add.hidden = true;

        await new Promise(cb => setTimeout(cb, 300));
        this.remove();
    },

    closeHandler (e) {
        if ($(e.target).is('.header-documents') || $(e.target).is('.header-documents__list')) {
            this.hide();
        }
    },

    async newItem () {
        let name = window.prompt(ConfigurationHelper.getString('header.documents.new.prompt'));
        if (name === null) {
            return;
        }

        name = name.trim();
        if (!name) {
            name = ConfigurationHelper.getString('header.documents.new.unnamed');
        }

        const document = new DocumentModel();
        document.set({name});

        this.collection.add(document);

        try {
            document.save();
        }
        catch (err) {
            this.collection.remove(document);
        }
    }
});

export default HeaderDocumentsView;
