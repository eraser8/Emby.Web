define([], function () {

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

    return {
        getPosition: getPosition
    };
});