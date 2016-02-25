define(['loading', 'appSettings', 'qualityoptions', 'userSettings', 'apiClientResolver', 'focusManager'], function (loading, appSettings, qualityoptions, userSettings, apiClientResolver, focusManager) {

    return function (view, params) {

        var self = this;

        view.addEventListener('viewbeforeshow', function (e) {

            var isRestored = e.detail.isRestored;

            Emby.Page.setTitle(Globalize.translate('core#PlaybackSettings'));

            loading.hide();

            if (!isRestored) {
                renderSettings();
            }
        });

        view.addEventListener('viewbeforehide', function (e) {

            var selectStreamingBitrate = view.querySelector('.selectStreamingBitrate');
            var selectEnableCinemaMode = view.querySelector('.selectEnableCinemaMode');

            if (selectStreamingBitrate.getValue()) {
                appSettings.maxStreamingBitrate(selectStreamingBitrate.getValue());
                appSettings.enableAutomaticBitrateDetection(false);
            } else {
                appSettings.enableAutomaticBitrateDetection(true);
            }

            userSettings.enableCinemaMode(selectEnableCinemaMode.getValue() == 'true');

            var playDefaultAudioTrack = view.querySelector('.selectPlayDefaultAudioTrack').getValue();
            var audioLanguage = view.querySelector('.selectAudioLanguage').getValue();
            var subtitleLanguage = view.querySelector('.selectSubtitleLanguage').getValue();
            var subtitleMode = view.querySelector('.selectSubtitleMode').getValue();
            var episodeAutoPlay = view.querySelector('.selectEpisodeAutoPlay').getValue();

            userSettings.serverConfig().then(function (config) {

                config.PlayDefaultAudioTrack = playDefaultAudioTrack == 'true';
                config.AudioLanguagePreference = audioLanguage || null;
                config.SubtitleLanguagePreference = subtitleLanguage || null;
                config.SubtitleMode = subtitleMode;
                config.EnableNextEpisodeAutoPlay = episodeAutoPlay == 'true';
                userSettings.serverConfig(config);
            });
        });

        function renderSettings() {

            focusManager.autoFocus(view);

            var selectStreamingBitrate = view.querySelector('.selectStreamingBitrate');
            var selectEnableCinemaMode = view.querySelector('.selectEnableCinemaMode');

            var bitrateOptions = qualityoptions.getVideoQualityOptions().map(function (i) {
                return {
                    name: i.name,
                    value: i.bitrate
                };
            });

            bitrateOptions.unshift({
                name: Globalize.translate('core#OptionAutomatic'),
                value: ''
            });

            selectStreamingBitrate.setOptions(bitrateOptions);

            if (appSettings.enableAutomaticBitrateDetection()) {
                selectStreamingBitrate.setValue('');
            } else {
                selectStreamingBitrate.setValue(appSettings.maxStreamingBitrate());
            }
            selectStreamingBitrate.setValue('2');

            selectEnableCinemaMode.setValue(userSettings.enableCinemaMode());

            var culturesPromise = apiClientResolver().getCultures();
            var configPromise = userSettings.serverConfig();

            Promise.all([culturesPromise, configPromise]).then(function (responses) {

                var cultures = responses[0];
                var config = responses[1];

                view.querySelector('.selectPlayDefaultAudioTrack').setValue(config.PlayDefaultAudioTrack);
                view.querySelector('.selectSubtitleMode').setValue(config.SubtitleMode);
                view.querySelector('.selectEpisodeAutoPlay').setValue(config.EnableNextEpisodeAutoPlay || false);

                var selectAudioLanguage = view.querySelector('.selectAudioLanguage');
                fillLanguages(selectAudioLanguage, cultures);
                selectAudioLanguage.setValue(config.AudioLanguagePreference || "");

                var selectSubtitleLanguage = view.querySelector('.selectSubtitleLanguage');
                fillLanguages(selectSubtitleLanguage, cultures);
                selectSubtitleLanguage.setValue(config.SubtitleLanguagePreference || "");
            });
        }

        function fillLanguages(select, languages) {

            select.setOptions(languages.map(function (culture) {
                return {
                    name: culture.DisplayName,
                    value: culture.ThreeLetterISOLanguageName
                };
            }));
        }
    }

});