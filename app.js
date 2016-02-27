(function (globalScope) {

    var connectionManager;

    function defineRoute(newRoute, dictionary) {

        var baseRoute = Emby.Page.baseUrl();

        var path = newRoute.path;

        path = path.replace(baseRoute, '');

        console.log('Defining route: ' + path);

        newRoute.dictionary = newRoute.dictionary || dictionary || 'core';
        Emby.Page.addRoute(path, newRoute);
    }

    function defineCoreRoutes() {

        console.log('Defining core routes');

        var baseRoute = window.location.pathname.replace('/index.html', '');
        if (baseRoute.lastIndexOf('/') == baseRoute.length - 1) {
            baseRoute = baseRoute.substring(0, baseRoute.length - 1);
        }

        console.log('Setting page base to ' + baseRoute);

        page.base(baseRoute);

        var startupRoot = '/startup/';

        defineRoute({
            path: startupRoot + 'login.html',
            transition: 'slide',
            controller: 'startup/login'
        });

        defineRoute({
            path: startupRoot + 'manuallogin.html',
            transition: 'slide',
            controller: 'startup/manuallogin',
            dependencies: ['paper-input']
        });

        defineRoute({
            path: startupRoot + 'localpin.html',
            transition: 'slide',
            controller: 'startup/localpin'
        });

        defineRoute({
            path: startupRoot + 'welcome.html',
            transition: 'slide',
            controller: 'startup/welcome'
        });

        defineRoute({
            path: startupRoot + 'connectlogin.html',
            transition: 'slide',
            controller: 'startup/connectlogin'
        });

        defineRoute({
            path: startupRoot + 'manualserver.html',
            transition: 'slide',
            controller: 'startup/manualserver',
            dependencies: ['paper-input']
        });

        defineRoute({
            path: startupRoot + 'selectserver.html',
            transition: 'slide',
            controller: 'startup/selectserver'
        });

        defineRoute({
            path: '/settings/settings.html',
            transition: 'slide',
            dependencies: ['css!settings/settings.css'],
            controller: 'settings/settings'
        });

        defineRoute({
            path: '/settings/playback.html',
            transition: 'slide',
            dependencies: ['emby-dropdown-menu'],
            controller: 'settings/playback',
            type: 'settings',
            title: 'General',
            category: 'Playback',
            thumbImage: '',
            order: -1
        });

        defineRoute({
            path: '/settings/display.html',
            transition: 'slide',
            dependencies: ['emby-dropdown-menu'],
            controller: 'settings/display',
            type: 'settings',
            title: 'General',
            category: 'Display',
            thumbImage: '',
            order: -1
        });

        defineRoute({
            path: '/settings/sounds.html',
            transition: 'slide',
            dependencies: ['emby-dropdown-menu'],
            controller: 'settings/sounds',
            type: 'settings',
            title: 'Sounds',
            category: 'General',
            thumbImage: ''
        });

        defineRoute({
            path: '/settings/plugins.html',
            transition: 'slide',
            dependencies: ['emby-dropdown-menu', 'coreIcons'],
            controller: 'settings/plugins',
            type: 'settings',
            title: 'Installed Plugins',
            category: 'Plugins',
            thumbImage: ''
        });

        defineRoute({
            path: '/settings/catalog.html',
            transition: 'slide',
            dependencies: ['emby-dropdown-menu'],
            controller: 'settings/catalog',
            type: 'settings',
            title: 'Plugin Catalog',
            category: 'Plugins',
            thumbImage: ''
        });

        defineRoute({
            path: '/index.html',
            isDefaultRoute: true,
            transition: 'slide',
            dependencies: []
        });

        defineRoute({
            path: '/',
            isDefaultRoute: true,
            transition: 'slide',
            dependencies: []
        });
    }

    function getCapabilities(apphost) {

        var caps = apphost.capabilities();

        // Full list
        // https://github.com/MediaBrowser/MediaBrowser/blob/master/MediaBrowser.Model/Session/GeneralCommand.cs
        caps.SupportedCommands = [
            "GoHome",
            "GoToSettings",
            "VolumeUp",
            "VolumeDown",
            "Mute",
            "Unmute",
            "ToggleMute",
            "SetVolume",
            "SetAudioStreamIndex",
            "SetSubtitleStreamIndex",
            "DisplayContent",
            "GoToSearch",
            "DisplayMessage"
        ];

        caps.SupportsMediaControl = true;
        caps.SupportedLiveMediaTypes = caps.PlayableMediaTypes;

        return caps;
    }

    function defineConnectionManager(connectionManager) {
        define('connectionManager', [], function () {
            return connectionManager;
        });
    }

    function createConnectionManager() {

        return new Promise(function (resolve, reject) {

            require(['apphost', 'credentialprovider', 'events'], function (apphost, credentialProvider, events) {
                var credentialProviderInstance = new credentialProvider();

                if (window.location.href.indexOf('clear=1') != -1) {
                    credentialProviderInstance.clear();
                }

                apphost.appInfo().then(function (appInfo) {

                    connectionManager = new MediaBrowser.ConnectionManager(credentialProviderInstance, appInfo.appName, appInfo.appVersion, appInfo.deviceName, appInfo.deviceId, getCapabilities(apphost), window.devicePixelRatio);

                    defineConnectionManager(connectionManager);
                    bindConnectionManagerEvents(connectionManager, events);
                    resolve();
                });
            });
        });
    }

    var localApiClient;

    function bindConnectionManagerEvents(connectionManager, events) {

        connectionManager.currentLoggedInServer = function () {
            var server = localApiClient ? localApiClient.serverInfo() : null;

            if (server) {
                if (server.UserId && server.AccessToken) {
                    return server;
                }
            }

            return null;
        };

        connectionManager.currentApiClient = function () {

            if (!localApiClient) {
                var server = connectionManager.getLastUsedServer();
                localApiClient = connectionManager.getApiClient(server.Id);
            }
            return localApiClient;
        };

        events.on(connectionManager, 'apiclientcreated', function (e, newApiClient) {

            //$(newApiClient).on("websocketmessage", Dashboard.onWebSocketMessageReceived).on('requestfail', Dashboard.onRequestFail);
        });

        events.on(connectionManager, 'localusersignedin', function (e, user) {

            localApiClient = connectionManager.getApiClient(user.ServerId);

            document.dispatchEvent(new CustomEvent("usersignedin", {
                detail: {
                    user: user,
                    apiClient: localApiClient
                }
            }));
        });

        events.on(connectionManager, 'localusersignedout', function (e) {

            document.dispatchEvent(new CustomEvent("usersignedout", {}));
        });

    }

    function returnFirstDependency(obj) {
        return obj;
    }

    function initRequire(customPaths) {

        console.log('Initializing requirejs');

        var bowerPath = "bower_components";
        var embyWebComponentsBowerPath = bowerPath + '/emby-webcomponents';

        var paths = {
            itemShortcuts: "components/shortcuts",
            soundeffects: "components/soundeffects",
            apphost: customPaths.apphost || "components/apphost",
            shell: customPaths.shell || "components/shell",
            filesystem: customPaths.filesystem || "components/filesystem",
            registrationservices: "components/registrationservices/registrationservices",
            screensaverManager: "components/screensavermanager",
            viewManager: "components/viewmanager",
            slyScroller: "components/sly/slyscroller",
            appSettings: "components/appsettings",
            userSettings: "components/usersettings",
            focusManager: embyWebComponentsBowerPath + "/focusmanager",
            tvguide: "components/tvguide/guide",
            playmenu: "components/playmenu",
            datetime: embyWebComponentsBowerPath + "/datetime",
            globalize: "components/globalize",
            inputManager: "components/inputmanager",
            userdataButtons: "components/userdatabuttons/userdatabuttons",
            browserdeviceprofile: embyWebComponentsBowerPath + "/browserdeviceprofile",
            browser: embyWebComponentsBowerPath + "/browser",
            qualityoptions: embyWebComponentsBowerPath + "/qualityoptions",
            visibleinviewport: embyWebComponentsBowerPath + "/visibleinviewport",
            performanceManager: embyWebComponentsBowerPath + "/performancemanager",
            layoutManager: embyWebComponentsBowerPath + "/layoutmanager",
            isMobile: "bower_components/isMobile/isMobile.min",
            howler: 'bower_components/howler.js/howler.min',
            screenfull: 'bower_components/screenfull/dist/screenfull',
            events: 'bower_components/emby-apiclient/events',
            pluginManager: 'components/pluginmanager',
            packageManager: 'components/packagemanager',
            themeManager: 'components/thememanager',
            itemHelper: 'components/itemhelper',
            mediaInfo: 'components/mediainfo/mediainfo',
            playbackManager: 'components/playbackmanager',
            credentialprovider: 'bower_components/emby-apiclient/credentials',
            apiclient: 'bower_components/emby-apiclient/apiclient',
            connectservice: 'bower_components/emby-apiclient/connectservice',
            serverdiscovery: customPaths.serverdiscovery || "bower_components/emby-apiclient/serverdiscovery",
            wakeonlan: customPaths.wakeonlan || "bower_components/emby-apiclient/wakeonlan",
            peoplecardbuilder: 'components/cards/peoplecardbuilder',
            chaptercardbuilder: 'components/cards/chaptercardbuilder',
            imageLoader: embyWebComponentsBowerPath + '/images/imagehelper',
            appStorage: 'bower_components/emby-apiclient/appstorage'
        };

        if (navigator.webkitPersistentStorage) {
            paths.imageFetcher = embyWebComponentsBowerPath + "/images/persistentimagefetcher";
        } else {
            paths.imageFetcher = embyWebComponentsBowerPath + "/images/basicimagefetcher";
        }

        paths.hlsjs = bowerPath + "/hls.js/dist/hls.min";
        paths.viewcontainer = 'components/viewcontainer';

        var urlArgs = "t=" + new Date().getTime();

        var sha1Path = bowerPath + "/cryptojslib/components/sha1-min";
        var md5Path = bowerPath + "/cryptojslib/components/md5-min";
        var shim = {};

        shim[sha1Path] = {
            deps: [bowerPath + "/cryptojslib/components/core-min"]
        };

        shim[md5Path] = {
            deps: [bowerPath + "/cryptojslib/components/core-min"]
        };

        var config = {

            waitSeconds: 0,
            urlArgs: urlArgs,

            paths: paths,
            map: {
                '*': {
                    'css': embyWebComponentsBowerPath + '/requirecss',
                    'html': embyWebComponentsBowerPath + '/requirehtml'
                }
            },
            shim: shim
        };

        var baseRoute = window.location.href.split('?')[0].replace('/index.html', '');
        // support hashbang
        baseRoute = baseRoute.split('#')[0];
        if (baseRoute.lastIndexOf('/') == baseRoute.length - 1) {
            baseRoute = baseRoute.substring(0, baseRoute.length - 1);
        }

        console.log('Setting require baseUrl to ' + baseRoute);

        config.baseUrl = baseRoute;

        requirejs.config(config);

        define("cryptojs-sha1", [sha1Path]);
        define("cryptojs-md5", [md5Path]);

        define("Sly", ["components/sly/sly"], returnFirstDependency);

        // alias
        define("appsettings", ['appSettings'], returnFirstDependency);

        // alias
        define("inputmanager", ['inputManager'], returnFirstDependency);

        // alias
        define("historyManager", [], function () {
            return Emby.Page;
        });

        define("loading", [embyWebComponentsBowerPath + "/loading/loading"], returnFirstDependency);
        define("toast", [embyWebComponentsBowerPath + "/toast/toast"], returnFirstDependency);

        define("paperdialoghelper", [embyWebComponentsBowerPath + "/paperdialoghelper/paperdialoghelper"], returnFirstDependency);
        define("slideshow", [embyWebComponentsBowerPath + "/slideshow/slideshow"], returnFirstDependency);
        define("actionsheet", [embyWebComponentsBowerPath + "/actionsheet/actionsheet"], returnFirstDependency);
        define("confirm", [embyWebComponentsBowerPath + "/confirm/confirm"], returnFirstDependency);
        define("alert", [embyWebComponentsBowerPath + "/alert/alert"], returnFirstDependency);

        define("alphapicker", ["components/alphapicker/alphapicker"], returnFirstDependency);
        define("indicators", ["components/indicators/indicators"], returnFirstDependency);

        define("dialog", ["components/dialog/dialog"], returnFirstDependency);
        define("backMenu", ["components/backmenu/backmenu"], returnFirstDependency);
        define("prompt", [embyWebComponentsBowerPath + "/prompt/prompt"], returnFirstDependency);

        define("paper-base", ["css!style/paperstyles.css"]);
        define("paper-spinner", ["html!" + bowerPath + "/paper-spinner/paper-spinner.html", 'paper-base']);
        define("paper-toast", ["html!" + bowerPath + "/paper-toast/paper-toast.html", 'paper-base']);
        define("paper-slider", ["html!" + bowerPath + "/paper-slider/paper-slider.html", 'paper-base']);
        define("paper-tabs", ["html!" + bowerPath + "/paper-tabs/paper-tabs.html", 'paper-base']);
        define("paper-menu", ["html!" + bowerPath + "/paper-menu/paper-menu.html", 'paper-base']);
        define("paper-dialog", ["html!" + bowerPath + "/paper-dialog/paper-dialog.html", 'paper-base']);
        define("paper-dialog-scrollable", ["html!" + bowerPath + "/paper-dialog-scrollable/paper-dialog-scrollable.html", 'paper-base']);
        define("paper-button", ["html!" + bowerPath + "/paper-button/paper-button.html", 'paper-base']);
        define("paper-icon-button", ["html!" + bowerPath + "/paper-icon-button/paper-icon-button.html", 'paper-base']);
        define("paper-drawer-panel", ["html!" + bowerPath + "/paper-drawer-panel/paper-drawer-panel.html", 'paper-base']);
        define("paper-radio-group", ["html!" + bowerPath + "/paper-radio-group/paper-radio-group.html", 'paper-base']);
        define("paper-radio-button", ["html!" + bowerPath + "/paper-radio-button/paper-radio-button.html", 'paper-base']);
        define("neon-animated-pages", ["html!" + bowerPath + "/neon-animation/neon-animated-pages.html", 'paper-base']);
        define("paper-toggle-button", ["html!" + bowerPath + "/paper-toggle-button/paper-toggle-button.html", 'paper-base']);

        define("slide-right-animation", ["html!" + bowerPath + "/neon-animation/animations/slide-right-animation.html"]);
        define("slide-left-animation", ["html!" + bowerPath + "/neon-animation/animations/slide-left-animation.html"]);
        define("slide-from-right-animation", ["html!" + bowerPath + "/neon-animation/animations/slide-from-right-animation.html"]);
        define("slide-from-left-animation", ["html!" + bowerPath + "/neon-animation/animations/slide-from-left-animation.html"]);
        define("paper-textarea", ["html!" + bowerPath + "/paper-input/paper-textarea.html", 'paper-base']);
        define("paper-item", ["html!" + bowerPath + "/paper-item/paper-item.html", 'paper-base']);
        define("paper-checkbox", ["html!" + bowerPath + "/paper-checkbox/paper-checkbox.html", 'paper-base']);
        define("fade-in-animation", ["html!" + bowerPath + "/neon-animation/animations/fade-in-animation.html"]);
        define("fade-out-animation", ["html!" + bowerPath + "/neon-animation/animations/fade-out-animation.html"]);
        define("scale-up-animation", ["html!" + bowerPath + "/neon-animation/animations/scale-up-animation.html"]);
        define("scale-down-animation", ["html!" + bowerPath + "/neon-animation/animations/scale-down-animation.html"]);
        define("paper-fab", ["html!" + bowerPath + "/paper-fab/paper-fab.html", 'paper-base']);
        define("paper-progress", ["html!" + bowerPath + "/paper-progress/paper-progress.html", 'paper-base']);
        define("paper-input", ["html!" + bowerPath + "/paper-input/paper-input.html", 'paper-base']);
        define("paper-icon-item", ["html!" + bowerPath + "/paper-item/paper-icon-item.html", 'paper-base']);
        define("paper-item-body", ["html!" + bowerPath + "/paper-item/paper-item-body.html", 'paper-base']);
        define("paper-menu-item", ["html!" + bowerPath + "/paper-menu/paper-menu-item.html", 'paper-base']);
        define("paper-dropdown-menu", ["html!" + bowerPath + "/paper-dropdown-menu/paper-dropdown-menu.html", 'paper-base']);
        define("emby-dropdown-menu", ["html!" + bowerPath + "/emby-dropdown-menu/emby-dropdown-menu.html", 'paper-base']);
        define("paper-listbox", ["html!" + bowerPath + "/paper-listbox/paper-listbox.html", 'paper-base']);
        define("iron-icon-set", ["html!" + bowerPath + "/iron-icon/iron-icon.html", "html!" + bowerPath + "/iron-iconset-svg/iron-iconset-svg.html"]);
        define("coreIcons", ["html!components/icons.html", 'iron-icon-set']);

        define("robotoFont", ['css!fonts/roboto/style']);
        define("opensansFont", ['css!fonts/opensans/style']);

        define('connectionManagerResolver', [], function () {
            return function () {
                return connectionManager;
            };
        });

        define('apiClientResolver', [], function () {
            return function () {
                return connectionManager.currentApiClient();
            };
        });

        define("swiper", [bowerPath + "/Swiper/dist/js/swiper.min", "css!" + bowerPath + "/Swiper/dist/css/swiper.min"], returnFirstDependency);

        define('dialogText', ['globalize'], getDialogText());
    }

    function getDialogText() {
        return function (globalize) {
            return {
                get: function (text) {
                    return globalize.translate('core#Button' + text);
                }
            };
        };
    }

    function loadApiClientDependencies(callback) {

        var list = [
           'bower_components/emby-apiclient/connectionmanager'
        ];

        require(list, function (connectionManagerExports) {

            globalScope.MediaBrowser = globalScope.MediaBrowser || {};
            for (var i in connectionManagerExports) {
                MediaBrowser[i] = connectionManagerExports[i];
            }
            callback();
        });
    }

    function loadCoreDependencies(callback) {

        console.log('Loading core dependencies');

        loadApiClientDependencies(function () {

            var list = [
             'bower_components/page.js/page.js',
             'components/router',
             'css!style/style.css',
             'js/backdrops'
            ];

            if (!('registerElement' in document && 'content' in document.createElement('template'))) {
                list.push("bower_components/webcomponentsjs/webcomponents-lite.min");
            }

            if (!globalScope.Promise) {
                list.push('bower_components/native-promise-only/lib/npo.src');
            }

            if (!globalScope.fetch) {
                list.push('bower_components/fetch/fetch');
            }

            require(list, function (pageJs, pageObjects) {

                globalScope.page = pageJs;
                globalScope.Emby.Page = pageObjects;
                globalScope.Emby.TransparencyLevel = pageObjects.TransparencyLevel;

                loadSecondLevelCoreDependencies(callback);
            });
        });
    }

    function loadSecondLevelCoreDependencies(callback) {

        var secondLevelDeps = [];

        secondLevelDeps.push('neon-animated-pages');

        // Second level dependencies that have to be loaded after the first set
        require(secondLevelDeps, callback);
    }

    function loadPlugins(externalPlugins) {

        console.log('Loading installed plugins');

        // Load installed plugins

        var list = [
        'plugins/defaulttheme/plugin',
        'plugins/logoscreensaver/plugin',
        'plugins/backdropscreensaver/plugin',
        'plugins/keyboard/plugin',
        'plugins/htmlvideoplayer/plugin',
        'plugins/htmlaudioplayer/plugin',
        'plugins/defaultsoundeffects/plugin'
        ];

        for (var i = 0, length = externalPlugins.length; i < length; i++) {
            list.push(externalPlugins[i]);
        }

        return new Promise(function (resolve, reject) {

            Promise.all(list.map(loadPlugin)).then(function () {

                require(['packageManager'], function (packageManager) {
                    packageManager.init().then(resolve, reject);
                });

            }, reject);
        });
    }

    function loadPlugin(url) {

        return new Promise(function (resolve, reject) {

            require(['pluginManager'], function (pluginManager) {
                pluginManager.loadPlugin(url).then(resolve, reject);
            });
        });
    }

    function loadDefaultTheme(callback) {

        require(['themeManager'], function (themeManager) {
            themeManager.loadTheme('defaulttheme', callback);
        });
    }

    function start() {

        var startInfo = globalScope.appStartInfo || {};

        initRequire(startInfo.paths || {});

        loadCoreDependencies(function () {

            defineCoreRoutes();

            createConnectionManager().then(function () {
                loadPlugins(startInfo.plugins || []).then(function () {

                    require(startInfo.scripts || [], loadPresentation);
                });
            });
        });
    }

    function loadGlobalizaton() {

        return new Promise(function (resolve, reject) {

            require(['globalize'], function (globalize, pluginManager) {

                globalScope.Globalize = globalize;

                resolve();
            });
        });
    }

    function loadPresentation() {

        loadGlobalizaton().then(function () {

            var presentationDependencies = [];

            presentationDependencies.push('layoutManager');
            presentationDependencies.push('events');
            presentationDependencies.push('js/models');
            presentationDependencies.push('js/soundeffectplayer');
            presentationDependencies.push('js/thememediaplayer');

            presentationDependencies.push('js/input/gamepad');
            presentationDependencies.push('js/input/mouse');
            presentationDependencies.push('js/input/onscreenkeyboard');
            presentationDependencies.push('js/input/keyboard');
            presentationDependencies.push('js/input/api');
            presentationDependencies.push('js/dom');

            presentationDependencies.push('components/controlbox');
            presentationDependencies.push('screensaverManager');

            require(presentationDependencies, function (layoutManager, events) {

                layoutManager.setFormFactor('tv');
                globalScope.Events = events;

                console.log('Loading presentation');

                // Start by loading the default theme. Once a user is logged in we can change the theme based on settings
                loadDefaultTheme(function () {

                    document.documentElement.classList.remove('preload');

                    Emby.Page.start();

                    document.dispatchEvent(new CustomEvent("appready", {}));

                    loadCoreDictionary();
                });
            });
        });
    }

    function loadCoreDictionary() {

        var baseUrl = Emby.Page.baseUrl() + '/strings/';

        var languages = ['en-US', 'de', 'fr', 'nl', 'pt-BR', 'pt-PT', 'ru', 'sv', 'zh-CN', 'zh-TW'];

        var translations = languages.map(function (i) {
            return {
                lang: i,
                path: baseUrl + i + '.json'
            };
        });

        Globalize.loadTranslations({
            name: 'core',
            translations: translations
        });
    }

    function logout() {

        require(['connectionManager', 'loading'], function (connectionManager, loading) {

            loading.show();

            connectionManager.logout().then(function () {
                Emby.Page.redirectToLogin();
            });
        });
    }

    if (!globalScope.Emby) {
        globalScope.Emby = {};
    }

    globalScope.Emby.App = {
        logout: logout,
        defineRoute: defineRoute
    };

    start();

})(this);