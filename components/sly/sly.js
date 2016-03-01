define([], function () {

    /**
* Return type of the value.
*
* @param  {Mixed} value
*
* @return {String}
*/
    function type(value) {
        if (value == null) {
            return String(value);
        }

        if (typeof value === 'object' || typeof value === 'function') {
            return Object.prototype.toString.call(value).match(/\s([a-z]+)/i)[1].toLowerCase() || 'object';
        }

        return typeof value;
    }

    /**
	 * Event preventDefault & stopPropagation helper.
	 *
	 * @param {Event} event     Event object.
	 * @param {Bool}  noBubbles Cancel event bubbling.
	 *
	 * @return {Void}
	 */
    function stopDefault(event, noBubbles) {
        event.preventDefault();
        if (noBubbles) {
            event.stopPropagation();
        }
    }

    /**
	 * Disables an event it was triggered on and unbinds itself.
	 *
	 * @param  {Event} event
	 *
	 * @return {Void}
	 */
    function disableOneEvent(event) {
        /*jshint validthis:true */
        stopDefault(event, 1);
        this.removeEventListener(event.type, disableOneEvent);
    }

    /**
	 * Resets native element scroll values to 0.
	 *
	 * @return {Void}
	 */
    function resetScroll() {
        /*jshint validthis:true */
        this.scrollLeft = 0;
        this.scrollTop = 0;
    }

    /**
	 * Check if variable is a number.
	 *
	 * @param {Mixed} value
	 *s
	 * @return {Boolean}
	 */
    function isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
	 * Make sure that number is within the limits.
	 *
	 * @param {Number} number
	 * @param {Number} min
	 * @param {Number} max
	 *
	 * @return {Number}
	 */
    function within(number, min, max) {
        return number < min ? min : number > max ? max : number;
    }

    var pluginName = 'sly';
    var className = 'Sly';
    var namespace = pluginName;

    // Other global values
    var dragInitEventNames = ['touchstart', 'mousedown'];
    var dragInitEvents = 'touchstart.' + namespace + ' mousedown.' + namespace;
    var dragMouseEvents = ['mousemove', 'mouseup'];
    var dragTouchEvents = ['touchmove', 'touchend'];
    var wheelEvent = (document.implementation.hasFeature('Event.wheel', '3.0') ? 'wheel' : 'mousewheel');
    var clickEvent = 'click.' + namespace;
    var mouseDownEvent = 'mousedown.' + namespace;
    var interactiveElements = ['INPUT', 'SELECT', 'TEXTAREA'];
    var tmpArray = [];
    var time;

    // Math shorthands
    var abs = Math.abs;
    var sqrt = Math.sqrt;
    var pow = Math.pow;
    var round = Math.round;
    var max = Math.max;
    var min = Math.min;

    // Keep track of last fired global wheel event
    var lastGlobalWheel = 0;
    document.addEventListener(wheelEvent, function (event) {
        var sly = event[namespace];
        var time = +new Date();
        // Update last global wheel time, but only when event didn't originate
        // in Sly frame, or the origin was less than scrollHijack time ago
        if (!sly || sly.options.scrollHijack < time - lastGlobalWheel) lastGlobalWheel = time;
    });

    /**
 * Sly.
 *
 * @class
 *
 * @param {Element} frame       DOM element of sly container.
 * @param {Object}  options     Object with options.
 * @param {Object}  callbackMap Callbacks map.
 */
    return function (frame, options, callbackMap) {

        // Extend options
        var o = extend({}, {
            slidee: null, // Selector, DOM element, or jQuery object with DOM element representing SLIDEE.
            horizontal: false, // Switch to horizontal mode.

            // Scrolling
            scrollSource: null, // Element for catching the mouse wheel scrolling. Default is FRAME.
            scrollBy: 0, // Pixels or items to move per one mouse scroll. 0 to disable scrolling.
            scrollHijack: 300, // Milliseconds since last wheel event after which it is acceptable to hijack global scroll.
            scrollTrap: false, // Don't bubble scrolling when hitting scrolling limits.

            // Dragging
            dragSource: null, // Selector or DOM element for catching dragging events. Default is FRAME.
            mouseDragging: 1, // Enable navigation by dragging the SLIDEE with mouse cursor.
            touchDragging: 1, // Enable navigation by dragging the SLIDEE with touch events.
            releaseSwing: false, // Ease out on dragging swing release.
            swingSpeed: 0.2, // Swing synchronization speed, where: 1 = instant, 0 = infinite.
            elasticBounds: false, // Stretch SLIDEE position limits when dragging past FRAME boundaries.
            dragThreshold: 3, // Distance in pixels before Sly recognizes dragging.
            intervactive: null, // Selector for special interactive elements.

            // Mixed options
            speed: 0, // Animations speed in milliseconds. 0 to disable animations.

            // Classes
            draggedClass: 'dragged', // Class for dragged elements (like SLIDEE or scrollbar handle).
            activeClass: 'active', // Class for active items and pages.
            disabledClass: 'disabled' // Class for disabled navigation elements.
        }, options);

        // Private variables
        var self = this;
        self.options = o;

        // Frame
        var frameElement = frame;
        var slideeElement = o.slidee ? o.slidee : sibling(frameElement.firstChild)[0];
        var frameSize = 0;
        var pos = {
            start: 0,
            center: 0,
            end: 0,
            cur: 0,
            dest: 0
        };

        var isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
        var transform = !options.enableNativeScroll;

        var hPos = {
            start: 0,
            end: 0,
            cur: 0
        };

        // Items
        var rel = {
            activeItem: null
        };

        // Miscellaneous
        var scrollSource = o.scrollSource ? o.scrollSource : frameElement;
        var dragSourceElement = o.dragSource ? o.dragSource : frameElement;
        var callbacks = {};
        var last = {};
        var animation = {};
        var move = {};
        var dragging = {
            released: 1
        };
        var scrolling = {
            last: 0,
            delta: 0,
            resetTime: 200
        };
        var historyID = 0;
        var continuousID = 0;
        var i, l;

        // Normalizing frame
        frame = frameElement;

        // Expose properties
        self.initialized = 0;
        self.frame = frame;
        self.slidee = slideeElement;
        self.options = o;
        self.dragging = dragging;

        function sibling(n, elem) {
            var matched = [];

            for (; n; n = n.nextSibling) {
                if (n.nodeType === 1 && n !== elem) {
                    matched.push(n);
                }
            }
            return matched;
        }

        /**
		 * Loading function.
		 *
		 * Populate arrays, set sizes, bind events, ...
		 *
		 * @param {Boolean} [isInit] Whether load is called from within self.init().
		 * @return {Void}
		 */
        function load(isInit) {

            // Reset global variables
            frameSize = getWidthOrHeight(frameElement, o.horizontal ? 'width' : 'height');
            var slideeSize = o.scrollWidth || slideeElement[o.horizontal ? 'offsetWidth' : 'offsetHeight'];

            // Set position limits & relativess
            pos.start = 0;
            pos.end = max(slideeSize - frameSize, 0);

            if (!isInit) {
                // Fix possible overflowing
                slideTo(within(pos.dest, pos.start, pos.end));
            }
        }

        var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;
        var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");

        function getWidthOrHeight(elem, name, extra) {

            // Start with offset property, which is equivalent to the border-box value
            var valueIsBorderBox = true,
                val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
                styles = getComputedStyle(elem, null),
                isBorderBox = styles.getPropertyValue("box-sizing") === "border-box";

            // Some non-html elements return undefined for offsetWidth, so check for null/undefined
            // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
            // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
            if (val <= 0 || val == null) {
                // Fall back to computed then uncomputed css if necessary
                //val = curCSS(elem, name, styles);
                if (val < 0 || val == null) {
                    val = elem.style[name];
                }

                // Computed unit is not pixels. Stop here and return.
                if (rnumnonpx.test(val)) {
                    return val;
                }

                // Check for style in case a browser which returns unreliable values
                // for getComputedStyle silently falls back to the reliable elem.style
                valueIsBorderBox = isBorderBox &&
                (support.boxSizingReliable() || val === elem.style[name]);

                // Normalize "", auto, and prepare for extra
                val = parseFloat(val) || 0;
            }

            // Use the active box-sizing model to add/subtract irrelevant styles
            return (val +
                    augmentWidthOrHeight(
                        elem,
                        name,
                        extra || (isBorderBox ? "border" : "content"),
                        valueIsBorderBox,
                        styles
                    )
            );
        }

        var cssExpand = ["Top", "Right", "Bottom", "Left"];

        function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
            var i = extra === (isBorderBox ? "border" : "content") ?
                    // If we already have the right measurement, avoid augmentation
                    4 :
                    // Otherwise initialize for horizontal or vertical properties
                    name === "width" ? 1 : 0,

                val = 0;

            for (; i < 4; i += 2) {
                // Both box models exclude margin, so add it if we want it
                if (extra === "margin") {
                    //val += jQuery.css(elem, extra + cssExpand[i], true, styles);
                }

                if (isBorderBox) {
                    // border-box includes padding, so remove it if we want content
                    if (extra === "content") {
                        //val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
                    }

                    // At this point, extra isn't border nor margin, so remove border
                    if (extra !== "margin") {
                        //val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
                    }
                } else {
                    // At this point, extra isn't content, so add padding
                    //val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);

                    // At this point, extra isn't content nor padding, so add border
                    if (extra !== "padding") {
                        //val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
                    }
                }
            }

            return val;
        }

        self.reload = function () { load(); };

        /**
		 * Animate to a position.
		 *
		 * @param {Int}  newPos    New position.
		 * @param {Bool} immediate Reposition immediately without an animation.
		 * @param {Bool} dontAlign Do not align items, use the raw position passed in first argument.
		 *
		 * @return {Void}
		 */
        function slideTo(newPos, immediate, dontAlign) {

            // Handle overflowing position limits
            if (dragging.init && dragging.slidee && o.elasticBounds) {
                if (newPos > pos.end) {
                    newPos = pos.end + (newPos - pos.end) / 6;
                } else if (newPos < pos.start) {
                    newPos = pos.start + (newPos - pos.start) / 6;
                }
            } else {
                newPos = within(newPos, pos.start, pos.end);
            }

            if (!transform) {

                //newPos = Math.max(0, newPos);
                if (immediate) {

                    if (o.horizontal) {
                        slideeElement.scrollLeft = newPos;
                    } else {
                        slideeElement.scrollTop = newPos;
                    }
                } else {
                    if (o.horizontal) {
                        slideeElement.scrollTo(newPos, 0);
                    } else {
                        slideeElement.scrollTo(0, newPos);
                    }
                }
                return;
            }

            // Update the animation object
            animation.from = pos.cur;
            animation.to = newPos;
            animation.tweesing = dragging.tweese || dragging.init && !dragging.slidee;
            animation.immediate = !animation.tweesing && (immediate || dragging.init && dragging.slidee || !o.speed);

            // Reset dragging tweesing request
            dragging.tweese = 0;

            // Start animation rendering
            if (newPos !== pos.dest) {
                pos.dest = newPos;
                renderAnimate(animation);
            }
        }

        var scrollEvent = new CustomEvent("scroll");

        function renderAnimate() {

            if (!transform) {
                return;
            }

            var obj = getComputedStyle(slideeElement, null).getPropertyValue('transform').match(/([-+]?(?:\d*\.)?\d+)\D*, ([-+]?(?:\d*\.)?\d+)\D*\)/);
            if (obj) {
                // [1] = x, [2] = y
                pos.cur = parseInt(o.horizontal ? obj[1] : obj[2]) * -1;
            }

            var keyframes;

            animation.to = round(animation.to);

            if (o.horizontal) {
                keyframes = [
                    { transform: 'translate3d(' + (-round(pos.cur || animation.from)) + 'px, 0, 0)', offset: 0 },
                    { transform: 'translate3d(' + (-round(animation.to)) + 'px, 0, 0)', offset: 1 }
                ];
            } else {
                keyframes = [
                    { transform: 'translate3d(0, ' + (-round(pos.cur || animation.from)) + 'px, 0)', offset: 0 },
                    { transform: 'translate3d(0, ' + (-round(animation.to)) + 'px, 0)', offset: 1 }
                ];
            }

            var animationConfig = {
                duration: animation.immediate ? (o.immediateSpeed || 50) : o.speed,
                iterations: 1,
                fill: 'both'
            };

            if (!animation.immediate) {
                animationConfig.easing = 'ease-in-out-sine';

            } else {
                //slideeElement.style.transform = 'translate3d(' + (-round(animation.to)) + 'px, 0, 0)';
                //pos.cur = animation.to;
                //return;
            }

            var animationInstance = slideeElement.animate(keyframes, animationConfig);

            animationInstance.finished.then(function () {

                //slideeElement.style.transform = 'translate3d(' + (-round(animation.to)) + 'px, 0, 0)';
                pos.cur = animation.to;
                document.dispatchEvent(scrollEvent);
            });
        }

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

        /**
		 * Returns the position object.
		 *
		 * @param {Mixed} item
		 *
		 * @return {Object}
		 */
        self.getPos = function (item) {
            var slideeOffset = getOffset(slideeElement);
            var itemOffset = getOffset(item);

            var offset = o.horizontal ? itemOffset.left - slideeOffset.left : itemOffset.top - slideeOffset.top;
            var size = item[o.horizontal ? 'offsetWidth' : 'offsetHeight'];

            var centerOffset = o.centerOffset || 0;

            if (!transform) {
                centerOffset = 0;
                if (o.horizontal) {
                    offset += slideeElement.scrollLeft;
                } else {
                    offset += slideeElement.scrollTop;
                }
            }

            return {
                start: offset,
                center: offset + centerOffset - (frameSize / 2) + (size / 2),
                end: offset - frameSize + size,
                size: size
            };
        };

        /**
		 * Slide SLIDEE by amount of pixels.
		 *
		 * @param {Int}  delta     Pixels/Items. Positive means forward, negative means backward.
		 * @param {Bool} immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
        self.slideBy = function (delta, immediate) {
            if (!delta) {
                return;
            }
            slideTo(pos.dest + delta, immediate);
        };

        /**
		 * Animate SLIDEE to a specific position.
		 *
		 * @param {Int}  pos       New position.
		 * @param {Bool} immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
        self.slideTo = function (pos, immediate) {
            slideTo(pos, immediate);
        };

        /**
		 * Core method for handling `toLocation` methods.
		 *
		 * @param  {String} location
		 * @param  {Mixed}  item
		 * @param  {Bool}   immediate
		 *
		 * @return {Void}
		 */
        function to(location, item, immediate) {
            // Optional arguments logic
            if (type(item) === 'boolean') {
                immediate = item;
                item = undefined;
                v
            }

            if (item === undefined) {
                slideTo(pos[location], immediate);
            } else {

                //if (!transform) {

                //    item.scrollIntoView();
                //    return;
                //}

                var itemPos = self.getPos(item);
                if (itemPos) {
                    slideTo(itemPos[location], immediate, true);
                }
            }
        }

        /**
		 * Animate element or the whole SLIDEE to the start of the frame.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
		 * @param {Bool}  immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
        self.toStart = function (item, immediate) {
            to('start', item, immediate);
        };

        /**
		 * Animate element or the whole SLIDEE to the end of the frame.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
		 * @param {Bool}  immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
        self.toEnd = function (item, immediate) {
            to('end', item, immediate);
        };

        /**
		 * Animate element or the whole SLIDEE to the center of the frame.
		 *
		 * @param {Mixed} item      Item DOM element, or index starting at 0. Omitting will animate SLIDEE.
		 * @param {Bool}  immediate Reposition immediately without an animation.
		 *
		 * @return {Void}
		 */
        self.toCenter = function (item, immediate) {
            to('center', item, immediate);
        };

        function extend() {
            for (var i = 1; i < arguments.length; i++)
                for (var key in arguments[i])
                    if (arguments[i].hasOwnProperty(key))
                        arguments[0][key] = arguments[i][key];
            return arguments[0];
        }

        /**
		 * Registers callbacks.
		 *
		 * @param  {Mixed} name  Event name, or callbacks map.
		 * @param  {Mixed} fn    Callback, or an array of callback functions.
		 *
		 * @return {Void}
		 */
        self.on = function (name, fn) {
            // Callbacks map
            if (type(name) === 'object') {
                for (var key in name) {
                    if (name.hasOwnProperty(key)) {
                        self.on(key, name[key]);
                    }
                }
                // Callback
            } else if (type(fn) === 'function') {
                var names = name.split(' ');
                for (var n = 0, nl = names.length; n < nl; n++) {
                    callbacks[names[n]] = callbacks[names[n]] || [];
                    if (callbackIndex(names[n], fn) === -1) {
                        callbacks[names[n]].push(fn);
                    }
                }
                // Callbacks array
            } else if (type(fn) === 'array') {
                for (var f = 0, fl = fn.length; f < fl; f++) {
                    self.on(name, fn[f]);
                }
            }
        };

        /**
		 * Registers callbacks to be executed only once.
		 *
		 * @param  {Mixed} name  Event name, or callbacks map.
		 * @param  {Mixed} fn    Callback, or an array of callback functions.
		 *
		 * @return {Void}
		 */
        self.one = function (name, fn) {
            function proxy() {
                fn.apply(self, arguments);
                self.off(name, proxy);
            }

            self.on(name, proxy);
        };

        /**
		 * Remove one or all callbacks.
		 *
		 * @param  {String} name Event name.
		 * @param  {Mixed}  fn   Callback, or an array of callback functions. Omit to remove all callbacks.
		 *
		 * @return {Void}
		 */
        self.off = function (name, fn) {
            if (fn instanceof Array) {
                for (var f = 0, fl = fn.length; f < fl; f++) {
                    self.off(name, fn[f]);
                }
            } else {
                var names = name.split(' ');
                for (var n = 0, nl = names.length; n < nl; n++) {
                    callbacks[names[n]] = callbacks[names[n]] || [];
                    if (fn == null) {
                        callbacks[names[n]].length = 0;
                    } else {
                        var index = callbackIndex(names[n], fn);
                        if (index !== -1) {
                            callbacks[names[n]].splice(index, 1);
                        }
                    }
                }
            }
        };

        /**
		 * Returns callback array index.
		 *
		 * @param  {String}   name Event name.
		 * @param  {Function} fn   Function
		 *
		 * @return {Int} Callback array index, or -1 if isn't registered.
		 */
        function callbackIndex(name, fn) {
            for (var i = 0, l = callbacks[name].length; i < l; i++) {
                if (callbacks[name][i] === fn) {
                    return i;
                }
            }
            return -1;
        }

        /**
		 * Keeps track of a dragging delta history.
		 *
		 * @return {Void}
		 */
        function draggingHistoryTick() {
            // Looking at this, I know what you're thinking :) But as we need only 4 history states, doing it this way
            // as opposed to a proper loop is ~25 bytes smaller (when minified with GCC), a lot faster, and doesn't
            // generate garbage. The loop version would create 2 new variables on every tick. Unexaptable!
            dragging.history[0] = dragging.history[1];
            dragging.history[1] = dragging.history[2];
            dragging.history[2] = dragging.history[3];
            dragging.history[3] = dragging.delta;
        }

        /**
		 * Initialize continuous movement.
		 *
		 * @return {Void}
		 */
        function continuousInit(source) {
            dragging.released = 0;
            dragging.source = source;
            dragging.slidee = source === 'slidee';
        }

        function dragInitSlidee(event) {
            dragInit(event, 'slidee');
        }

        /**
		 * Dragging initiator.
		 *a
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
        function dragInit(event, source) {
            var isTouch = event.type === 'touchstart';
            var isSlidee = source === 'slidee';

            // Ignore when already in progress, or interactive element in non-touch navivagion
            if (dragging.init || !isTouch && isInteractive(event.target)) {
                return;
            }

            // SLIDEE dragging conditions
            if (isSlidee && !(isTouch ? o.touchDragging : o.mouseDragging && event.which < 2)) {
                return;
            }

            if (!isTouch) {
                // prevents native image dragging in Firefox
                stopDefault(event);
            }

            // Reset dragging object
            continuousInit(source);

            // Properties used in dragHandler
            dragging.init = 0;
            dragging.source = event.target;
            dragging.touch = isTouch;
            dragging.pointer = isTouch ? event.touches[0] : event;
            dragging.initX = dragging.pointer.pageX;
            dragging.initY = dragging.pointer.pageY;
            dragging.initPos = isSlidee ? pos.cur : hPos.cur;
            dragging.start = +new Date();
            dragging.time = 0;
            dragging.path = 0;
            dragging.delta = 0;
            dragging.locked = 0;
            dragging.history = [0, 0, 0, 0];
            dragging.pathToLock = isSlidee ? isTouch ? 30 : 10 : 0;

            // Bind dragging events
            if (isTouch) {
                dragTouchEvents.forEach(function (eventName) {
                    document.addEventListener(eventName, dragHandler);
                });
            } else {
                dragMouseEvents.forEach(function (eventName) {
                    document.addEventListener(eventName, dragHandler);
                });
            }

            // Add dragging class
            if (isSlidee) {
                slideeElement.classList.add(o.draggedClass);
            }

            // Keep track of a dragging path history. This is later used in the
            // dragging release swing calculation when dragging SLIDEE.
            if (isSlidee) {
                historyID = setInterval(draggingHistoryTick, 10);
            }
        }

        /**
		 * Handler for dragging scrollbar handle or SLIDEE.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
        function dragHandler(event) {
            dragging.released = event.type === 'mouseup' || event.type === 'touchend';
            dragging.pointer = dragging.touch ? event[dragging.released ? 'changedTouches' : 'touches'][0] : event;
            dragging.pathX = dragging.pointer.pageX - dragging.initX;
            dragging.pathY = dragging.pointer.pageY - dragging.initY;
            dragging.path = sqrt(pow(dragging.pathX, 2) + pow(dragging.pathY, 2));
            dragging.delta = o.horizontal ? dragging.pathX : dragging.pathY;

            if (!dragging.released && dragging.path < 1) return;

            // We haven't decided whether this is a drag or not...
            if (!dragging.init) {
                // If the drag path was very short, maybe it's not a drag?
                if (dragging.path < o.dragThreshold) {
                    // If the pointer was released, the path will not become longer and it's
                    // definitely not a drag. If not released yet, decide on next iteration
                    return dragging.released ? dragEnd() : undefined;
                } else {
                    // If dragging path is sufficiently long we can confidently start a drag
                    // if drag is in different direction than scroll, ignore it
                    if (o.horizontal ? abs(dragging.pathX) > abs(dragging.pathY) : abs(dragging.pathX) < abs(dragging.pathY)) {
                        dragging.init = 1;
                    } else {
                        return dragEnd();
                    }
                }
            }

            stopDefault(event);

            // Disable click on a source element, as it is unwelcome when dragging
            if (!dragging.locked && dragging.path > dragging.pathToLock && dragging.slidee) {
                dragging.locked = 1;
                dragging.source.addEventListener('click', disableOneEvent);
            }

            // Cancel dragging on release
            if (dragging.released) {
                dragEnd();

                // Adjust path with a swing on mouse release
                if (o.releaseSwing && dragging.slidee) {
                    dragging.swing = (dragging.delta - dragging.history[0]) / 40 * 300;
                    dragging.delta += dragging.swing;
                    dragging.tweese = abs(dragging.swing) > 10;
                }
            }

            slideTo(dragging.slidee ? round(dragging.initPos - dragging.delta) : handleToSlidee(dragging.initPos + dragging.delta));
        }

        /**
		 * Stops dragging and cleans up after it.
		 *
		 * @return {Void}
		 */
        function dragEnd() {
            clearInterval(historyID);
            dragging.released = true;

            if (dragging.touch) {
                dragTouchEvents.forEach(function (eventName) {
                    document.removeEventListener(eventName, dragHandler);
                });
            } else {
                dragMouseEvents.forEach(function (eventName) {
                    document.removeEventListener(eventName, dragHandler);
                });
            }

            if (dragging.slidee) {
                slideeElement.classList.remove(o.draggedClass);
            }

            // Make sure that disableOneEvent is not active in next tick.
            setTimeout(function () {
                dragging.source.removeEventListener('click', disableOneEvent);
            });

            dragging.init = 0;
        }

        /**
		 * Check whether element is interactive.
		 *
		 * @return {Boolean}
		 */
        function isInteractive(element) {

            while (element) {

                if (interactiveElements.indexOf(element.tagName) != -1) {
                    return true;
                }

                element = element.parentNode;
            }
            return false;
        }

        /**
		 * Mouse wheel delta normalization.
		 *
		 * @param  {Event} event
		 *
		 * @return {Int}
		 */
        function normalizeWheelDelta(event) {
            // wheelDelta needed only for IE8-
            scrolling.curDelta = ((o.horizontal ? event.deltaY || event.deltaX : event.deltaY) || -event.wheelDelta);
            scrolling.curDelta /= event.deltaMode === 1 ? 3 : 100;
            return scrolling.curDelta;
        }

        /**
		 * Mouse scrolling handler.
		 *
		 * @param  {Event} event
		 *
		 * @return {Void}
		 */
        function scrollHandler(event) {
            // Mark event as originating in a Sly instance
            event[namespace] = self;
            // Don't hijack global scrolling
            var time = +new Date();
            if (lastGlobalWheel + o.scrollHijack > time && scrollSource !== document && scrollSource !== window) {
                lastGlobalWheel = time;
                return;
            }
            // Ignore if there is no scrolling to be done
            if (!o.scrollBy || pos.start === pos.end) {
                return;
            }
            var delta = normalizeWheelDelta(event);
            // Trap scrolling only when necessary and/or requested
            if (o.scrollTrap || delta > 0 && pos.dest < pos.end || delta < 0 && pos.dest > pos.start) {
                stopDefault(event, 1);
            }
            self.slideBy(o.scrollBy * delta);
        }

        /**
		 * Destroys instance and everything it created.
		 *
		 * @return {Void}
		 */
        self.destroy = function () {

            scrollSource.removeEventListener(wheelEvent, scrollHandler);

            // Reset native FRAME element scroll
            frameElement.removeEventListener('scroll', resetScroll);

            // Clean up collections
            last = {};

            // Reset initialized status and return the instance
            self.initialized = 0;
            return self;
        };

        /**
		 * Initialize.
		 *
		 * @return {Object}
		 */
        self.init = function () {
            if (self.initialized) {
                return;
            }

            // Disallow multiple instances on the same element
            if (frame.sly) throw new Error('There is already a Sly instance on this element');

            frame.sly = true;

            // Register callbacks map
            self.on(callbackMap);

            // Set required styles
            var movables = [];
            if (slideeElement) {
                movables.push(slideeElement);
            }

            //frameElement.style.overflow = 'hidden';

            //if (!transform && getComputedStyle(frameElement, null).getPropertyValue('position') === 'static') {
            //    frameElement.style.position = 'relative';
            //}
            if (!transform) {
                //movables.forEach(function (m) {
                //    m.style.position = 'absolute';
                //});
                if (o.horizontal) {
                    slideeElement.classList.add('hiddenScrollX');
                } else {
                    slideeElement.classList.add('hiddenScrollY');
                }
                slideeElement.style['scroll-behavior'] = 'smooth';
            }

            // Scrolling navigation
            scrollSource.addEventListener(wheelEvent, scrollHandler);

            if (transform) {
                dragInitEventNames.forEach(function (eventName) {
                    dragSourceElement.addEventListener(eventName, dragInitSlidee);
                });

                // Reset native FRAME element scroll
                frameElement.addEventListener('scroll', resetScroll);
            }

            // Mark instance as initialized
            self.initialized = 1;

            // Load
            load(true);

            // Return instance
            return self;
        };
    };

});