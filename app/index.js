/**
 *
 * DWIMM
 *
 */

const pathApp = __dirname;
const pathStatic = __dirname + '/../dist';

module.exports = {
    app: {
        all: pathApp,
        css: pathApp + '/css',
        html: pathApp + '/html',
        img: pathApp + '/img',
        js: pathApp + '/js',
        templates: pathApp + '/templates',
        fonts: pathApp + '/fonts',
        other: pathApp + '/other'
    },
    static: pathStatic,

    options: {
        html: {
            htmlmin: {
                removeComments: true,
                removeCommentsFromCDATA: true,
                removeCDATASectionsFromCDATA: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                removeOptionalTags: true,
                removeIgnored: true
            }
        },
        css: {
            banner: '/**\n * DWIMM Client\n * <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>\n */\n'
        },
        js: {
            banner: {
                production: '/**\n * DWIMM Client\n * Version <%= pkg.version %> / Build <%= build.id %>\n * <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>\n */\n',
                develop: '/**\n * DWIMM Client\n * development\n */\n'
            }
        }
    }
};