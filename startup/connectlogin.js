define(['loading', 'connectionManager', 'startup/startuphelper', 'shell', 'backdrop'], function (loading, connectionManager, startupHelper, shell, backdrop) {

    return function (view, params) {

        var self = this;

        var currentPinInfo;
        var currentInterval;

        function showPinErrorMessage(key) {

            var pinMessage = view.querySelector('.pinMessage');
            pinMessage.classList.remove('hide');
            pinMessage.innerHTML = Globalize.translate('core#' + key);
        }

        function createPin() {

            loading.show();

            view.querySelector('.pinMessage').classList.add('hide');
            view.querySelector('.pinCodeValue').innerHTML = '&nbsp;';
            stopPolling();

            connectionManager.createPin().then(function (result) {

                currentPinInfo = result;
                view.querySelector('.pinCodeValue').innerHTML = result.Pin;
                startPolling();
                loading.hide();

            }, function () {
                loading.hide();
                showPinErrorMessage('CreatePinErrorMessage');
            });
        }

        function pollPinStatus() {
            connectionManager.getPinStatus(currentPinInfo).then(function (pinStatus) {

                if (pinStatus.IsConfirmed) {

                    stopPolling();
                    onPinConfirmed();

                } else if (pinStatus.IsExpired) {
                    stopPolling();
                    showPinErrorMessage('PinExpiredMessage');
                }
            });
        }

        function startPolling() {
            currentInterval = setInterval(pollPinStatus, 3000);
        }

        function stopPolling() {

            if (currentInterval) {
                clearInterval(currentInterval);
                currentInterval = null;
            }
        }

        function onPinConfirmed() {

            loading.show();

            connectionManager.exchangePin(currentPinInfo).then(function () {

                connectionManager.connect().then(function (result) {

                    loading.hide();

                    if (result.State == MediaBrowser.ConnectionState.ConnectSignIn) {
                        Emby.Page.show('/startup/manualserver.html');
                    } else {
                        startupHelper.handleConnectionResult(result, view);
                    }
                });
            });
        }

        function bindEvents() {

            view.querySelector('.btnSkipConnect').addEventListener('click', function (e) {

                loading.show();

                connectionManager.connect().then(function (result) {

                    loading.hide();

                    if (result.State == MediaBrowser.ConnectionState.ConnectSignIn) {
                        Emby.Page.show('/startup/manualserver.html');
                    } else {
                        startupHelper.handleConnectionResult(result, view);
                    }
                });
            });

            view.querySelector('.btnNewPin').addEventListener('click', function (e) {

                createPin();
            });

            view.querySelector('.lnkPinSignIn').addEventListener('click', function (e) {

                shell.openUrl(e.target.href);
                e.preventDefault();
                return false;
            });

            view.querySelector('.lnkTerms').addEventListener('click', function (e) {

                shell.openUrl(e.target.href);
                e.preventDefault();
                return false;
            });
        }

        view.addEventListener("viewbeforeshow", function (e) {

            var isRestored = e.detail.isRestored;
            currentPinInfo = null;

            Emby.Page.setTitle(null);
            backdrop.clear();

            if (!isRestored) {

                view.querySelector('.terms').innerHTML = Globalize.translate('core#EmbyLoginTerms', '<a tabindex="-1" class="lnkTerms" href="https://emby.media/terms" target="_blank">', '</a>');

                view.querySelector('.pinCodeHeader').innerHTML = Globalize.translate('core#ConnectPinCodeHeader', '<a tabindex="-1" class="lnkPinSignIn" href="https://emby.media/pin" target="_blank">https://emby.media/pin</a>');
                createPin();
                bindEvents();
            }
        });

        view.addEventListener("viewhide", function (e) {

            stopPolling();
        });
    }

});