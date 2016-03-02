define(['browser', 'Sly'], function (browser, Sly) {

    function isSmartTv() {

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

    return {
        create: function (element, options) {

            if (options.enableAutoNativeScroll) {
                if (browser.mobile || isSmartTv()) {

                    options.enableNativeScroll = true;
                } else {

                    var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
                    if (isSmoothScrollSupported) {

                        if (browser.firefox) {
                            options.enableNativeScroll = true;
                        }
                    }
                }
            }

            var sly = new Sly(element, options);
            return Promise.resolve(sly);
        }
    };
});