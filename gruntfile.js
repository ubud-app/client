module.exports = function (grunt) {
    'use strict';

    const paths = require('./app/index.js');
    const configuration = {
        build: {
            id: grunt.option('build') || null,
            commit: process.env.CI_COMMIT_SHA || null,
            environment: process.env.CI_ENVIRONMENT_NAME || null
        },
        production: !!grunt.option('production'),
        endpoint: grunt.option('endpoint') || process.env.ENDPOINT || ''
    };

    let i;


    console.log('\n\n#####################################################################');
    console.log('#                                                                   #');
    console.log('#                      Dude, where is my money?                     #');
    console.log('#                        Client Build Script                        #');
    console.log('#                                                                   #');

    i = configuration.build.id || '-';
    process.stdout.write('#   Build-ID: ' + i);
    for (i = i.length; i < 53; i += 1) {
        process.stdout.write(' ');
    }
    console.log(' #');

    i = configuration.build.commit || '-';
    process.stdout.write('#   Commit: ' + i);
    for (i = i.length; i < 55; i += 1) {
        process.stdout.write(' ');
    }
    console.log(' #');

    i = configuration.build.environment || '-';
    process.stdout.write('#   Environment: ' + i);
    for (i = i.length; i < 50; i += 1) {
        process.stdout.write(' ');
    }
    console.log(' #');

    i = configuration.production ? '✔ Yes' : '✗ No';
    process.stdout.write('#   Production: ' + i);
    for (i = i.length; i < 51; i += 1) {
        process.stdout.write(' ');
    }
    console.log(' #');

    i = configuration.endpoint || '-';
    process.stdout.write('#   Endpoint: ' + i);
    for (i = i.length; i < 53; i += 1) {
        process.stdout.write(' ');
    }
    console.log(' #');

    console.log('#                                                                   #');
    console.log('#####################################################################\n');


    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-browser-sync');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            all: [paths.static + '/**'],
            tmp: []
        },
        copy: {
            fonts: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [paths.app.fonts + '/*'],
                        dest: paths.static + '/fonts',
                        filter: 'isFile'
                    }
                ]
            },
            images: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [paths.app.img + '/*'],
                        dest: paths.static + '/img',
                        filter: 'isFile'
                    }
                ]
            }
        },
        htmlmin: {
            app: {
                options: paths.options.html.htmlmin,
                src: paths.app.html + '/index.html',
                dest: paths.static + '/index.html'
            }
        },
        replace: {
            jsProduction: {
                options: {
                    patterns: [
                        {
                            match: 'jsFile',
                            replacement: './main.min.js'
                        }
                    ]
                },
                src: paths.app.html + '/index.html',
                dest: paths.static + '/index.html'
            },
            jsDevelopment: {
                options: {
                    patterns: [
                        {
                            match: 'jsFile',
                            replacement: './main.js'
                        }
                    ]
                },
                src: paths.app.html + '/index.html',
                dest: paths.static + '/index.html'
            },
            jsConfiguration: {
                options: {
                    patterns: [
                        {
                            match: 'CONFIGURATION_BUILD_ID',
                            replacement: configuration.build.id || ''
                        },
                        {
                            match: 'CONFIGURATION_BUILD_COMMIT',
                            replacement: configuration.build.commit || ''
                        },
                        {
                            match: 'CONFIGURATION_BUILD_ENVIRONMENT',
                            replacement: configuration.build.environment || ''
                        },
                        {
                            match: 'CONFIGURATION_ENDPOINT',
                            replacement: configuration.endpoint || ''
                        }
                    ]
                },
                src: paths.static + '/main.js',
                dest: paths.static + '/main.js'
            }
        },
        sass: {
            options: {
                sourceMap: true,
                outputStyle: 'expanded',
                sourceComments: true
            },
            app: {
                src: paths.app.css + '/app.scss',
                dest: paths.static + '/app.css'
            }
        },
        cssmin: {
            app: {
                options: {
                    banner: paths.options.css.banner
                },
                src: [
                    paths.app.css + '/vendor/*.css',
                    paths.static + '/app.css'
                ],
                dest: paths.static + '/app.min.css'
            }
        },
        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            develop: {
                options: {
                    transform: [
                        ['stringify'],
                        ['hbsfy', {'t': []}],
                        ['babelify', grunt.file.readJSON(__dirname + '/.babelrc')]
                    ]
                },
                src: paths.app.js + '/main.js',
                dest: paths.static + '/main.js'
            },
            production: {
                options: {
                    transform: [
                        ['stringify'],
                        ['hbsfy', {'t': []}],
                        ['babelify', grunt.file.readJSON(__dirname + '/.babelrc')],
                        ['uglifyify']
                    ]
                },
                src: paths.app.js + '/main.js',
                dest: paths.static + '/main.js'
            }
        },
        watch: {
            options: {
                spawn: false
            },
            htmlmin: {
                files: [paths.app.html + '/*.html'],
                tasks: ['htmlmin:app', 'replace:jsDevelopment']
            },
            sass: {
                files: [
                    paths.app.css + '/*',
                    paths.app.css + '/definitions/*',
                    paths.app.css + '/views/*',
                    paths.app.css + '/vendor/*'
                ],
                tasks: [
                    'sass:app',
                    'cssmin:app'
                ]
            },
            cssmin: {
                files: [paths.app.css + '/vendor/*.css'],
                tasks: ['cssmin:app']
            },
            fonts: {
                files: [
                    paths.app.fonts + '/*'
                ],
                tasks: ['copy:fonts']
            },
            images: {
                files: [
                    paths.app.img + '/*'
                ],
                tasks: ['copy:images']
            },
            browserify: {
                files: [
                    paths.app.js + '/**/*',
                    paths.app.templates + '/*'
                ],
                tasks: [
                    'browserify:app',
                    'replace:jsConfiguration',
                    'clean:tmp'
                ]
            }
        },
        browserSync: {
            options: {
                server: {
                    baseDir: 'dist',
                    index: 'index.html'
                },
                port: process.env.PORT || 3000,
                open: false,
                watchTask: true,
                ghostMode: {
                    clicks: false,
                    forms: false,
                    scroll: false
                }
            },
            bsFiles: {
                src: [
                    'dist/*'
                ]
            }
        }
    });

    grunt.registerTask('setProduction', function () {
        configuration.production = true;
    });

    grunt.registerTask('setVersion', function () {
        let json = require('./package.json');
        json.version = grunt.option('value');
        grunt.file.write('./package.json', JSON.stringify(json, null, '\t'));
        grunt.log.oklns('Updated package.json to ' + json.version);

        json = require('./package-lock.json');
        json.version = grunt.option('value');
        grunt.file.write('./package-lock.json', JSON.stringify(json, null, '\t'));
        grunt.log.oklns('Updated package-lock.json to ' + json.version);
    });

    grunt.registerTask('development', [
        'clean:all',
        'htmlmin:app',
        'replace:jsDevelopment',
        'sass:app',
        'cssmin:app',
        'copy:fonts',
        'copy:images',
        'browserify:develop',
        'replace:jsConfiguration'
    ]);
    grunt.registerTask('production', [
        'setProduction',
        'clean:all',
        'htmlmin:app',
        'replace:jsProduction',
        'sass:app',
        'cssmin:app',
        'copy:fonts',
        'copy:images',
        'browserify:production',
        'replace:jsConfiguration',
        'clean:tmp'
    ]);

    grunt.registerTask('dev', ['development', 'browserSync', 'watch']);
    grunt.registerTask('default', ['production']);
};