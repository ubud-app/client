/**
 * ⚙ ConfigurationBuilder
 *
 * @class ConfigurationHelper
 */
class ConfigurationHelper {
    constructor ({grunt, pkg, config}) {
        this.grunt = grunt;
        this.pkg = pkg;
        this.config = config;
    }

    async app () {
        const util = require('util');
        const path = require('path');
        const fs = require('fs');

        const folder = path.resolve('./src/i18n');
        const readdir = util.promisify(fs.readdir);
        const files = await readdir(folder);

        const only = (this.grunt.option('only') || '').split(',').filter(l => l);
        const contents = {};
        await Promise.all(files.map(fileName => {
            const file = path.join(folder, fileName);
            const language = path.parse(file).name;
            if (only.length && only.indexOf(language) === -1) {
                return;
            }

            contents[language] = {
                language,
                strings: require(file),
                version: {
                    name: process.env.VERSION || this.pkg.version,
                    build: process.env.GITHUB_ACTION || process.env.CI_JOB_ID || null,
                    commit: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || null,
                    environment: process.env.CI_ENVIRONMENT_NAME || null
                },
                sentry: this.config.sentry,
                endpoint: process.env.ENDPOINT || null
            };
        }));

        Object.values(contents).forEach(language => {
            language.otherLanguages = Object.keys(contents)
                .filter(l => l !== language.language)
        });

        return contents;
    }

    async worker () {
        const perLanguage = ['app.config.js', 'index.html'];

        const util = require('util');
        const path = require('path');
        const fs = require('fs');

        const cache = ['/app.js', '/style.css'];
        const stringFolder = path.resolve('./src/i18n');
        const readdir = util.promisify(fs.readdir);
        const stringFiles = await readdir(stringFolder);
        const only = (this.grunt.option('only') || '').split(',').filter(l => l);

        stringFiles.forEach(languageFile => {
            const language = path.parse(languageFile).name;
            if (only.length && only.indexOf(language) === -1) {
                return;
            }

            perLanguage.forEach(appFile => {
                cache.push(`/${language}/${appFile}`);
            });
        });

        const stores = [];
        const modelFolder = path.resolve('./src/js/models');
        const modelFiles = await readdir(modelFolder);
        modelFiles.forEach(modelFile => {
            const model = path.parse(modelFile).name;
            if(model[0] !== '.' && model !== '_' && model !== 'index') {
                stores.push(model);
            }
        });

        return {
            production: !this.grunt.option('develop'),
            version: process.env.VERSION || this.pkg.version,
            stores,
            cache
        };
    }
}

module.exports = ConfigurationHelper;
