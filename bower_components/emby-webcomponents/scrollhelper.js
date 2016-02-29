define(['focusManager'], function (focusManager) {

    function getOffset(elem) {

        var doc = document;
        var box = { top: 0, left: 0 };

        if (!doc) {
            return box;
        }

        var docElem = doc.documentElement;

        // Support: BlackBerry 5, iOS 3 (original iPhone)
        // If we don't have gBCR, just use 0,0 rather than error
        if (elem.getBoundingClientRect) {
            box = elem.getBoundingClientRect();
        }
        var win = doc.defaultView;
        return {
            top: box.top + win.pageYOffset - docElem.clientTop,
            left: box.left + win.pageXOffset - docElem.clientLeft
        };
    }

    function getPosition(scrollContainer, item, horizontal) {
        var slideeOffset = getOffset(scrollContainer);
        var itemOffset = getOffset(item);

        var offset = horizontal ? itemOffset.left - slideeOffset.left : itemOffset.top - slideeOffset.top;
        var size = item[horizontal ? 'offsetWidth' : 'offsetHeight'];

        if (horizontal) {
            offset += scrollContainer.scrollLeft;
        } else {
            offset += scrollContainer.scrollTop;
        }

        var frameSize = horizontal ? scrollContainer.offsetWidth : scrollContainer.offsetHeight;

        return {
            start: offset,
            center: (offset - (frameSize / 2) + (size / 2)),
            end: offset - frameSize + size,
            size: size
        };
    }

    function toCenter(container, elem, horizontal) {
        var pos = getPosition(container, elem, horizontal);

        if (container.scrollTo) {
            if (horizontal) {
                container.scrollTo(pos.center, 0);
            } else {
                container.scrollTo(0, pos.center);
            }
        } else {
            if (horizontal) {
                container.scrollTop = pos.center;
            } else {
                container.scrollLeft = pos.center;
            }
        }
    }

    function centerOnFocus(e, scrollSlider, horizontal) {
        var focused = focusManager.focusableParent(e.target);

        if (focused) {
            toCenter(scrollSlider, focused, horizontal);
        }
    }

    function centerOnFocusHorizontal(e) {
        centerOnFocus(e, this, true);
    }
    function centerOnFocusVertical(e) {
        centerOnFocus(e, this, false);
    }

    return {
        getPosition: getPosition,
        centerFocus: {
            on: function (element, horizontal) {
                if (horizontal) {
                    element.addEventListener('focus', centerOnFocusHorizontal, true);
                } else {
                    element.addEventListener('focus', centerOnFocusVertical, true);
                }
            },
            off: function (element, horizontal) {
                if (horizontal) {
                    element.removeEventListener('focus', centerOnFocusHorizontal, true);
                } else {
                    element.removeEventListener('focus', centerOnFocusVertical, true);
                }
            }
        },
        toCenter: toCenter
    };
});