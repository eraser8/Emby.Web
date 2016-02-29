define(['loading', 'apphost', 'imageLoader', 'focusManager', 'scrollHelper'], function (loading, apphost, imageLoader, focusManager, scrollHelper) {

    return function (view, params) {

        var self = this;
        var lastFocus = 0;

        function createVerticalScroller() {

            scrollHelper.centerFocus.on(view.querySelector('.hiddenScrollY'), false);
        }

        view.addEventListener('viewbeforeshow', function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(Globalize.translate('Settings'));

            loading.hide();

            if (!isRestored) {

                createVerticalScroller();
                view.querySelector('.appInfo').innerHTML = apphost.appName() + ' ' + apphost.appVersion();
                renderSettings();
            }
        });

        view.addEventListener('click', function (e) {

            var card = Emby.Dom.parentWithClass(e.target, 'card');

            if (card) {
                var path = card.getAttribute('data-path');

                Emby.Page.show(path);
            }
        });

        function renderSettings() {

            var routes = Emby.Page.getRoutes().filter(function (r) {
                return r.type == 'settings';
            });

            routes = routes.sort(function (a, b) {

                var aCategory = a.category || 'General';
                var bCategory = b.category || 'General';

                if (aCategory == 'General') {
                    aCategory = '0General';
                }

                if (bCategory == 'General') {
                    bCategory = '0General';
                }

                var aName = Globalize.translate('core#' + aCategory);
                var bName = Globalize.translate('core#' + bCategory);

                if (aName > bName) {
                    return 1;
                }
                if (bName > aName) {
                    return -1;
                }

                var aOrder = a.order || 0;
                var bOrder = b.order || 0;

                if (aOrder > bOrder) {
                    return 1;
                }
                if (bOrder > aOrder) {
                    return -1;
                }

                aName = (a.title);
                bName = (b.title);

                if (aName > bName) {
                    return 1;
                }
                if (bName > aName) {
                    return -1;
                }

                return 0;
            });

            renderRoutes(routes);
        }

        function renderRoutes(routes) {

            var html = '';
            var currentCategory = '';

            for (var i = 0, length = routes.length; i < length; i++) {

                var route = routes[i];
                var category = getCategoryTitle(route);

                if (category != currentCategory) {
                    if (currentCategory) {

                        // close the items container
                        html += '</div>';

                        // close the section
                        html += '</div>';
                    }

                    html += '<div class="verticalSection">';
                    html += '<h1>';
                    html += category;
                    html += '</h1>';
                    html += '<div class="itemsContainer verticalItemsContainer">';
                }

                currentCategory = category;

                html += getRouteHtml(route);
            }

            if (html) {
                // close the items container
                html += '</div>';

                // close the section
                html += '</div>';
            }

            view.querySelector('.dynamicRoutes').innerHTML = html;
            imageLoader.lazyChildren(view);

            setTimeout(function () {
                focusManager.autoFocus(view);
            }, 300);
        }

        function getRouteHtml(route) {

            var cardImageContainer;

            if (route.thumbImage) {
                cardImageContainer = '<div class="cardImage" style="background-image:url(\'' + route.thumbImage + '\');"></div>';
            }
            else {

                var icon = 'settings';

                if (route.category == 'Playback') {
                    icon = 'ondemand-video';
                } else if (route.category == 'Display') {
                    icon = 'view-list';
                }

                cardImageContainer = '<iron-icon class="cardImageIcon" icon="' + icon + '"></iron-icon>';
            }

            var tagName = 'button';
            var innerOpening = '<div class="cardBox">';
            var innerClosing = '</div>';

            return '\
<' + tagName + ' raised class="card backdropCard scalableCard" data-path="' + route.path + '">\
'+ innerOpening + '<div class="cardScalable">\
<div class="cardPadder"></div>\
<div class="cardContent">\
<div class="cardImageContainer coveredImage defaultCardColor'+ getRandomInt(1, 5) + '">\
'+ cardImageContainer + '</div>\
</div>\
</div>\
<div class="cardFooter">\
<div class="cardText">' + route.title + '</div>\
</div>'+ innerClosing + '\
</'+ tagName + '>';
        }

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function getCategoryTitle(route) {

            switch (route.category) {

                case 'General':
                    return Globalize.translate('core#General');
                case 'Playback':
                    return Globalize.translate('core#Playback');
                case 'Theme':
                    return Globalize.translate('core#Themes');
                case 'Display':
                    return Globalize.translate('core#Display');
                case 'Plugins':
                    return Globalize.translate('core#Plugins');
                default:
                    return Globalize.translate('core#Other');
            }

        }
    }

});