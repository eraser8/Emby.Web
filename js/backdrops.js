(function (globalScope) {

    function backdrop() {

        var self = this;
        var isDestroyed;

        self.load = function (url, parent, existingBackdropImage) {

            var img = new Image();
            img.onload = function () {

                if (isDestroyed) {
                    return;
                }

                var backdropImage = document.createElement('div');
                backdropImage.classList.add('backdropImage');
                backdropImage.classList.add('displayingBackdropImage');
                backdropImage.style.backgroundImage = "url('" + url + "')";
                backdropImage.setAttribute('data-url', url);

                parent.appendChild(backdropImage);

                var animation = fadeIn(backdropImage, 1);
                currentAnimation = animation;
                animation.onfinish = function () {

                    if (animation == currentAnimation) {
                        currentAnimation = null;
                    }
                    if (existingBackdropImage && existingBackdropImage.parentNode) {
                        existingBackdropImage.parentNode.removeChild(existingBackdropImage);
                    }
                };

                internalBackdrop(true);
            };
            img.src = url;
        };

        var currentAnimation;
        function fadeIn(elem, iterations) {
            var keyframes = [
              { opacity: '0', offset: 0 },
              { opacity: '1', offset: 1 }];
            var timing = { duration: 800, iterations: iterations, easing: 'ease-in' };
            return elem.animate(keyframes, timing);
        }

        function cancelAnimation() {
            var animation = currentAnimation;
            if (animation) {
                console.log('Cancelling backdrop animation');
                animation.cancel();
                currentAnimation = null;
            }
        }

        self.destroy = function () {

            isDestroyed = true;
            cancelAnimation();
        };
    }

    var backdropContainer;
    function getBackdropContainer() {

        if (!backdropContainer) {
            backdropContainer = document.querySelector('.backdropContainer');
        }
        return backdropContainer;
    }

    function clearBackdrop(clearAll) {

        if (currentLoadingBackdrop) {
            currentLoadingBackdrop.destroy();
            currentLoadingBackdrop = null;
        }

        var elem = getBackdropContainer();
        elem.innerHTML = '';

        if (clearAll) {
            hasExternalBackdrop = false;
        }
        internalBackdrop(false);
    }

    var themeContainer;
    function setThemeContainerBackgroundEnabled() {

        if (!themeContainer) {
            themeContainer = document.querySelector('.themeContainer');
        }

        if (hasInternalBackdrop || hasExternalBackdrop) {
            themeContainer.classList.add('withBackdrop');
        } else {
            themeContainer.classList.remove('withBackdrop');
        }
    }

    var hasInternalBackdrop;
    function internalBackdrop(enabled) {
        hasInternalBackdrop = enabled;
        setThemeContainerBackgroundEnabled();
    }

    var hasExternalBackdrop;
    function externalBackdrop(enabled) {
        hasExternalBackdrop = enabled;
        setThemeContainerBackgroundEnabled();
    }

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    var currentLoadingBackdrop;
    function setBackdropImage(url) {

        if (currentLoadingBackdrop) {
            currentLoadingBackdrop.destroy();
            currentLoadingBackdrop = null;
        }

        var elem = getBackdropContainer();
        var existingBackdropImage = elem.querySelector('.displayingBackdropImage');

        if (existingBackdropImage && existingBackdropImage.getAttribute('data-url') == url) {
            if (existingBackdropImage.getAttribute('data-url') == url) {
                return;
            }
            existingBackdropImage.classList.remove('displayingBackdropImage');
        }

        var instance = new backdrop();
        instance.load(url, elem, existingBackdropImage);
        currentLoadingBackdrop = instance;
    }

    function setBackdrops(items) {

        var images = items.map(function (i) {

            if (i.BackdropImageTags && i.BackdropImageTags.length > 0) {
                return {
                    id: i.Id,
                    tag: i.BackdropImageTags[0]
                };
            }

            if (i.ParentBackdropItemId && i.ParentBackdropImageTags && i.ParentBackdropImageTags.length) {

                return {
                    id: i.ParentBackdropItemId,
                    tag: i.ParentBackdropImageTags[0]
                };
            }
            return null;

        }).filter(function (i) {
            return i != null;
        });

        if (images.length) {

            var index = getRandom(0, images.length - 1);
            var item = images[index];

            var screenWidth = window.innerWidth;

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();
                var imgUrl = apiClient.getScaledImageUrl(item.id, {
                    type: "Backdrop",
                    tag: item.tag,
                    //maxWidth: screenWidth,
                    quality: 100,
                    format: 'jpg'
                });

                setBackdrop(imgUrl);
            });

        } else {
            clearBackdrop();
        }
    }

    function setBackdrop(url) {

        if (url) {
            setBackdropImage(url);

        } else {
            clearBackdrop();
        }
    }

    if (!globalScope.Emby) {
        globalScope.Emby = {};
    }

    globalScope.Emby.Backdrop = {

        setBackdrops: setBackdrops,
        setBackdrop: setBackdrop,
        clear: clearBackdrop,
        externalBackdrop: externalBackdrop
    };

})(this);