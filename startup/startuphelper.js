define(['connectionManager', 'loading', 'themeManager', 'focusManager'], function (connectionManager, loading, themeManager, focusManager) {

    function signIntoConnect(view) {

        var username = view.querySelector('.txtConnectUserName').value;
        var password = view.querySelector('.txtConnectPassword').value;

        require(['alert'], function (alert) {

            loading.show();

            connectionManager.loginToConnect(username, password).then(function () {

                loading.hide();

                Emby.Page.show('/startup/selectserver.html');

            }, function () {

                loading.hide();

                alert({
                    text: Globalize.translate('core#MessageInvalidUser'),
                    title: Globalize.translate('core#HeaderLoginFailure')
                });

            });
        });
    }

    function onServerUserSignedIn(view) {

        var horizontalPageContent = view.querySelector('.pageContainer');
        zoomOut(horizontalPageContent, 1).onfinish = function () {
            themeManager.loadUserTheme();

        };
    }

    function handleConnectionResult(result, view) {

        switch (result.State) {

            case MediaBrowser.ConnectionState.SignedIn:
                {
                    onServerUserSignedIn(view);
                }
                break;
            case MediaBrowser.ConnectionState.ServerSignIn:
                {
                    loading.show();
                    result.ApiClient.getPublicUsers().then(function (users) {
                        loading.hide();

                        if (users.length) {

                            Emby.Page.show('/startup/login.html?serverid=' + result.Servers[0].Id);
                        } else {
                            Emby.Page.show('/startup/manuallogin.html?serverid=' + result.Servers[0].Id);
                        }
                    });
                }
                break;
            case MediaBrowser.ConnectionState.ServerSelection:
                {
                    Emby.Page.show('/startup/selectserver.html');
                }
                break;
            case MediaBrowser.ConnectionState.ConnectSignIn:
                {
                    Emby.Page.show('/startup/connectlogin.html');
                }
                break;
            case MediaBrowser.ConnectionState.Unavailable:
                {
                    require(['alert'], function (alert) {

                        alert({
                            text: Globalize.translate("core#MessageUnableToConnectToServer"),
                            title: Globalize.translate("core#HeaderConnectionFailure")
                        });
                    });
                }
                break;
            default:
                break;
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function onScrollSliderClick(e, callback) {

        var card = Emby.Dom.parentWithClass(e.target, 'card');

        if (card) {
            callback(card);
        }
    }

    function zoomOut(elem, iterations) {
        var keyframes = [

          { transform: 'none', opacity: '1', transformOrigin: 'center', offset: 0 },
          { transform: 'scale3d(.7, .7, .7)  ', opacity: '.7', transformOrigin: 'center', offset: .3 },
          { transform: 'scale3d(.3, .3, .3)  rotate3d(0, 0, 1, -180deg)', opacity: '0', transformOrigin: 'center', offset: 1 }

        ];

        var timing = { duration: 1000, iterations: iterations, fill: 'both' };

        return elem.animate(keyframes, timing);
    }

    function rotateOut(elem, iterations) {
        var transformOrigin = elem.style['transform-origin'];
        var keyframes = [{ transform: 'none', opacity: '1', transformOrigin: 'center', offset: 0 },
          { transform: 'rotate3d(0, 0, 1, -180deg)', opacity: '.2', transformOrigin: 'center', offset: 1 }];
        var timing = { duration: 900, iterations: iterations, fill: 'both' };
        return elem.animate(keyframes, timing);

    }

    function authenticateUser(view, serverId, username, password) {

        loading.show();

        var apiClient = connectionManager.getApiClient(serverId);
        apiClient.authenticateUserByName(username, password).then(function (result) {

            loading.hide();

            onServerUserSignedIn(view);

        }, function (result) {

            loading.hide();

            require(['alert'], function (alert) {
                alert({
                    text: Globalize.translate('core#MessageInvalidUser'),
                    title: Globalize.translate('core#SignInError')
                });
            });
        });
    }

    function createHorizontalScroller(view, Sly) {

        var scrollFrame = view.querySelector('.scrollFrame');

        loading.hide();

        scrollFrame.style.display = 'block';

        var options = {
            horizontal: 1,
            itemNav: 0,
            mouseDragging: 1,
            touchDragging: 1,
            slidee: view.querySelector('.scrollSlider'),
            itemSelector: '.card',
            smart: true,
            releaseSwing: true,
            scrollBy: 200,
            speed: 340,
            elasticBounds: 1,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
            scrollWidth: 100000
        };

        var frame = new Sly(scrollFrame, options).init();

        view.querySelector('.scrollSlider').addEventListener('focus', function (e) {

            var focused = focusManager.focusableParent(e.target);
            focusedElement = focused;

            if (focused) {
                frame.toCenter(focused);
            }
        }, true);

        // TODO: Not exactly sure yet why this can't be focused immediately
        setTimeout(function () {
            var firstCard = scrollFrame.querySelector('.card');

            if (firstCard) {
                focusManager.focus(firstCard);
            }
        }, 200);
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

        view.querySelector('.scrollSlider').innerHTML = html;

        require(["Sly"], function (Sly) {
            loading.hide();

            if (initScroller) {
                createHorizontalScroller(view, Sly);
            }
        });
    }

    return {
        handleConnectionResult: handleConnectionResult,
        signIntoConnect: signIntoConnect,
        authenticateUser: authenticateUser,
        onScrollSliderClick: onScrollSliderClick,
        renderSelectServerItems: renderSelectServerItems,
        createHorizontalScroller: createHorizontalScroller
    };
});
