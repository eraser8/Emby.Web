define(['loading', 'scrollHelper', 'focusManager', 'connectionManager', 'startup/startuphelper', 'coreIcons'], function (loading, scrollHelper, focusManager, connectionManager, startupHelper) {

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function renderSelectServerItems(view, servers, initScroller) {

        var items = servers.map(function (server) {

            return {
                name: server.Name,
                showIcon: true,
                icon: 'cast',
                cardType: '',
                id: server.Id,
                server: server
            };

        });

        items.push({
            name: Globalize.translate('core#ButtonNewServer'),
            showIcon: true,
            showImage: false,
            icon: 'add',
            cardImageStyle: '',
            id: 'changeserver',
            cardType: 'changeserver',
            url: '/startup/manualserver.html'
        });

        items.push({
            name: Globalize.translate('core#EmbyConnect'),
            showIcon: true,
            showImage: false,
            icon: 'cloud',
            cardImageStyle: '',
            cardType: 'embyconnect',
            defaultText: true,
            url: '/startup/connectlogin.html'
        });

        var html = items.map(function (item) {

            var cardImageContainer;

            if (item.showIcon) {
                cardImageContainer = '<iron-icon class="cardImageIcon" icon="' + item.icon + '"></iron-icon>';
            } else {
                cardImageContainer = '<div class="cardImage" style="' + item.cardImageStyle + '"></div>';
            }

            var tagName = 'paper-button';
            var innerOpening = '<div class="cardBox">';
            var innerClosing = '</div>';

            return '\
<' + tagName + ' raised class="card squareCard loginSquareCard scalableCard" data-id="' + item.id + '" data-url="' + (item.url || '') + '" data-cardtype="' + item.cardType + '">\
'+ innerOpening + '<div class="cardScalable">\
<div class="cardPadder"></div>\
<div class="cardContent">\
<div class="cardImageContainer coveredImage defaultCardColor' + getRandomInt(1, 5) + '">\
'+ cardImageContainer + '</div>\
</div>\
</div>\
<div class="cardFooter">\
<div class="cardText">'+ item.name + '</div>\
</div>'+ innerClosing + '\
</'+ tagName + '>';

        }).join('');

        var itemsContainer = view.querySelector('.servers');
        itemsContainer.innerHTML = html;

        loading.hide();

        if (initScroller) {
            scrollHelper.centerFocus.on(itemsContainer, true);
        }

        focusManager.autoFocus(itemsContainer);
    }

    return function (view, params) {

        var self = this;

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;
            var servers = [];

            Emby.Page.setTitle(null);
            Emby.Backdrop.clear();

            if (!isRestored) {
                loading.show();

                connectionManager.getAvailableServers().then(function (result) {

                    servers = result;
                    renderSelectServerItems(view, result, !isRestored);
                    view.querySelector('.pageHeader').classList.remove('hide');

                }, function (result) {

                    servers = [];
                    renderSelectServerItems(view, [], !isRestored);
                    view.querySelector('.pageHeader').classList.remove('hide');
                });

                view.querySelector('.servers').addEventListener('click', function (e) {

                    startupHelper.onScrollSliderClick(e, function (card) {

                        var url = card.getAttribute('data-url');

                        if (url) {
                            Emby.Page.show(url);
                        } else {

                            loading.show();

                            var id = card.getAttribute('data-id');
                            var server = servers.filter(function (s) {
                                return s.Id == id;
                            })[0];

                            connectionManager.connectToServer(server).then(function (result) {

                                loading.hide();
                                startupHelper.handleConnectionResult(result, view);
                            });
                        }
                    });
                });
            }
        });
    }

});