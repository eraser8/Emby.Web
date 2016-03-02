define([], function () {

    var pageContainerCount = document.querySelectorAll('.mainAnimatedPage').length;
    var animationDuration = 550;

    function loadView(options) {

        return new Promise(function (resolve, reject) {

            if (options.cancel) {
                return;
            }

            var animatedPages = document.querySelector('.mainAnimatedPages');

            animatedPages.cancelAnimation();

            setAnimationStyle(animatedPages, options.transition, options.isBack).then(function () {

                if (options.cancel) {
                    return;
                }

                var selected = animatedPages.selected;
                var pageIndex = selected == null ? 0 : (selected + 1);

                if (pageIndex >= pageContainerCount) {
                    pageIndex = 0;
                }

                var html = '<div class="page-view" data-type="' + (options.type || '') + '" data-url="' + options.url + '">';
                html += options.view;
                html += '</div>';

                var animatable = animatedPages.querySelectorAll('.mainAnimatedPage')[pageIndex];

                var currentPage = animatable.querySelector('.page-view');

                if (currentPage) {
                    triggerDestroy(currentPage);
                }

                animatable.innerHTML = html;

                var view = animatable.querySelector('.page-view');

                if (onBeforeChange) {
                    onBeforeChange(view, false, options);
                }

                animatedPages.selected = pageIndex;

                sendResolve(resolve, view);
            });
        });
    }

    var onBeforeChange;
    function setOnBeforeChange(fn) {
        onBeforeChange = fn;
    }

    function sendResolve(resolve, view) {

        // Don't report completion until the animation has finished, otherwise rendering may not perform well
        setTimeout(function () {

            resolve(view);

        }, animationDuration);
    }

    function setAnimationStyle(animatedPages, transition, isBack) {

        var entryAnimation = '';
        var exitAnimation = '';

        var deps = [];

        if (transition == 'slide') {

            if (isBack) {
                entryAnimation = 'slide-from-left-animation';
                exitAnimation = 'slide-right-animation';

                deps.push('slide-from-left-animation');
                deps.push('slide-right-animation');

            } else {

                deps.push('slide-left-animation');
                deps.push('slide-from-right-animation');

                entryAnimation = 'slide-from-right-animation';
                exitAnimation = 'slide-left-animation';
            }
        }
        else if (transition == 'ripple') {

            if (isBack) {
                entryAnimation = 'reverse-ripple-animation';
                exitAnimation = 'ripple-animation';

            } else {

                entryAnimation = 'ripple-animation';
                exitAnimation = 'reverse-ripple-animation';
            }

            deps.push('reverse-ripple-animation');
            deps.push('ripple-animation');
        }
        else if (transition == 'hero') {

            if (isBack) {
                entryAnimation = 'hero-animation';
                exitAnimation = 'hero-animation';

            } else {

                entryAnimation = 'hero-animation';
                exitAnimation = 'hero-animation';
            }

            deps.push('hero-animation');
        }
        else if (transition == 'fade') {

            if (isBack) {
                entryAnimation = 'fade-in-animation';
                exitAnimation = 'fade-out-animation';

            } else {

                entryAnimation = 'fade-in-animation';
                exitAnimation = 'fade-out-animation';
            }

            deps.push('fade-in-animation');
            deps.push('fade-out-animation');
        }
        else {
            entryAnimation = '';
            exitAnimation = '';
        }

        return new Promise(function (resolve, reject) {
            require(deps, function () {

                animatedPages.entryAnimation = entryAnimation;
                animatedPages.exitAnimation = exitAnimation;
                resolve();
            });
        });
    }

    function triggerDestroy(view) {
        view.dispatchEvent(new CustomEvent("viewdestroy", {}));
    }

    function reset() {

        var views = document.querySelectorAll(".mainAnimatedPage:not(.iron-selected) .page-view");

        for (var i = 0, length = views.length; i < length; i++) {

            var view = views[i];
            triggerDestroy(view);
            view.parentNode.removeChild(view);
        }
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

    function tryRestoreView(options) {
        return new Promise(function (resolve, reject) {

            var url = options.url;
            var view = document.querySelector(".page-view[data-url='" + url + "']");
            var page = parentWithClass(view, 'mainAnimatedPage');

            if (view) {

                var index = -1;
                var pages = document.querySelectorAll('.mainAnimatedPage');
                for (var i = 0, length = pages.length; i < length; i++) {
                    if (pages[i] == page) {
                        index = i;
                        break;
                    }
                }
                if (index != -1) {

                    if (options.cancel) {
                        return;
                    }

                    var animatedPages = document.querySelector('.mainAnimatedPages');
                    setAnimationStyle(animatedPages, options.transition, options.isBack).then(function () {

                        if (options.cancel) {
                            return;
                        }

                        var animatable = animatedPages.querySelectorAll('.mainAnimatedPage')[index];
                        var view = animatable.querySelector('.page-view');

                        if (onBeforeChange) {
                            onBeforeChange(view, true, options);
                        }

                        animatedPages.selected = index;
                        sendResolve(resolve, view);
                    });
                    return;
                }
            }

            reject();
        });
    }

    return {
        loadView: loadView,
        tryRestoreView: tryRestoreView,
        reset: reset,
        setOnBeforeChange: setOnBeforeChange
    };
});