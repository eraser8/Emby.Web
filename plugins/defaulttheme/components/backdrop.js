define(['./../themeinfo'], function (themeInfo) {

	function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function setStaticBackdrop() {

        return;
        //var path = Emby.PluginManager.mapPath(themeId, 'css/images/blur' + getRandomInt(1, 6) + '.png');
        var path = Emby.PluginManager.mapPath(themeInfo.id, 'css/images/bg1.jpg');
        Emby.Backdrop.setBackdrop(path);

        setTimeout(function () {
            document.querySelector('.themeContainer').classList.add('staticBackdrop');
        }, 1000);
    }

    function setBackdrops(items) {

        //var themeContainer = document.querySelector('.themeContainer');

        //if (isFocused) {
        //    if (!themeContainer.classList.contains('listBackdropIn')) {
        //        themeContainer.classList.add('listBackdropIn');
        //        themeContainer.classList.remove('listBackdropOut');
        //    }
        //} else {
        //    if (!themeContainer.classList.contains('listBackdropOut')) {
        //        themeContainer.classList.remove('listBackdropIn');
        //        themeContainer.classList.add('listBackdropOut');
        //    }
        //}
        //document.querySelector('.themeContainer').classList.remove('staticBackdrop');

        Emby.Backdrop.setBackdrops(items);
    }

    function subdued(isSubdued) {

        var elem = document.querySelector('.themeContainer');
        if (isSubdued) {

            elem.classList.remove('detailBackdrop');

        } else {
            elem.classList.add('detailBackdrop');
        }
    }

    return {
        setStaticBackdrop: setStaticBackdrop,
        setBackdrops: setBackdrops,
        subdued: subdued
    };
});