'use strict';

const $ = require('jquery');
const View = require('./_');

const DataHelper = require('../helpers/data');
const TemplateHelper = require('../helpers/template');
const ConfigurationHelper = require('../helpers/configuration');

const DocumentModel = require('../models/document');

const HeaderDocumentsTemplate = require('../../templates/headerDocuments.html');


/**
 * HeaderDocumentsView
 *
 * @module views/headerDocuments
 * @class HeaderDocumentsView
 * @augments View
 * @author Sebastian Pekarek
 */
module.exports = View.extend({
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
            if(this.collection.isSynced()) {
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

        this.listenToAndCall(document, 'change:id', () => {
            item.link = '#' + document.id + '/';
        });

        this.data.documents.push(item);

        const delay = Math.max(this.nextShow - new Date().getTime(), 0);
        this.nextShow += 50;

        setTimeout(() => {
            item.hidden = false;
        }, delay);
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
