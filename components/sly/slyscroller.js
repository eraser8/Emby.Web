define(['browser', 'Sly'], function (browser, Sly) {

    return {
        create: function (element, options) {

            if (browser.mobile) {

                options.enableNativeScroll = true;
            } else {
                
                var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
                if (isSmoothScrollSupported) {

                    if (options.horizontal && browser.firefox) {
                        //options.enableNativeScroll = true;
                    }
                }
            }

            var sly = new Sly(element, options);
            return Promise.resolve(sly);
        }
    };
});