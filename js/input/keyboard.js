require(['inputmanager'], function (inputmanager) {

    function notifyApp() {

        inputmanager.notify();
    }

    function sendCommand(name, sourceElement) {

        var options = {
            sourceElement: sourceElement
        };

        inputmanager.handle(name, options);
    }

    var globalScope = window;

    // Support opera tv aliases
    // https://dev.opera.com/tv/functional-key-handling-in-opera-tv-store-applications
    var leftAlias = globalScope.VK_LEFT || -999;
    var rightAlias = globalScope.VK_RIGHT || -999;
    var downAlias = globalScope.VK_DOWN || -999;
    var upAlias = globalScope.VK_UP || -999;
    var stopAlias = globalScope.VK_STOP || -999;
    var menuAlias = globalScope.VK_MENU || -999;
    var nextTrackAlias = globalScope.VK_TRACK_NEXT || -999;
    var previousTrackAlias = globalScope.VK_TRACK_PREV || -999;

    globalScope.addEventListener('keydown', function (evt) {

        //var isShift = !!evt.shiftKey;
        switch (evt.keyCode) {

            case 27:
                // escape
                sendCommand('back', evt.target);
                return;
            case 37:
                // left
                if (!evt.altKey) {
                    evt.preventDefault();
                    sendCommand('left', evt.target);
                    return;
                }
            case leftAlias:
                // left
                evt.preventDefault();
                sendCommand('left', evt.target);
                return;
            case 38:
            case upAlias:
                // up
                evt.preventDefault();
                sendCommand('up', evt.target);
                return;
            case 39:
                // right
                if (!evt.altKey) {
                    evt.preventDefault();
                    sendCommand('right', evt.target);
                    return;
                }
            case rightAlias:
                // right
                evt.preventDefault();
                sendCommand('right', evt.target);
                return;
            case 40:
            case downAlias:
                // down
                evt.preventDefault();
                sendCommand('down', evt.target);
                return;
            case 36:
                // home
                sendCommand('home', evt.target);
                return;
            case 33:
                // page up
                sendCommand('pageup', evt.target);
                return;
            case 34:
                // page down
                sendCommand('pagedown', evt.target);
                return;
            case 35:
                // end
                sendCommand('end', evt.target);
                return;
            case 68:
                // d
                if (evt.ctrlKey) {
                    sendCommand('menu', evt.target);
                    return;
                }
                break;
            case menuAlias:
                // end
                sendCommand('menu', evt.target);
                return;
            case 66:
                // b
                if (evt.ctrlKey) {
                    if (!!evt.shiftKey) {
                        // control-shift
                        sendCommand('rewind', evt.target);
                        return;
                    } else {
                        // control
                        sendCommand('previous', evt.target);
                        return;
                    }
                }
                if (evt.altKey) {
                    evt.preventDefault();
                    sendCommand('back', evt.target);
                    return;
                }
                break;
            case 70:
                // f
                if (evt.ctrlKey) {
                    if (!!evt.shiftKey) {
                        // control-shift
                        sendCommand('fastforward', evt.target);
                        return;
                    } else {
                        // control
                        sendCommand('next', evt.target);
                        return;
                    }
                }
                break;
            case 71:
                // g
                if (evt.ctrlKey) {
                    sendCommand('guide', evt.target);
                    return;
                }
                break;
            case 79:
                // o
                if (evt.ctrlKey) {
                    sendCommand('recordedtv', evt.target);
                    return;
                }
                break;
            case 82:
                // r
                if (evt.ctrlKey) {
                    sendCommand('record', evt.target);
                    return;
                }
                break;
            case 84:
                // t
                if (evt.ctrlKey) {
                    sendCommand('livetv', evt.target);
                    return;
                }
                break;
            case 119:
                // f8
                sendCommand('togglemute', evt.target);
                return;
            case 173:
                // mute key
                sendCommand('togglemute', evt.target);
                return;
            case 120:
                // f9
                sendCommand('volumedown', evt.target);
                return;
            case 175:
                // volume down key
                sendCommand('volumedown', evt.target);
                return;
            case 121:
                // f10
                sendCommand('volumeup', evt.target);
                return;
            case 174:
                // volume up key
                sendCommand('volumeup', evt.target);
                return;
            case 80:
                // p
                if (evt.ctrlKey) {
                    if (!!evt.shiftKey) {
                        // control-shift-p
                        sendCommand('play', evt.target);
                        return;
                    } else {
                        // control-p
                        sendCommand('playpause', evt.target);
                        return;
                    }
                }
                break;
            case 83:
                // s
                if (evt.ctrlKey) {
                    if (!!evt.shiftKey) {
                        // control-shift-s
                        sendCommand('stop', evt.target);
                        return;
                    }
                }
                break;
            case 90:
                // z
                if (evt.ctrlKey) {
                    if (!!evt.shiftKey) {
                        // control-shift-z
                        sendCommand('changezoom', evt.target);
                        return;
                    }
                }
                break;
            case 65:
                // z
                if (evt.ctrlKey) {
                    if (!!evt.shiftKey) {
                        // control-shift-a
                        sendCommand('changeaudiotrack', evt.target);
                        return;
                    }
                }
                break;
            case nextTrackAlias:
            case 176:
                // next key
                sendCommand('next', evt.target);
                break;
            case previousTrackAlias:
            case 177:
                // previous key
                sendCommand('previous', evt.target);
                break;
            case 178:
                // stop key
                sendCommand('stop', evt.target);
                break;
            default:
                break;
        }

        // No command will be executed, but notify the app that input was received
        notifyApp();

    });

});