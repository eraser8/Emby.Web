require(['inputmanager', 'browser', 'pluginManager'], function (inputManager, browser, pluginManager) {

    function hasBuiltInKeyboard() {

        if (browser.mobile) {
            return true;
        }

        // This is going to be really difficult to get right
        var userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.indexOf('tv') != -1) {
            return true;
        }

        if (userAgent.indexOf('samsung') != -1) {
            return true;
        }

        if (userAgent.indexOf('nintendo') != -1) {
            return true;
        }

        if (userAgent.indexOf('viera') != -1) {
            return true;
        }

        if (userAgent.indexOf('xbox') != -1) {
            return true;
        }

        return false;
    }

    if (!hasBuiltInKeyboard()) {
        document.addEventListener('keypress', function (evt) {

            var tag = evt.target.tagName;

            if (evt.keyCode == 13 && (evt.target.isContentEditable || (tag === 'INPUT' || tag === 'TEXTAREA')) && !evt.target.readonly) {

                if (enableKeyboard(evt.target)) {
                    var keyboard = getKeyboard();

                    if (keyboard) {

                        var options = {
                            field: evt.target
                        };

                        var label;

                        if (evt.target.id) {
                            var label = document.querySelector('label[for=\'' + evt.target.id + '\']');
                        }

                        if (!label) {
                            var labelledBy = evt.target.getAttribute('aria-labelledby');
                            if (labelledBy) {
                                label = document.querySelector('#' + labelledBy);
                            }
                        }

                        if (label) {
                            options.label = label.innerHTML;
                        }

                        keyboard.show(options);
                        evt.preventDefault();
                        return false;
                    }
                }
            }

        }, true);
    }

    function enableKeyboard(elem) {

        while (elem) {
            if (elem.getAttribute && elem.getAttribute('data-keyboard') == 'false') {
                return false;
            }

            elem = elem.parentNode;
        }

        return true;
    }

    function getKeyboard() {
        return pluginManager.ofType('keyboard')[0];
    }

});