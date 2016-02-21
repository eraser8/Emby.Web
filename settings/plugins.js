define(['loading', 'packageManager', 'imageLoader', 'focusManager', 'slyScroller'], function (loading, packageManager, imageLoader, focusManager, slyScroller) {

    return function (view, params) {

        var self = this;
        var lastFocus = 0;

        function createVerticalScroller() {

            var scrollFrame = view.querySelector('.scrollFrame');

            var options = {
                horizontal: 0,
                itemNav: 0,
                mouseDragging: 1,
                touchDragging: 1,
                slidee: view.querySelector('.scrollSlider'),
                itemSelector: '.card',
                smart: true,
                scrollBy: 200,
                speed: 270,
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1,
                scrollWidth: 50000,
                immediateSpeed: 100
            };

            slyScroller.create(scrollFrame, options).then(function (slyFrame) {
                self.slyFrame = slyFrame;
                slyFrame.init();
                initFocusHandler(view.querySelector('.scrollSlider'), slyFrame);
            });
        }

        function initFocusHandler(parent, slyFrame) {

            parent.addEventListener('focus', function (e) {

                var focused = focusManager.focusableParent(e.target);

                if (focused) {

                    var now = new Date().getTime();

                    var animate = (now - lastFocus) > 50;
                    self.slyFrame.toCenter(focused, !animate);
                    lastFocus = now;
                }

            }, true);
        }

        view.addEventListener('viewbeforeshow', function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(Globalize.translate('Plugins'));

            if (!isRestored) {

                createVerticalScroller();
                renderPlugins();
            }
        });

        view.querySelector('.itemsContainer').addEventListener('click', function (e) {

            var card = Emby.Dom.parentWithClass(e.target, 'card');

            if (!card) {
                return;
            }

            var name = card.getAttribute('data-name');

            var menuItems = [];

            menuItems.push({
                name: Globalize.translate('core#Uninstall'),
                id: 'uninstall'
            });

            require(['actionsheet'], function (actionsheet) {

                actionsheet.show({
                    items: menuItems,
                    title: card.querySelector('.cardText').innerHTML
                }).then(function(id) {
                    switch (id) {
                        case 'uninstall':
                            uninstallPackage(name);
                            break;
                        default:
                            break;
                    }
                });

            });

        });

        function uninstallPackage(name) {

            loading.show();

            packageManager.uninstall(name).then(renderPlugins, function () {

                loading.hide();

                require(['alert'], function (alert) {

                    alert({

                        title: Globalize.translate('core#InstallationError'),
                        text: Globalize.translate('core#GenericErrorMessage')

                    });
                });
            });
        }

        view.querySelector('.btnInstall').addEventListener('click', function (e) {

            var menuItems = [];

            menuItems.push({
                name: Globalize.translate('core#InstallFromCatalog'),
                id: 'catalog'
            });

            menuItems.push({
                name: Globalize.translate('core#InstallFromUrl'),
                id: 'url'
            });

            require(['actionsheet'], function (actionsheet) {

                actionsheet.show({
                    items: menuItems,
                    title: Globalize.translate('core#InstallPlugin'),
                    callback: function (id) {

                        switch (id) {
                            case 'catalog':
                                Emby.Page.show('/settings/catalog.html');
                                break;
                            case 'url':
                                startInstallFromUrlWorkflow();
                                break;
                            default:
                                break;
                        }
                    }
                });

            });
        });

        function startInstallFromUrlWorkflow() {

            require(['prompt'], function (prompt) {

                prompt({

                    label: Globalize.translate('core#PluginUrl')

                }).then(installPluginFromUrl, renderPlugins);
            });
        }

        function installPluginFromUrl(url) {

            loading.show();

            packageManager.install(url).then(function (newPackage) {

                renderPlugins(newPackage.name);

            }, function () {

                loading.hide();

                require(['alert'], function (alert) {

                    alert({

                        title: Globalize.translate('core#InstallationError'),
                        text: Globalize.translate('core#GenericErrorMessage')
                    });
                });
            });
        }

        function renderPlugins(focusName) {

            loading.show();

            var list = packageManager.packages();

            list = list.sort(function (a, b) {

                var aName = a.displayName;
                var bName = b.displayName;

                if (aName > bName) {
                    return 1;
                }
                if (bName > aName) {
                    return -1;
                }

                return 0;
            });

            renderSortedPlugins(list, focusName);
        }

        function renderSortedPlugins(plugins, focusName) {

            view.querySelector('.itemsContainer').innerHTML = plugins.map(getPluginHtml).join('');
            imageLoader.lazyChildren(view);

            setTimeout(function () {

                if (focusName) {
                    var card = view.querySelector('.card[data-name=\'' + focusName + '\']');
                    if (card) {
                        focusManager.focus(card);
                    }
                }
                focusManager.autoFocus(view);
            }, 300);

            loading.hide();
        }

        function getPluginHtml(plugin) {

            var cardImageContainer;

            if (plugin.thumb) {
                cardImageContainer = '<div class="cardImage" style="background-image:url(\'' + packageManager.mapPath(plugin, plugin.thumb) + '\');"></div>';
            }
            else {

                cardImageContainer = '<iron-icon class="cardImageIcon" icon="settings"></iron-icon>';
            }

            var tagName = 'button';
            var innerOpening = '<div class="cardBox">';
            var innerClosing = '</div>';

            return '\
<' + tagName + ' raised class="card backdropCard scalableCard" data-name="' + plugin.name + '">\
'+ innerOpening + '<div class="cardScalable">\
<div class="cardPadder"></div>\
<div class="cardContent">\
<div class="cardImageContainer coveredImage defaultCardColor'+ getRandomInt(1, 5) + '">\
'+ cardImageContainer + '</div>\
</div>\
</div>\
<div class="cardFooter">\
<div class="cardText">' + plugin.displayName + '</div>\
<div class="cardText">' + plugin.version + '</div>\
</div>'+ innerClosing + '\
</'+ tagName + '>';
        }

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    }

});