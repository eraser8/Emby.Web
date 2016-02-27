define(['browser', 'pluginManager'], function (browser, pluginManager) {

    return function () {

        var self = this;

        self.name = 'Html Video Player';
        self.type = 'mediaplayer';
        self.id = 'htmlvideoplayer';

        // Let any players created by plugins take priority
        self.priority = 1;

        var mediaElement;
        var videoDialog;
        var currentSrc;
        var started = false;
        var hlsPlayer;

        var currentPlayOptions;

        var seekToSecondsOnPlaying;
        var subtitleTrackIndexToSetOnPlaying;

        self.canPlayMediaType = function (mediaType) {

            return (mediaType || '').toLowerCase() == 'video';
        };

        self.getDeviceProfile = function () {

            return new Promise(function (resolve, reject) {

                require(['browserdeviceprofile'], resolve);
            });
        };

        self.currentSrc = function () {
            return currentSrc;
        };

        self.play = function (options) {

            started = false;

            return new Promise(function (resolve, reject) {

                createMediaElement(options).then(function (elem) {

                    setCurrentSrc(elem, options).then(resolve, reject);
                });
            });
        };

        function getCrossOriginValue(mediaSource) {

            return 'anonymous';
        }

        function setCurrentSrc(elem, options) {

            return new Promise(function (resolve, reject) {

                //if (!elem) {
                //    currentSrc = null;
                //    resolve();
                //    return;
                //}

                //if (!options) {
                //    currentSrc = null;
                //    elem.src = null;
                //    elem.src = "";

                //    // When the browser regains focus it may start auto-playing the last video
                //    //if ($.browser.safari) {
                //    //    elem.src = 'files/dummy.mp4';
                //    //    elem.play();
                //    //}

                //    resolve();
                //    return;
                //}

                var val = options.url;

                console.log('playing url: ' + val);

                var dependencies = [];
                var enableHlsJs = enableHlsPlayer(val);

                if (enableHlsJs) {
                    dependencies.push('hlsjs');
                }

                require(dependencies, function (Hls) {

                    //if (AppInfo.isNativeApp && $.browser.safari) {
                    //    val = val.replace('file://', '');
                    //}

                    // Convert to seconds
                    seekToSecondsOnPlaying = (options.playerStartPositionTicks || 0) / 10000000;

                    if (seekToSecondsOnPlaying) {
                        val += '#t=' + seekToSecondsOnPlaying;
                    }

                    var playNow = false;

                    destroyHlsPlayer();

                    var tracks = options.textTracks || [];
                    var currentTrackIndex = -1;
                    for (var i = 0, length = tracks.length; i < length; i++) {
                        if (tracks[i].isDefault) {
                            currentTrackIndex = tracks[i].index;
                            break;
                        }
                    }
                    subtitleTrackIndexToSetOnPlaying = currentTrackIndex;

                    currentPlayOptions = options;

                    elem.crossOrigin = getCrossOriginValue(options.mediaSource);

                    if (enableHlsJs) {

                        setTracks(elem, tracks);

                        var hls = new Hls();
                        hls.loadSource(val);
                        hls.attachMedia(elem);
                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            elem.play();
                        });
                        hlsPlayer = hls;

                    } else {

                        elem.src = val;
                        elem.autoplay = true;

                        setTracks(elem, tracks);

                        elem.addEventListener('loadedmetadata', onLoadedMetadata);
                        playNow = true;
                    }

                    setCurrentTrackElement(currentTrackIndex);

                    currentSrc = val;

                    if (playNow) {
                        elem.play();
                    }

                    resolve();
                });
            });
        }

        self.setSubtitleStreamIndex = function (index) {

            setCurrentTrackElement(index);
        };

        self.canSetAudioStreamIndex = function () {
            return false;
        };

        self.setAudioStreamIndex = function (index) {

        };

        // Save this for when playback stops, because querying the time at that point might return 0
        self.currentTime = function (val) {

            if (mediaElement) {
                if (val != null) {
                    mediaElement.currentTime = val / 1000;
                    return;
                }

                return (mediaElement.currentTime || 0) * 1000;
            }
        };

        self.duration = function (val) {

            if (mediaElement) {
                return mediaElement.duration;
            }

            return null;
        };

        self.stop = function (destroyPlayer, reportEnded) {

            return new Promise(function (resolve, reject) {

                var elem = mediaElement;
                var src = currentSrc;

                if (elem && src) {

                    elem.pause();

                    destroyHlsPlayer();

                    onEndedInternal(reportEnded);

                    if (destroyPlayer) {
                        self.destroy();
                    }
                }

                resolve();
            });
        };

        self.destroy = function () {

            destroyHlsPlayer();
            Emby.Page.setTransparency(Emby.TransparencyLevel.None);

            var videoElement = mediaElement;

            if (videoElement) {

                mediaElement = null;

                videoElement.removeEventListener('timeupdate', onTimeUpdate);
                videoElement.removeEventListener('ended', onEnded);
                videoElement.removeEventListener('volumechange', onVolumeChange);
                videoElement.removeEventListener('pause', onPause);
                videoElement.removeEventListener('playing', onPlaying);
                videoElement.removeEventListener('error', onError);
                videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                videoElement.removeEventListener('click', onClick);
                videoElement.removeEventListener('dblclick', onDblClick);
            }

            var dlg = videoDialog;
            if (dlg) {

                videoDialog = null;

                dlg.parentNode.removeChild(dlg);
            }
        };

        function destroyHlsPlayer() {
            var player = hlsPlayer;
            if (player) {
                try {
                    player.destroy();
                }
                catch (err) {
                    console.log(err);
                }

                hlsPlayer = null;
            }
        }

        self.pause = function () {
            if (mediaElement) {
                mediaElement.pause();
            }
        };

        self.unpause = function () {
            if (mediaElement) {
                mediaElement.play();
            }
        };

        self.paused = function () {

            if (mediaElement) {
                return mediaElement.paused;
            }

            return false;
        };

        self.volume = function (val) {
            if (mediaElement) {
                if (val != null) {
                    mediaElement.volume = val / 100;
                    return;
                }

                return mediaElement.volume * 100;
            }
        };

        self.setMute = function (mute) {

            if (mute) {
                self.volume(0);
            } else {

                if (self.isMuted()) {
                    self.volume(50);
                }
            }
        };

        self.isMuted = function () {
            return self.volume() == 0;
        };

        function onEnded() {

            onEndedInternal(true);
        }

        function onEndedInternal(triggerEnded) {

            if (triggerEnded) {
                var stopInfo = {
                    src: currentSrc
                };

                Events.trigger(self, 'stopped', [stopInfo]);
            }

            currentSrc = null;
        }

        function onTimeUpdate() {

            Events.trigger(self, 'timeupdate');
        }

        function onVolumeChange() {

            Events.trigger(self, 'volumechange');
        }

        function shouldGoFullscreen(options) {

            return options.fullscreen !== false;
        }

        function onPlaying(e) {

            if (!started) {
                started = true;

                setCurrentTrackElement(subtitleTrackIndexToSetOnPlaying);

                //var requiresNativeControls = !self.enableCustomVideoControls();

                //if (requiresNativeControls) {
                //    $(element).attr('controls', 'controls');
                //}
                seekOnPlaybackStart(e.target);

                if (shouldGoFullscreen(currentPlayOptions)) {

                    Emby.Page.showVideoOsd().then(function () {

                        videoDialog.classList.remove('onTop');
                    });

                } else {
                    Emby.Page.setTransparency(Emby.TransparencyLevel.Backdrop);
                    videoDialog.classList.remove('onTop');
                }

                require(['loading'], function (loading) {

                    loading.hide();
                });

                Events.trigger(self, 'started');
            }
            Events.trigger(self, 'playing');
        }

        function seekOnPlaybackStart(element) {

            var seconds = seekToSecondsOnPlaying;

            if (seconds) {
                var src = (self.currentSrc() || '').toLowerCase();

                // Appending #t=xxx to the query string doesn't seem to work with HLS
                if (src.indexOf('.m3u8') != -1) {

                    var delay = browser.safari ? 2500 : 0;
                    if (delay) {
                        setTimeout(function () {
                            element.currentTime = seconds;
                        }, delay);
                    } else {
                        element.currentTime = seconds;
                    }
                }
            }
        }

        function onClick() {
            Events.trigger(self, 'click');
        }

        function onDblClick() {
            Events.trigger(self, 'dblclick');
        }

        function onPause() {
            Events.trigger(self, 'pause');
        }

        function onError() {

            var errorCode = this.error ? this.error.code : '';
            console.log('Media element error code: ' + errorCode);

            Events.trigger(self, 'error');
        }

        function onLoadedMetadata(e) {

            var mediaElem = e.target;
            mediaElem.removeEventListener('loadedmetadata', onLoadedMetadata);

            if (!hlsPlayer) {
                mediaElem.play();
            }
        }

        function enableHlsPlayer(src) {

            if (src) {
                if (src.indexOf('.m3u8') == -1) {
                    return false;
                }
            }

            return window.MediaSource != null && !canPlayNativeHls();
        }

        function canPlayNativeHls() {
            var media = document.createElement('video');

            if (media.canPlayType('application/x-mpegURL').replace(/no/, '') ||
                media.canPlayType('application/vnd.apple.mpegURL').replace(/no/, '')) {
                return true;
            }

            return false;
        }

        function enableCustomVideoControls() {
            return true;
        }

        function setTracks(elem, tracks) {

            var elementIndex = 0;
            var html = tracks.map(function (t) {

                var defaultAttribute = t.isDefault ? ' default' : '';

                var txt = '<track id="textTrack' + t.index + '" kind="subtitles" src="' + t.url + '" srclang="' + t.language + '"' + defaultAttribute + '></track>';
                elementIndex++;
                return txt;

            }).join('');

            elem.innerHTML = html;
        }

        var _supportsTextTracks;
        function supportsTextTracks() {

            if (_supportsTextTracks == null) {
                _supportsTextTracks = document.createElement('video').textTracks != null;
            }

            // For now, until ready
            return _supportsTextTracks;
        }

        function setCurrentTrackElement(streamIndex) {

            console.log('Setting new text track index to: ' + streamIndex);

            var allTracks = mediaElement.textTracks; // get list of tracks

            var expectedId = 'textTrack' + streamIndex;

            for (var i = 0; i < allTracks.length; i++) {

                var currentTrack = allTracks[i];

                if (currentTrack.id == expectedId) {
                    console.log('Setting track ' + i + ' mode to: showing');
                    allTracks[i].mode = 'showing'; // show this track
                } else {
                    console.log('Setting track ' + i + ' mode to: disabled');
                    allTracks[i].mode = 'disabled'; // hide all other tracks
                }

            }
        };

        function updateTextStreamUrls(startPositionTicks) {

            if (!supportsTextTracks()) {
                return;
            }

            var allTracks = mediaElement.textTracks; // get list of tracks
            var i;

            for (i = 0; i < allTracks.length; i++) {

                var track = allTracks[i];

                // This throws an error in IE, but is fine in chrome
                // In IE it's not necessary anyway because changing the src seems to be enough
                try {
                    while (track.cues.length) {
                        track.removeCue(track.cues[0]);
                    }
                } catch (e) {
                    console.log('Error removing cue from textTrack');
                }
            }

            var tracks = mediaElement.querySelectorAll('track');
            for (i = 0; i < tracks.length; i++) {

                var track = tracks[i];

                track.src = replaceQueryString(track.src, 'startPositionTicks', startPositionTicks);
            }
        }

        function zoomIn(elem, iterations) {
            var keyframes = [
                { transform: 'scale3d(.2, .2, .2)  ', opacity: '.6', offset: 0 },
              { transform: 'none', opacity: '1', offset: 1 }
            ];

            var timing = { duration: 240, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function createMediaElement(options) {

            return new Promise(function (resolve, reject) {

                var dlg = document.querySelector('.videoPlayerContainer');

                if (!dlg) {

                    require(['loading', 'css!' + pluginManager.mapPath(self, 'style.css')], function (loading) {

                        loading.show();

                        var requiresNativeControls = !enableCustomVideoControls();

                        // Safari often displays the poster under the video and it doesn't look good
                        var poster = /*!$.browser.safari &&*/ options.poster ? (' poster="' + options.poster + '"') : '';
                        poster = '';

                        var dlg = document.createElement('div');

                        dlg.classList.add('videoPlayerContainer');

                        if (shouldGoFullscreen(options)) {
                            dlg.classList.add('onTop');
                        }

                        var html = '';
                        // Can't autoplay in these browsers so we need to use the full controls
                        if (requiresNativeControls) {
                            html += '<video preload="metadata" autoplay="autoplay"' + poster + ' controls="controls" webkit-playsinline>';
                        }
                        else {

                            // Chrome 35 won't play with preload none
                            html += '<video preload="metadata" autoplay="autoplay"' + poster + ' webkit-playsinline>';
                        }

                        html += '</video>';

                        dlg.innerHTML = html;
                        var videoElement = dlg.querySelector('video');

                        videoElement.addEventListener('timeupdate', onTimeUpdate);
                        videoElement.addEventListener('ended', onEnded);
                        videoElement.addEventListener('volumechange', onVolumeChange);
                        videoElement.addEventListener('pause', onPause);
                        videoElement.addEventListener('playing', onPlaying);
                        videoElement.addEventListener('error', onError);
                        videoElement.addEventListener('click', onClick);
                        videoElement.addEventListener('dblclick', onDblClick);

                        document.body.insertBefore(dlg, document.body.firstChild);
                        videoDialog = dlg;
                        mediaElement = videoElement;

                        if (shouldGoFullscreen(options)) {
                            zoomIn(dlg, 1).onfinish = function () {
                                resolve(videoElement);
                            };
                        } else {
                            resolve(videoElement);
                        }

                    });

                } else {
                    resolve(dlg.querySelector('video'));
                }
            });
        }
    }
});