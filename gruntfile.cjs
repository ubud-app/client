module.exports = function (grunt) {
    'use strict';

    const path = require('path');
    const pkg = grunt.file.readJSON('package.json');
    const globalConfig = grunt.file.readJSON('./src/config.json');

    let fibers;
    try {
        fibers = require('fibers');
    }
    catch (err) {
        // ignore
    }

    let instanceConfigs = [];
    let htmlHeaderTags = [];


    /*
     * 📦 Load grunt plugins
     */

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-zopfli');

    // HTML
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    // JavaScript
    grunt.loadNpmTasks('grunt-webpack');

    // SCSS
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-postcss');

    // Assets
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Watch
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-contrib-watch');


    /*
     * 🧙 Initialize grunt config
     */

    grunt.initConfig({
        pkg,

        clean: {
            all: ['./dest/*'],
            tmp: ['./dest/worker.config.json', './dest/*/app.config.json']
        }
    });


    /*
     * 🔧 Build App Configuration JSON
     */
    grunt.registerTask('buildConfiguration', function () {
        const done = this.async();
        const fs = require('fs');
        const only = (grunt.option('only') || '').split(',').filter(l => l);

        const builderPath = path.resolve('./src/scripts/configurationBuilder.cjs');
        const ConfigurationBuilder = require(builderPath);

        if (!fs.existsSync('./dest')) {
            fs.mkdirSync('./dest');
        }

        Promise.all([
            new ConfigurationBuilder({grunt, pkg, config: globalConfig}).app().then(content => {
                instanceConfigs = {};

                Object.entries(content).forEach(([name, content]) => {
                    if (only.length && only.indexOf(name) === -1) {
                        return;
                    }

                    const folderPath = path.resolve(`./dest/${name}`);
                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath);
                    }

                    const configPath = path.join(folderPath, 'app.config.json');
                    fs.writeFileSync(configPath, JSON.stringify(content, null, '  '));

                    instanceConfigs[name] = content;
                });
            }),
            new ConfigurationBuilder({grunt, pkg, config: globalConfig}).worker().then(content => {
                const configPath = path.join('./dest/worker.config.json');
                fs.writeFileSync(configPath, JSON.stringify(content, null, '  '));
            })
        ]).then(() => done()).catch(err => {
            console.log(err);
            done(err);
        });
    });


    /*
     * ✳️ Build App Favicons
     */
    grunt.registerTask('buildFavicons', function () {
        const done = this.async();

        const favicons = require('favicons');
        const fs = require('fs');

        const iconConfig = Object.assign({}, globalConfig.favicons, {
            version: pkg.version,
            path: '/favicons/'
        });

        favicons([
            path.resolve('./src/img/favicon.s.png'),
            path.resolve('./src/img/favicon.m.png'),
            path.resolve('./src/img/favicon.l.png')
        ], iconConfig, (error, response) => {
            if (error) {
                return done(error);
            }

            const imagePath = path.resolve('./dest/favicons');
            if (!fs.existsSync(imagePath)) {
                fs.mkdirSync(imagePath);
            }

            response.images.forEach(img => {
                fs.writeFileSync(path.join(imagePath, img.name), img.contents);
            });

            response.files.forEach(file => {
                if (file.name === 'browserconfig.xml' || file.name === 'yandex-browser-manifest.json') {
                    fs.writeFileSync('./dest/' + file.name, file.contents);
                }

                Object.entries(instanceConfigs).forEach(([language, config]) => {
                    if (file.name === 'browserconfig.xml' || file.name === 'yandex-browser-manifest.json') {
                        // do nothing
                    }
                    else if (file.name === 'manifest.json') {
                        const manifest = JSON.parse(file.contents);
                        manifest.name = config.strings['app.name'];
                        manifest.short_name = config.strings['app.shortName'];
                        manifest.description = config.strings['app.description'];
                        manifest.lang = language;

                        if (manifest.start_url.substr(0, 1) === '/') {
                            manifest.start_url = '/' + language + manifest.start_url;
                        }

                        fs.writeFileSync(`./dest/${language}/${file.name}`, JSON.stringify(manifest, null, '  '));
                    }
                    else if (file.name === 'manifest.webapp') {
                        const manifest = JSON.parse(file.contents);
                        manifest.name = config.strings['app.name'];
                        manifest.description = config.strings['app.description'];
                        manifest.developer.name = config.strings['app.developerName'];
                        manifest.developer.url = config.strings['app.developerUrl'];
                        fs.writeFileSync(`./dest/${language}/${file.name}`, JSON.stringify(manifest, null, '  '));
                    }
                    else {
                        throw new Error(`Unable to generate file "${file.name}": file is unsupported.`);
                    }
                });
            });

            htmlHeaderTags = response.html;
            done();
        });
    });


    /*
     * 🌁 All about HTML
     */
    grunt.registerTask('prepareHTML', function () {
        if (!Object.keys(instanceConfigs).length) {
            console.log('🚨 Run grunt buildConfiguration buildFavicons before!');
            process.exit(1);
        }

        Object.entries(instanceConfigs).forEach(([language, config]) => {
            grunt.config.merge({
                template: {
                    [language]: {
                        options: {
                            data: () => ({
                                language,
                                notFoundHeadline: config.strings['notFound.headline'],
                                notFoundMessage: config.strings['notFound.message'],
                                appName: config.strings['app.name'],
                                appDescription: config.strings['app.description'],
                                metaTags: htmlHeaderTags
                                    .join('\n')
                                    .replace('"/favicons/manifest.', `"/${language}/manifest.`)
                                    .replace('"/favicons/yandex-browser-manifest.json', '"/yandex-browser-manifest.json')
                                    .replace('"/favicons/browserconfig.xml', '"/browserconfig.xml')
                            })
                        },
                        files: [
                            {
                                expand: true,
                                cwd: './src/html/',
                                src: ['*.html'],
                                dest: `./dest/${language}/`
                            }
                        ]
                    }
                },
                htmlmin: {
                    options: {
                        removeComments: true,
                        removeCommentsFromCDATA: true,
                        removeCDATASectionsFromCDATA: true,
                        collapseWhitespace: true,
                        removeRedundantAttributes: true,
                        removeIgnored: true
                    },
                    [language]: {
                        files: [
                            {
                                expand: true,
                                cwd: `./dest/${language}/`,
                                src: ['index.html'],
                                dest: `./dest/${language}/`
                            }
                        ]
                    }
                }
            });
        });
    });


    /*
     * 🖌 All about (S)CSS
     */
    grunt.config.merge({
        sass: {
            app: {
                options: {
                    sourceMap: './dest/style.css.map',
                    implementation: require('node-sass'),
                    fiber: fibers,
                    includePaths: ['./dest']
                },
                files: [
                    {
                        dest: './dest/style.css',
                        src: ['./src/scss/app.scss']
                    }
                ]
            }
        },
        postcss: {
            app: {
                options: {
                    map: {
                        inline: false,
                        annotation: './dest/'
                    },
                    processors: [
                        require('pixrem')(),
                        require('autoprefixer')(),
                        require('cssnano')()
                    ]
                },
                files: [
                    {
                        dest: './dest/style.css',
                        src: './dest/style.css'
                    }
                ]
            }
        }
    });


    /*
     * ⚙️ All about JavaScript
     */
    grunt.registerTask('prepareJS', function () {
        const webpack = require('webpack');

        /* Application */
        {
            const webpackConfig = {
                mode: grunt.option('develop') ? 'development' : 'production',
                entry: {
                    ['app']: `${__dirname}/src/js/app.js`
                },
                devtool: 'source-map',
                cache: !grunt.option('develop'),
                output: {
                    path: `${__dirname}/dest`,
                    filename: '[name].js',
                    sourceMapFilename: '[name].js.map',
                    devtoolModuleFilenameTemplate: '[resource-path]'
                },
                module: {
                    rules: [
                        {
                            test: /(\.jsx|\.js)$/,
                            use: {
                                loader: 'babel-loader',
                                options: {
                                    presets: ['@babel/preset-env']
                                }
                            },
                            exclude: []
                        },
                        {
                            test: /(\.jsx|\.js)$/,
                            loader: 'eslint-loader',
                            exclude: [/node_modules/, /zepto\.js/],
                            options: grunt.option('develop') ? {
                                rules: {
                                    'no-console': 'warn'
                                }
                            } : {}
                        },
                        {
                            test: /\.(html)$/,
                            loader: 'html-loader',
                            options: {
                                minimize: {
                                    conservativeCollapse: false
                                }
                            }
                        },
                        {
                            test: /\.svg$/,
                            loader: 'svg-inline-loader'
                        }
                    ]
                },
                node: {
                    global: false
                },
                performance: {
                    hints: false
                },
                plugins: [
                    new webpack.DefinePlugin({
                        global: 'window'
                    }),
                    new webpack.NormalModuleReplacementPlugin(
                        /^jquery/,
                        __dirname + '/dest/zepto'
                    ),
                    new webpack.NormalModuleReplacementPlugin(
                        /^zepto/,
                        __dirname + '/dest/zepto'
                    ),
                    new webpack.NormalModuleReplacementPlugin(
                        /^tinybind/,
                        'rivets'
                    )
                ],
                resolve: {
                    modules: [
                        path.resolve('./src/js'),
                        path.resolve('./node_modules')
                    ],
                    extensions: ['.js']
                }
            };

            // Bundle Analyzer
            if (grunt.option('analyze')) {
                const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
                webpackConfig.plugins.push(new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: 'app.report.html',
                    openAnalyzer: false,
                    generateStatsFile: false
                }));
            }

            // Sentry
            if (
                process.env.SENTRY_ORG &&
                process.env.SENTRY_AUTH_TOKEN &&
                process.env.SENTRY_PROJECT
            ) {
                const SentryCliPlugin = require('@sentry/webpack-plugin');

                webpackConfig.plugins.push(new SentryCliPlugin({
                    release: pkg.version,
                    include: ['./dest'],
                    urlPrefix: '~/',
                    ignore: ['node_modules'],
                    validate: true
                }));
            }

            // Notifier
            if (grunt.option('notifier')) {
                const WebpackBuildNotifierPlugin = require('webpack-build-notifier');

                webpackConfig.plugins.push(
                    new WebpackBuildNotifierPlugin({
                        title: pkg.name,
                        suppressSuccess: 'initial',
                        successSound: false
                    })
                );
            }

            grunt.config.merge({
                webpack: {
                    ['app']: webpackConfig
                }
            });
        }

        /* i18n packs */
        Object.entries(instanceConfigs).forEach(([language, config]) => {
            const webpackConfig = {
                mode: grunt.option('develop') ? 'development' : 'production',
                entry: {
                    ['app.config']: `${__dirname}/src/js/app.config.js`
                },
                devtool: 'source-map',
                cache: !grunt.option('develop'),
                output: {
                    path: `${__dirname}/dest/${language}`,
                    filename: '[name].js',
                    sourceMapFilename: '[name].js.map',
                    devtoolModuleFilenameTemplate: '[resource-path]'
                },
                plugins: [
                    new webpack.NormalModuleReplacementPlugin(
                        /^app-config/,
                        `../../dest/${language}/app.config.json`
                    ),
                    new webpack.DefinePlugin({
                        global: 'window'
                    })
                ]
            };

            // Bundle Analyzer
            if (grunt.option('analyze')) {
                const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
                webpackConfig.plugins.push(new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: 'app.config.report.html',
                    openAnalyzer: false,
                    generateStatsFile: false
                }));
            }

            // Notifier
            if (grunt.option('notifier')) {
                const WebpackBuildNotifierPlugin = require('webpack-build-notifier');

                webpackConfig.plugins.push(
                    new WebpackBuildNotifierPlugin({
                        title: pkg.name,
                        suppressSuccess: 'initial',
                        successSound: false
                    })
                );
            }

            grunt.config.merge({
                webpack: {
                    [language]: webpackConfig
                }
            });
        });

        /* Service Worker */
        {
            const webpackConfig = {
                mode: grunt.option('develop') ? 'development' : 'production',
                entry: {
                    ['serviceworker']: `${__dirname}/src/js/serviceworker.js`
                },
                devtool: 'source-map',
                cache: !grunt.option('develop'),
                output: {
                    path: `${__dirname}/dest`,
                    filename: '[name].js',
                    sourceMapFilename: '[name].js.map',
                    devtoolModuleFilenameTemplate: '[resource-path]'
                },
                module: {
                    rules: [
                        {
                            test: /(\.jsx|\.js)$/,
                            use: {
                                loader: 'babel-loader',
                                options: {
                                    presets: ['@babel/preset-env']
                                }
                            },
                            exclude: []
                        },
                        {
                            test: /(\.jsx|\.js)$/,
                            loader: 'eslint-loader',
                            exclude: [/node_modules/],
                            options: grunt.option('develop') ? {
                                rules: {
                                    'no-console': 'warn'
                                }
                            } : {}
                        }
                    ]
                },
                node: {
                    global: false
                },
                plugins: [
                    new webpack.DefinePlugin({
                        global: 'self'
                    }),
                    new webpack.NormalModuleReplacementPlugin(
                        /^worker-config/,
                        '../../dest/worker.config.json'
                    ),
                    new webpack.IgnorePlugin(/^jquery/)
                ],
                resolve: {
                    modules: [
                        path.resolve('./src/js'),
                        path.resolve('./node_modules')
                    ],
                    extensions: ['.js']
                }
            };

            // Bundle Analyzer
            if (grunt.option('analyze')) {
                const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
                webpackConfig.plugins.push(new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: 'worker.report.html',
                    openAnalyzer: false,
                    generateStatsFile: false
                }));
            }

            // Sentry
            if (
                process.env.SENTRY_ORG &&
                process.env.SENTRY_AUTH_TOKEN &&
                process.env.SENTRY_PROJECT
            ) {
                const SentryCliPlugin = require('@sentry/webpack-plugin');

                webpackConfig.plugins.push(new SentryCliPlugin({
                    release: pkg.version,
                    include: ['./dest'],
                    urlPrefix: '~/',
                    ignore: ['node_modules'],
                    validate: true
                }));
            }

            // Notifier
            if (grunt.option('notifier')) {
                const WebpackBuildNotifierPlugin = require('webpack-build-notifier');

                webpackConfig.plugins.push(
                    new WebpackBuildNotifierPlugin({
                        title: pkg.name,
                        suppressSuccess: 'initial',
                        successSound: false
                    })
                );
            }

            grunt.config.merge({
                webpack: {
                    ['serviceworker']: webpackConfig
                }
            });
        }

        /* Web Worker */
        {
            const webpackConfig = {
                mode: grunt.option('develop') ? 'development' : 'production',
                entry: {
                    ['webworker']: `${__dirname}/src/js/webworker.js`
                },
                devtool: 'source-map',
                cache: !grunt.option('develop'),
                output: {
                    path: `${__dirname}/dest`,
                    filename: '[name].js',
                    sourceMapFilename: '[name].js.map',
                    devtoolModuleFilenameTemplate: '[resource-path]'
                },
                module: {
                    rules: [
                        {
                            test: /(\.jsx|\.js)$/,
                            use: {
                                loader: 'babel-loader',
                                options: {
                                    presets: ['@babel/preset-env']
                                }
                            },
                            exclude: []
                        },
                        {
                            test: /(\.jsx|\.js)$/,
                            loader: 'eslint-loader',
                            exclude: [/node_modules/],
                            options: grunt.option('develop') ? {
                                rules: {
                                    'no-console': 'warn'
                                }
                            } : {}
                        }
                    ]
                },
                node: {
                    global: false
                },
                plugins: [
                    new webpack.DefinePlugin({
                        global: 'self'
                    }),
                    new webpack.NormalModuleReplacementPlugin(
                        /^worker-config/,
                        '../../dest/worker.config.json'
                    ),
                    new webpack.IgnorePlugin(/^jquery/)
                ],
                resolve: {
                    modules: [
                        path.resolve('./src/js'),
                        path.resolve('./node_modules')
                    ],
                    extensions: ['.js']
                }
            };

            // Bundle Analyzer
            if (grunt.option('analyze')) {
                const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
                webpackConfig.plugins.push(new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    reportFilename: 'worker.report.html',
                    openAnalyzer: false,
                    generateStatsFile: false
                }));
            }

            // Sentry
            if (
                process.env.SENTRY_ORG &&
                process.env.SENTRY_AUTH_TOKEN &&
                process.env.SENTRY_PROJECT
            ) {
                const SentryCliPlugin = require('@sentry/webpack-plugin');

                webpackConfig.plugins.push(new SentryCliPlugin({
                    release: pkg.version,
                    include: ['./dest'],
                    urlPrefix: '~/',
                    ignore: ['node_modules'],
                    validate: true
                }));
            }

            // Notifier
            if (grunt.option('notifier')) {
                const WebpackBuildNotifierPlugin = require('webpack-build-notifier');

                webpackConfig.plugins.push(
                    new WebpackBuildNotifierPlugin({
                        title: pkg.name,
                        suppressSuccess: 'initial',
                        successSound: false
                    })
                );
            }

            grunt.config.merge({
                webpack: {
                    ['webworker']: webpackConfig
                }
            });
        }
    });
    grunt.registerTask('generateZeptoBuild', function () {
        const done = this.async();
        const {spawn} = require('child_process');

        const script = spawn('./src/scripts/generate-zepto-custom-build.sh', [], {
            cwd: __dirname,
            env: process.env
        });

        script.on('exit', code => {
            done(code === 0);
        });
        script.on('error', err => {
            grunt.log.error(err);
        });

        script.stderr.on('data', data => {
            grunt.log.error(data.toString());
        });
        script.stdout.on('data', data => {
            grunt.log.write(data.toString());
        });
    });


    /*
     * 🌆 All about the icon
     */
    grunt.config.merge({
        copy: {
            fonts: {
                files: [
                    {
                        src: './src/img/icon.svg',
                        dest: './dest/icon.svg'
                    }
                ]
            }
        }
    });

    /*
     * 📜 All about fonts
     */
    grunt.config.merge({
        copy: {
            icon: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: [
                            './src/fonts/*'
                        ],
                        dest: './dest/fonts/',
                        filter: 'isFile'
                    }
                ]
            }
        }
    });


    /*
     * 🗜 Configure brotli and gzip
     */
    grunt.config.merge({
        compress: {
            ['brotli']: {
                options: {
                    mode: 'brotli',
                    brotli: {
                        mode: 1
                    }
                },
                files: [
                    {
                        expand: true,
                        cwd: './dest/',
                        src: [
                            '**/*.html',
                            '**/*.js',
                            '**/*.css',
                            '**/*.json',
                            '**/*.webapp',
                            '**/*.xml'
                        ],
                        dest: './dest/',
                        rename: (dest, src) => dest + src + '.br'
                    }
                ]
            }
        },
        zopfli: {
            app: {
                files: [
                    {
                        expand: true,
                        cwd: './dest/',
                        src: [
                            '**/*.html',
                            '**/*.js',
                            '**/*.css',
                            '**/*.json',
                            '**/*.webapp',
                            '**/*.xml'
                        ],
                        dest: './dest/',
                        rename: (dest, src) => dest + src + '.gz'
                    }
                ]
            }
        }
    });


    /*
     * 👀 Debug Tools / Watcher
     */
    grunt.config.merge({
        browserSync: {
            options: {
                port: grunt.option('port') || process.env.PORT || 3000,
                reloadDebounce: 500,
                reloadOnRestart: true,
                open: false,
                watchTask: true,
                notify: false,
                ghostMode: {
                    clicks: !!grunt.option('ghost'),
                    forms: !!grunt.option('ghost'),
                    scroll: !!grunt.option('ghost')
                },
                proxy: {
                    target: 'http://localhost:8080',
                    ws: true
                },
                serveStatic: ['dest'],
                startPath: '/en-US/'
            },
            app: {
                src: [
                    './dest/style.css',
                    './dest/index.html',
                    './dest/app.js'
                ]
            }
        },
        watch: {
            options: {
                spawn: false,
                debounceDelay: 500
            },
            html: {
                files: ['src/html/*.html'],
                tasks: ['build:html']
            },
            js: {
                files: [
                    'src/js/**',
                    'src/templates/**',
                    '.babelrc',
                    '.browserslistrc',
                    '.eslintignore',
                    '.eslintrc.json'
                ],
                tasks: ['build:js']
            },
            css: {
                files: [
                    'src/scss/**'
                ],
                tasks: ['build:css']
            },
            strings: {
                files: [
                    'src/i18n/*.json'
                ],
                tasks: ['development']
            }
        }
    });


    grunt.registerTask('build:prepare', [
        'clean:all',
        'buildConfiguration',
        'buildFavicons',
        'generateZeptoBuild'
    ]);

    grunt.registerTask('build:html', [
        'prepareHTML',
        'template',
        'htmlmin'
    ]);

    grunt.registerTask('build:css', [
        'sass',
        'postcss'
    ]);

    grunt.registerTask('build:js', [
        'prepareJS',
        'webpack'
    ]);

    grunt.registerTask('build:assets', [
        'copy:fonts',
        'copy:icon'
    ]);


    grunt.registerTask('development', [
        'build:prepare',
        'build:html',
        'build:js',
        'build:css',
        'build:assets'
    ]);
    grunt.registerTask('production', [
        'build:prepare',
        'build:html',
        'build:js',
        'build:css',
        'build:assets',
        'compress',
        'zopfli',
        'clean:tmp'
    ]);

    grunt.registerTask('favicons', []);
    grunt.registerTask('develop', ['development', 'browserSync', 'watch']);
    grunt.registerTask('default', ['production']);
};
