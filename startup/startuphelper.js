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
            case MediaBrowser.ConnectionState.ServerUpdateNeeded:
                {
                    require(['alert'], function (alert) {
                        alert(Globalize.translate('core#ServerUpdateNeeded', '<a href="https://emby.media">https://emby.media</a>')).then(function () {
                            Emby.Page.show('/startup/selectserver.html');
                        });
                    });
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

    return {
        handleConnectionResult: handleConnectionResult,
        signIntoConnect: signIntoConnect,
        authenticateUser: authenticateUser,
        onScrollSliderClick: onScrollSliderClick
    };
});
