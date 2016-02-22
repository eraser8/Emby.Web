define(['playbackManager', 'slyScroller', 'loading', 'imageLoader', './../components/backdrop', './../components/listview', 'focusManager', 'itemShortcuts'], function (playbackManager, slyScroller, loading, imageLoader, themeBackdrop, listview, focusManager, itemShortcuts) {

    function createVerticalScroller(view, pageInstance) {

        var scrollFrame = view.querySelector('.scrollFrame');

        var options = {
            horizontal: 0,
            itemNav: 0,
            mouseDragging: 1,
            touchDragging: 1,
            slidee: view.querySelector('.scrollSlider'),
            itemSelector: '.card',
            smart: true,
            easing: 'easeOutQuart',
            releaseSwing: true,
            scrollBar: view.querySelector('.scrollbar'),
            scrollBy: 200,
            speed: 300,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1
        };

        slyScroller.create(scrollFrame, options).then(function (slyFrame) {
            pageInstance.slyFrame = slyFrame;
            slyFrame.init();
            initFocusHandler(view, slyFrame);
        });
    }

    function initFocusHandler(view, slyFrame) {

        var scrollSlider = view.querySelector('.scrollSlider');
        scrollSlider.addEventListener('focus', function (e) {

            var focused = focusManager.focusableParent(e.target);

            if (focused) {
                slyFrame.toCenter(focused);
            }

        }, true);
    }

    return function (view, params) {

        var self = this;

        function setCurrentItem(item) {

            if (item) {
                themeBackdrop.setBackdrops([item]);

            } else {
                themeBackdrop.setBackdrops([]);
            }
            updateCurrentPlaylistItem();
        }

        function onPlaybackStart(e, player) {

            setCurrentItem(playbackManager.currentItem(player));
        }

        function onPlaybackStop(e) {
            setCurrentItem(null);
        }

        function renderPlaylist() {

            var section = view.querySelector('.trackList');

            var items = playbackManager.playlist();

            section.innerHTML = listview.getListViewHtml(items, {
                action: 'setplaylistindex',
                showParentTitle: true,
                enableSideMediaInfo: true
            });

            itemShortcuts.off(section);
            itemShortcuts.on(section);

            imageLoader.lazyChildren(section);

            focusManager.autoFocus(section);
            updateCurrentPlaylistItem();
        }

        function updateCurrentPlaylistItem() {

            var index = playbackManager.currentPlaylistIndex();

            var current = view.querySelector('.playlistIndexIndicatorImage');
            if (current) {
                current.classList.remove('playlistIndexIndicatorImage');
            }

            if (index != -1) {

                var item = view.querySelectorAll('.trackList .itemAction')[index];
                if (item) {
                    var img = item.querySelector('.paperIconItemImage');

                    img.classList.add('playlistIndexIndicatorImage');
                }
            }
        }

        view.addEventListener('viewshow', function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(Globalize.translate('NowPlaying'));

            Events.on(playbackManager, 'playbackstart', onPlaybackStart);
            Events.on(playbackManager, 'playbackstop', onPlaybackStop);

            renderPlaylist();

            onPlaybackStart(e, playbackManager.currentPlayer());

            if (!isRestored) {
                createVerticalScroller(view, self);
            }
        });

        view.addEventListener('viewhide', function () {

            Events.off(playbackManager, 'playbackstart', onPlaybackStart);
            Events.off(playbackManager, 'playbackstop', onPlaybackStop);

        });

        view.addEventListener('viewdestroy', function () {

            if (self.slyFrame) {
                self.slyFrame.destroy();
            }
        });
    }

});