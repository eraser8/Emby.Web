define(['loading', 'connectionManager', 'startup/startuphelper', 'coreIcons'], function (loading, connectionManager, startupHelper) {

    return function (view, params) {

        var self = this;

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;
            var servers = [];

            Emby.Page.setTitle(null);
            Emby.Backdrop.clear();

            require(['connectionManager', 'loading'], function (connectionManager, loading) {

                loading.show();

                connectionManager.getAvailableServers().then(function (result) {

                    servers = result;
                    startupHelper.renderSelectServerItems(view, result, !isRestored);
                    view.querySelector('.pageHeader').classList.remove('hide');

                }, function (result) {

                    servers = [];
                    startupHelper.renderSelectServerItems(view, [], !isRestored);
                    view.querySelector('.pageHeader').classList.remove('hide');
                });
            });

            if (!isRestored) {
                view.querySelector('.scrollSlider').addEventListener('click', function (e) {

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