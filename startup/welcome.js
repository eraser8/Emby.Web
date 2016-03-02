define(['loading', 'connectionManager', 'startup/startuphelper', 'backdrop'], function (loading, connectionManager, startupHelper, backdrop) {

    return function (view, params) {

        var self = this;

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(null);
            backdrop.clear();

            loading.hide();

            if (!isRestored) {
                view.querySelector('.btnWelcomeNext').addEventListener('click', function () {

                    connectionManager.connect().then(function (result) {

                        loading.hide();

                        startupHelper.handleConnectionResult(result, view);
                    });
                });
            }
        });
    }

});