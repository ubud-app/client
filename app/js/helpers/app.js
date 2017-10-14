'use strict';

import AppRouter from '../routers/app';
let instance;

export default class AppHelper {
	static initialize() {
		if(!instance){
			instance = new AppRouter();
		}
	}

	static router() {
		AppHelper.initialize();
		return instance;
	}

	static view() {
		AppHelper.initialize();
		return instance.view;
	}

	static navigate(route, options) {
		AppHelper.initialize();
		return instance.navigate(route, options);
	}

	static title(t) {
		AppHelper.initialize();
		instance.view.setTitle(t);
		return AppHelper;
	}

	static sidebar() {
		AppHelper.initialize();
		return instance.view.sidebar;
	}
}
