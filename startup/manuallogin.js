define(['loading', 'connectionManager', 'startup/startuphelper', 'focusManager', 'backdrop'], function (loading, connectionManager, startupHelper, focusManager, backdrop) {

    return function (view, params) {

        var self = this;

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(null);
            backdrop.clear();

            view.querySelector('.txtUserName').value = params.user || '';
            view.querySelector('.txtPassword').value = '';

            if (params.user) {
                focusManager.focus(view.querySelector('.txtPassword'));
            } else {
                focusManager.focus(view.querySelector('.txtUserName'));
            }

            if (!isRestored) {
                view.querySelector('form').addEventListener('submit', function (e) {

                    var username = this.querySelector('.txtUserName').value;
                    var password = this.querySelector('.txtPassword').value;

                    loading.show();

                    var serverId = params.serverid;

                    startupHelper.authenticateUser(view, serverId, username, password);

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