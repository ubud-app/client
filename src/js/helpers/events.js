'use strict';

import {Events as BackboneEvents} from 'backbone';
import {extend} from 'underscore';

export default class Events {
    constructor () {
        extend(this, BackboneEvents);
        console.log(BackboneEvents);
    }
}
