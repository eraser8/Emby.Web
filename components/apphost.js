define(['appStorage'], function (appStorage) {

    function getDeviceProfile() {

        // TODO
        return null;
    }

    function getCapabilities() {

        var caps = {
            PlayableMediaTypes: ['Audio', 'Video'],

            SupportsPersistentIdentifier: false,
            DeviceProfile: getDeviceProfile()
        };

        return caps;
    }

    return {
        getWindowState: function () {
            return document.windowState || 'Normal';
        },
        setWindowState: function (state) {
            alert('setWindowState is not supported and should not be called');
        },
        exit: function () {
            alert('exit is not supported and should not be called');
        },
        supports: function (command) {

            // Web-based implementation can't really do much
            return false;
        },
        appName: function () {
            return 'Emby Theater';
        },
        appVersion: function () {
            return '2.0';
        },
        deviceName: function () {
            return "Web Browser";
        },
        deviceId: function () {

            var deviceId = appStorage.getItem(key);

            if (deviceId) {
                return Promise.resolve(deviceId);
            } else {
                return new Promise(function (resolve, reject) {

                    require(['cryptojs-sha1'], function () {
                        var keys = [];
                        keys.push(navigator.userAgent);
                        keys.push((navigator.cpuClass || ""));
                        keys.push(appName);
                        keys.push(new Date().getTime());

                        var randomId = CryptoJS.SHA1(keys.join('|')).toString();
                        appStorage.setItem(key, randomId);
                        resolve(randomId);
                    });
                });
            }
        },
        appInfo: function () {

            return new Promise(function (resolve, reject) {

                var deviceName = "Web Browser";
                var appName = 'Emby Theater';

                function onDeviceIdAcquired(id) {

                    resolve({
                        deviceId: id,
                        deviceName: deviceName,
                        appName: appName,
                        appVersion: '2.0'
                    });
                }

                var key = '_deviceId1';
                var deviceId = appStorage.getItem(key);

                if (deviceId) {
                    onDeviceIdAcquired(deviceId);
                } else {
                    require(['cryptojs-sha1'], function () {
                        var keys = [];
                        keys.push(navigator.userAgent);
                        keys.push((navigator.cpuClass || ""));
                        keys.push(appName);
                        keys.push(new Date().getTime());

                        var randomId = CryptoJS.SHA1(keys.join('|')).toString();
                        appStorage.setItem(key, randomId);
                        onDeviceIdAcquired(randomId);
                    });
                }
            });

        },
        capabilities: getCapabilities
    };
});