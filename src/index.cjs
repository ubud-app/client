/**
 *
 * ubud Client
 */

/* eslint-disable no-undef */


const path = require('path');
const config = {
    static: path.join(__dirname, '..', 'dest'),
    languages: [
        'de-DE',
        'en-US'
    ]
};

module.exports = config;
