define(['paperdialoghelper', 'apphost', 'css!./backmenu.css'], function (paperdialoghelper, apphost) {

    function getButton(name, icon, option) {

        var html = '';
        html += '<paper-icon-button class="backMenuButton xlargePaperIconButton" icon="' + icon + '" data-option="' + option + '" title="' + name + '"></paper-icon-button>';

        return html;
    }

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function onFocusIn(e) {

        var btn = parentWithClass(e.target, 'backMenuButton');

        if (btn) {
            document.querySelector('.backMenuButtonTitle').innerHTML = btn.getAttribute('title');
        }
    }

    function show(options) {

        var dialogResult;

        var dlg = paperdialoghelper.createDialog({
            entryAnimation: 'fade-in-animation',
            removeOnClose: true,
            size: 'fullscreen'
        });

        dlg.classList.add('backMenu');

        var html = '';
        html += '<div style="text-align:center;">';

        html += '<div style="vertical-align:middle;">';

        if (options.showHome) {
            html += getButton(Globalize.translate('Home'), 'home', 'home');
        }

        html += getButton(Globalize.translate('Settings'), 'settings', 'settings');

        html += getButton(Globalize.translate('SelectServer'), 'wifi', 'selectserver');
        html += getButton(Globalize.translate('SignOut'), 'lock', 'logout');

        if (apphost.supports('exit')) {
            html += getButton(Globalize.translate('Exit'), 'exit-to-app', 'exit');
        }

        if (apphost.supports('sleep')) {
            html += '<div class="backMenuSeparator"></div>';
            html += getButton(Globalize.translate('Sleep'), 'timer-off', 'sleep');
        }

        if (apphost.supports('shutdown')) {
            html += getButton(Globalize.translate('Shutdown'), 'power-settings-new', 'shutdown');
        }

        if (apphost.supports('restart')) {
            html += getButton(Globalize.translate('Restart'), 'refresh', 'restart');
        }

        html += '</div>';

        html += '<h1 class="backMenuButtonTitle">&nbsp;';
        html += '</h1>';

        html += '</div>';

        dlg.innerHTML = html;
        document.body.appendChild(dlg);

        dlg.addEventListener('focus', onFocusIn, true);

        dlg.addEventListener('click', function (e) {

            var backMenuButton = parentWithClass(e.target, 'backMenuButton');

            if (backMenuButton) {

                dialogResult = backMenuButton.getAttribute('data-option');

                paperdialoghelper.close(dlg);
            }

        });

        return paperdialoghelper.open(dlg).then(function () {

            var cancelled = false;

            switch (dialogResult) {

                case 'logout':
                    Emby.App.logout();
                    break;
                case 'home':
                    Emby.Page.goHome();
                    break;
                case 'exit':
                    apphost.exit();
                    break;
                case 'sleep':
                    apphost.sleep();
                    break;
                case 'shutdown':
                    apphost.shutdown();
                    break;
                case 'restart':
                    apphost.restart();
                    break;
                case 'settings':
                    Emby.Page.gotoSettings();
                    break;
                case 'selectserver':
                    Emby.Page.selectServer();
                    break;
                default:
                    cancelled = true;
                    break;
            }
        });
    }

    return show;

});