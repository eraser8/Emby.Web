define(['loading', 'connectionManager', 'startup/startuphelper', 'backdrop'], function (loading, connectionManager, startupHelper, backdrop) {

    return function (view, params) {

        var self = this;

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(null);
            backdrop.clear();

            view.querySelector('.txtServerHost').value = '';
            view.querySelector('.txtServerPort').value = '8096';

            if (!isRestored) {
                view.querySelector('form').addEventListener('submit', function (e) {

                    var address = this.querySelector('.txtServerHost').value;
                    var port = this.querySelector('.txtServerPort').value;

                    if (port) {
                        address += ':' + port;
                    }

                    require(['connectionManager', 'loading'], function (connectionManager, loading) {

                        loading.show();

                        connectionManager.connectToAddress(address).then(function (result) {

                            loading.hide();

                            startupHelper.handleConnectionResult(result, view);
                        });
                    });

                    e.preventDefault();
                    return false;
                });

                view.querySelector('.buttonCancel').addEventListener('click', function (e) {

                    Emby.Page.back();
                });

                var paperSubmit = view.querySelector('.paperSubmit');
                if (paperSubmit) {
                    // This element won't be here in the lite version
                    paperSubmit.addEventListener('click', function (e) {

                        // Do a fake form submit this the button isn't a real submit button
                        var fakeSubmit = document.createElement('input');
                        fakeSubmit.setAttribute('type', 'submit');
                        fakeSubmit.style.display = 'none';
                        var form = view.querySelector('form');
                        form.appendChild(fakeSubmit);
                        fakeSubmit.click();
                        form.removeChild(fakeSubmit);
                    });
                }
            }
        });
    }

});