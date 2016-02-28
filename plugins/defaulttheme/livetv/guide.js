define(['tvguide'], function (tvguide) {

    return function (view, params) {

        var self = this;
        var guideInstance;

        view.addEventListener('viewshow', function (e) {

            Emby.Page.setTitle(Globalize.translate('Guide'));
            Emby.Backdrop.clear();

            if (!e.detail.isRestored) {
                initGuide();
            }
        });

        view.addEventListener('viewdestroy', function () {

        });

        function initGuide() {

            guideInstance = new tvguide({
                element: view.querySelector('.guidePageContainer')
            });
        }
    }

});