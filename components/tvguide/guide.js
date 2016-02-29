define(['loading', 'datetime', 'focusManager', 'imageLoader', 'itemShortcuts', 'css!./guide.css'], function (loading, datetime, focusManager, imageLoader, itemShortcuts) {

    return function (options) {

        var self = this;
        var lastFocus = 0;

        self.refresh = function () {
            reloadPage(options.element);
        };

        // 30 mins
        var cellCurationMinutes = 30;
        var cellDurationMs = cellCurationMinutes * 60 * 1000;
        var msPerDay = 86400000;

        var currentDate;

        var defaultChannels = 50;
        var channelLimit = 1000;

        var channelQuery = {

            StartIndex: 0,
            Limit: defaultChannels,
            EnableFavoriteSorting: true
        };

        var channelsPromise;

        function normalizeDateToTimeslot(date) {

            var minutesOffset = date.getMinutes() - cellCurationMinutes;

            if (minutesOffset >= 0) {

                date.setHours(date.getHours(), cellCurationMinutes, 0, 0);

            } else {

                date.setHours(date.getHours(), 0, 0, 0);
            }

            return date;
        }

        function reloadChannels(context) {
            channelsPromise = null;
            reloadGuide(context);
        }

        function showLoading() {
            loading.show();
        }

        function hideLoading() {
            loading.hide();
        }

        function reloadGuide(context, newStartDate) {

            showLoading();

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                channelQuery.UserId = apiClient.getCurrentUserId();

                channelQuery.Limit = Math.min(channelQuery.Limit || defaultChannels, channelLimit);
                channelQuery.AddCurrentProgram = false;

                channelsPromise = channelsPromise || apiClient.getLiveTvChannels(channelQuery);

                var date = newStartDate;
                // Add one second to avoid getting programs that are just ending
                date = new Date(date.getTime() + 1000);

                // Subtract to avoid getting programs that are starting when the grid ends
                var nextDay = new Date(date.getTime() + msPerDay - 2000);

                console.log(nextDay);
                channelsPromise.then(function (channelsResult) {

                    apiClient.getLiveTvPrograms({
                        UserId: apiClient.getCurrentUserId(),
                        MaxStartDate: nextDay.toISOString(),
                        MinEndDate: date.toISOString(),
                        channelIds: channelsResult.Items.map(function (c) {
                            return c.Id;
                        }).join(','),
                        ImageTypeLimit: 1,
                        EnableImageTypes: "Primary",
                        SortBy: "StartDate"

                    }).then(function (programsResult) {

                        renderGuide(context, date, channelsResult.Items, programsResult.Items, apiClient);

                        hideLoading();

                    });
                });
            });
        }

        function getDisplayTime(date) {

            if ((typeof date).toString().toLowerCase() === 'string') {
                try {

                    date = datetime.parseISO8601Date(date, { toLocal: true });

                } catch (err) {
                    return date;
                }
            }

            var lower = date.toLocaleTimeString().toLowerCase();

            var hours = date.getHours();
            var minutes = date.getMinutes();

            var text;

            if (lower.indexOf('am') != -1 || lower.indexOf('pm') != -1) {

                var suffix = hours > 11 ? 'pm' : 'am';

                hours = (hours % 12) || 12;

                text = hours;

                if (minutes) {

                    text += ':';
                    if (minutes < 10) {
                        text += '0';
                    }
                    text += minutes;
                }

                text += suffix;

            } else {
                text = hours + ':';

                if (minutes < 10) {
                    text += '0';
                }
                text += minutes;
            }

            return text;
        }


        function getTimeslotHeadersHtml(startDate, endDateTime) {

            var html = '';

            // clone
            startDate = new Date(startDate.getTime());

            html += '<div class="timeslotHeadersInner">';

            while (startDate.getTime() < endDateTime) {

                html += '<div class="timeslotHeader">';

                html += getDisplayTime(startDate);
                html += '</div>';

                // Add 30 mins
                startDate.setTime(startDate.getTime() + cellDurationMs);
            }
            html += '</div>';

            return html;
        }

        function parseDates(program) {

            if (!program.StartDateLocal) {
                try {

                    program.StartDateLocal = datetime.parseISO8601Date(program.StartDate, { toLocal: true });

                } catch (err) {

                }

            }

            if (!program.EndDateLocal) {
                try {

                    program.EndDateLocal = datetime.parseISO8601Date(program.EndDate, { toLocal: true });

                } catch (err) {

                }

            }

            return null;
        }

        function getChannelProgramsHtml(context, date, channel, programs) {

            var html = '';

            var startMs = date.getTime();
            var endMs = startMs + msPerDay - 1;

            programs = programs.filter(function (curr) {
                return curr.ChannelId == channel.Id;
            });

            html += '<div class="channelPrograms">';

            for (var i = 0, length = programs.length; i < length; i++) {

                var program = programs[i];

                if (program.ChannelId != channel.Id) {
                    continue;
                }

                parseDates(program);

                if (program.EndDateLocal.getTime() < startMs) {
                    continue;
                }

                if (program.StartDateLocal.getTime() > endMs) {
                    break;
                }

                var renderStartMs = Math.max(program.StartDateLocal.getTime(), startMs);
                var startPercent = (program.StartDateLocal.getTime() - startMs) / msPerDay;
                startPercent *= 100;
                startPercent = Math.max(startPercent, 0);

                var renderEndMs = Math.min(program.EndDateLocal.getTime(), endMs);
                var endPercent = (renderEndMs - renderStartMs) / msPerDay;
                endPercent *= 100;

                var cssClass = "programCell clearButton itemAction";
                var addAccent = true;

                if (program.IsKids) {
                    cssClass += " childProgramInfo";
                } else if (program.IsSports) {
                    cssClass += " sportsProgramInfo";
                } else if (program.IsNews) {
                    cssClass += " newsProgramInfo";
                } else if (program.IsMovie) {
                    cssClass += " movieProgramInfo";
                }
                else {
                    cssClass += " plainProgramInfo";
                    addAccent = false;
                }

                html += '<button data-action="link" data-isfolder="' + program.IsFolder + '" data-id="' + program.Id + '" data-type="' + program.Type + '" class="' + cssClass + '" style="left:' + startPercent + '%;width:' + endPercent + '%;">';

                var guideProgramNameClass = "guideProgramName";

                html += '<div class="' + guideProgramNameClass + '">';
                html += program.Name;
                html += '</div>';

                if (program.IsHD) {
                    html += '<iron-icon icon="core:hd"></iron-icon>';
                }

                //html += '<div class="guideProgramTime">';
                //if (program.IsLive) {
                //    html += '<span class="liveTvProgram">' + Globalize.translate('LabelLiveProgram') + '&nbsp;&nbsp;</span>';
                //}
                //else if (program.IsPremiere) {
                //    html += '<span class="premiereTvProgram">' + Globalize.translate('LabelPremiereProgram') + '&nbsp;&nbsp;</span>';
                //}
                //else if (program.IsSeries && !program.IsRepeat) {
                //    html += '<span class="newTvProgram">' + Globalize.translate('LabelNewProgram') + '&nbsp;&nbsp;</span>';
                //}

                //html += getDisplayTime(program.StartDateLocal);
                //html += ' - ';
                //html += getDisplayTime(program.EndDateLocal);

                if (program.SeriesTimerId) {
                    html += '<iron-icon class="seriesTimerIcon" icon="core:fiber-smart-record"></iron-icon>';
                }
                else if (program.TimerId) {
                    html += '<iron-icon class="timerIcon" icon="core:fiber-manual-record"></iron-icon>';
                }

                if (addAccent) {
                    html += '<div class="programAccent"></div>';
                }

                html += '</button>';
            }

            html += '</div>';

            return html;
        }

        function renderPrograms(context, date, channels, programs) {

            var html = [];

            for (var i = 0, length = channels.length; i < length; i++) {

                html.push(getChannelProgramsHtml(context, date, channels[i], programs));
            }

            var programGrid = context.querySelector('.programGrid');
            programGrid.innerHTML = html.join('');

            programGrid.scrollTop = 0;
            programGrid.scrollLeft = 0;
        }

        function renderChannelHeaders(context, channels, apiClient) {

            var html = '';

            for (var i = 0, length = channels.length; i < length; i++) {

                var channel = channels[i];

                html += '<button type="button" class="channelHeaderCell clearButton itemAction" data-action="link" data-isfolder="' + channel.IsFolder + '" data-id="' + channel.Id + '" data-type="' + channel.Type + '">';

                var hasChannelImage = channel.ImageTags.Primary;
                var cssClass = hasChannelImage ? 'guideChannelInfo guideChannelInfoWithImage' : 'guideChannelInfo';

                html += '<div class="' + cssClass + '">' + channel.Number + '</div>';

                if (hasChannelImage) {

                    var url = apiClient.getScaledImageUrl(channel.Id, {
                        maxHeight: 200,
                        tag: channel.ImageTags.Primary,
                        type: "Primary"
                    });

                    html += '<div class="guideChannelImage lazy" data-src="' + url + '"></div>';
                }

                html += '</button>';
            }

            var channelList = context.querySelector('.channelList');
            channelList.innerHTML = html;
            imageLoader.lazyChildren(channelList);
        }

        function renderGuide(context, date, channels, programs, apiClient) {

            renderChannelHeaders(context, channels, apiClient);

            var startDate = date;
            var endDate = new Date(startDate.getTime() + msPerDay);
            context.querySelector('.timeslotHeaders').innerHTML = getTimeslotHeadersHtml(startDate, endDate);
            renderPrograms(context, date, channels, programs);

            focusManager.autoFocus(context.querySelector('.programGrid'), true);
        }

        var gridScrolling = false;
        var headersScrolling = false;
        function onProgramGridScroll(context, elem) {

            if (!headersScrolling) {
                gridScrolling = true;

                context.querySelector('.timeslotHeaders').scrollTo(elem.scrollLeft, 0);
                gridScrolling = false;
            }
        }

        function onTimeslotHeadersScroll(context, elem) {

            if (!gridScrolling) {
                headersScrolling = true;
                //context.querySelector('.programGrid').scrollTo(elem.scrollLeft, 0);
                headersScrolling = false;
            }
        }

        function getFutureDateText(date) {

            var weekday = [];
            weekday[0] = Globalize.translate('OptionSundayShort');
            weekday[1] = Globalize.translate('OptionMondayShort');
            weekday[2] = Globalize.translate('OptionTuesdayShort');
            weekday[3] = Globalize.translate('OptionWednesdayShort');
            weekday[4] = Globalize.translate('OptionThursdayShort');
            weekday[5] = Globalize.translate('OptionFridayShort');
            weekday[6] = Globalize.translate('OptionSaturdayShort');

            var day = weekday[date.getDay()];
            date = date.toLocaleDateString();

            if (date.toLowerCase().indexOf(day.toLowerCase()) == -1) {
                return day + " " + date;
            }

            return date;
        }

        function changeDate(page, date) {

            var newStartDate = normalizeDateToTimeslot(date);
            currentDate = newStartDate;

            reloadGuide(page, newStartDate);

            var text = getFutureDateText(date);
            text = '<span class="currentDay">' + text.replace(' ', ' </span>');
            page.querySelector('.btnSelectDate').innerHTML = text;
        }

        var dateOptions = [];

        function setDateRange(page, guideInfo) {

            var today = new Date();
            today.setHours(today.getHours(), 0, 0, 0);

            var start = datetime.parseISO8601Date(guideInfo.StartDate, { toLocal: true });
            var end = datetime.parseISO8601Date(guideInfo.EndDate, { toLocal: true });

            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (start.getTime() >= end.getTime()) {
                end.setDate(start.getDate() + 1);
            }

            start = new Date(Math.max(today, start));

            dateOptions = [];

            while (start <= end) {

                dateOptions.push({
                    name: getFutureDateText(start),
                    id: start.getTime()
                });

                start.setDate(start.getDate() + 1);
                start.setHours(0, 0, 0, 0);
            }

            var date = new Date();

            if (currentDate) {
                date.setTime(currentDate.getTime());
            }

            changeDate(page, date);
        }

        function reloadPageAfterValidation(page, limit) {

            channelLimit = limit;

            require(['connectionManager'], function (connectionManager) {

                var apiClient = connectionManager.currentApiClient();

                apiClient.getLiveTvGuideInfo().then(function (guideInfo) {

                    setDateRange(page, guideInfo);
                });
            });
        }

        function reloadPage(page) {

            showLoading();

            reloadPageAfterValidation(page, 1000);
        }

        function selectDate(page) {

            require(['actionsheet'], function (actionsheet) {

                actionsheet.show({
                    items: dateOptions,
                    title: Globalize.translate('core#HeaderSelectDate'),
                    callback: function (id) {

                        var date = new Date();
                        date.setTime(parseInt(id));
                        changeDate(page, date);
                    }
                });

            });
        }

        function createVerticalScroller(view, pageInstance) {

            initNativeFocusHandler(view, view.querySelector('.hiddenScrollY'), false);
            initNativeFocusHandler(view, view.querySelector('.programGrid'), true);
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

        function getPos(scrollContainer, item, horizontal) {
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
        };

        function initNativeFocusHandler(view, scrollSlider, horizontal) {

            scrollSlider.addEventListener('focus', function (e) {

                var focused = focusManager.focusableParent(e.target);

                if (focused) {
                    var pos = getPos(scrollSlider, focused, horizontal);
                    console.log(pos.center);

                    if (horizontal) {
                        scrollSlider.scrollTo(pos.center, 0);
                    } else {
                        scrollSlider.scrollTo(0, pos.center);
                    }
                }

            }, true);
        }

        fetch(Emby.Page.baseUrl() + '/components/tvguide/tvguide.template.html', { mode: 'no-cors' }).then(function (response) {
            return response.text();
        }).then(function (template) {

            var context = options.element;
            context.innerHTML = template;

            var programGrid = context.querySelector('.programGrid');

            programGrid.addEventListener('scroll', function () {

                onProgramGridScroll(context, this);
            });

            var isMobile = false;

            if (isMobile) {
                //tabContent.querySelector('.tvGuide').classList.add('mobileGuide');
            } else {

                //tabContent.querySelector('.tvGuide').classList.remove('mobileGuide');

                context.querySelector('.timeslotHeaders').addEventListener('scroll', function () {

                    onTimeslotHeadersScroll(context, this);
                });
            }

            context.querySelector('.btnSelectDate').addEventListener('click', function () {

                selectDate(context);
            });

            context.classList.add('tvguide');

            createVerticalScroller(context, self);
            itemShortcuts.on(context);

            self.refresh();
        });
    };
});