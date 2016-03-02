define(['userSettings', 'events', 'pluginManager', 'backdrop'], function (userSettings, events, pluginManager, backdrop) {

    var currentTheme;
    var currentThemeDependencies = [];

    function getCurrentTheme() {
        return currentTheme;
    }

    function loadTheme(id, callback) {

        var newTheme = pluginManager.plugins().filter(function (p) {
            return p.id == id;
        })[0];

        if (!newTheme) {
            newTheme = pluginManager.plugins().filter(function (p) {
                return p.id == 'defaulttheme';
            })[0];
        }

        var unloadPromise;

        if (currentTheme) {

            if (currentTheme.id == newTheme.id) {
                // Nothing to do, it's already the active theme
                callback(currentTheme);
                return;
            }
            unloadPromise = unloadTheme(currentTheme);
        } else {
            unloadPromise = Promise.resolve();
        }

        unloadPromise.then(function() {
            var deps = newTheme.getDependencies();

            require(deps, function () {

                currentThemeDependencies = deps;

                var translations = newTheme.getTranslations ? newTheme.getTranslations() : [];

                require(['globalize'], function (globalize) {
                    globalize.loadTranslations({

                        name: newTheme.id,
                        translations: translations

                    }).then(function () {
                        globalize.defaultModule(newTheme.id);

                        loadThemeHeader(newTheme, callback);
                    });
                });
            });
        });
    }

    function unloadTheme(theme) {

        backdrop.clear();

        console.log('Unloading theme: ' + theme.name);

        // TODO: unload css

        return theme.unload().then(function() {
            document.dispatchEvent(new CustomEvent("themeunload", {
                detail: {
                    name: theme.name
                }
            }));
        });
    }

    function loadThemeHeader(theme, callback) {

        getThemeHeader(theme).then(function (headerHtml) {

            document.querySelector('.themeHeader').innerHTML = headerHtml;

            //document.querySelector('.themeContent').innerHTML = theme.getPageContent();
            currentTheme = theme;
            theme.load();
            callback(theme);
        });
    }

    var cacheParam = new Date().getTime();

    function getThemeHeader(theme) {

        return new Promise(function (resolve, reject) {

            if (!theme.getHeaderTemplate) {
                resolve('');
                return;
            }

            var xhr = new XMLHttpRequest();

            var url = theme.getHeaderTemplate();
            url += url.indexOf('?') == -1 ? '?' : '&';
            url += 'v=' + cacheParam;

            xhr.open('GET', url, true);

            xhr.onload = function (e) {
                if (this.status < 400) {
                    resolve(this.response);
                } else {
                    resolve('');
                }
            };

            xhr.send();
        });
    }

    function loadUserTheme() {

        var theme = userSettings.get('theme') || 'defaulttheme';

        loadTheme(theme, function (theme) {

            Emby.Page.goHome();
        });
    }

    events.on(userSettings, 'change', function (e, name) {
        if (name == 'theme') {
            loadUserTheme();
        }
    });

    return {
        getCurrentTheme: getCurrentTheme,
        loadTheme: loadTheme,
        loadUserTheme: loadUserTheme
    };
});