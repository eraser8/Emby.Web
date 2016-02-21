define(['loading', 'connectionManager', 'startup/startuphelper', 'shell'], function (loading, connectionManager, startupHelper, shell) {

    return function (view, params) {

        var self = this;

        var currentPinInfo;
        var currentInterval;

        var apiClient = connectionManager.getApiClient(params.serverid);

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

            apiClient.createPin().then(function (result) {

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
            apiClient.getPinStatus(currentPinInfo).then(function (pinStatus) {

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

            apiClient.exchangePin(currentPinInfo).then(function () {

                connectionManager.connectToServer(connectionManager.getServerInfo(params.serverid)).then(function (result) {

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

            view.querySelector('.btnCancel').addEventListener('click', function (e) {

                Emby.Page.back();
            });

            view.querySelector('.btnNewPin').addEventListener('click', function (e) {

                createPin();
            });

            view.querySelector('.lnkPinSignIn').addEventListener('click', function (e) {

                shell.openUrl(e.target.href);
                e.preventDefault();
                return false;
            });
        }

        view.addEventListener("viewbeforeshow", function (e) {

            var isRestored = e.detail.isRestored;
            currentPinInfo = null;

            Emby.Page.setTitle(null);
            Emby.Backdrop.clear();

            if (!isRestored) {

                view.querySelector('.pinCodeHeader').innerHTML = Globalize.translate('core#ConnectPinCodeHeader', '<a tabindex="-1" class="lnkPinSignIn" href="http://emby.media/pin" target="_blank">http://emby.media/pin</a>');
                createPin();
                bindEvents();
            }
        });

        view.addEventListener("viewhide", function (e) {

            stopPolling();
        });
    }

});