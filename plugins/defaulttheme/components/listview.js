define(['itemHelper', 'mediaInfo', 'indicators', 'paper-icon-item', 'paper-item-body'], function (itemHelper, mediaInfo, indicators) {

    function getListViewHtml(items, options) {

        var outerHtml = "";

        var index = 0;
        var groupTitle = '';
        var action = options.action || 'link';

        var isLargeStyle = options.imageSize == 'large';
        var enableOverview = options.enableOverview;

        outerHtml += items.map(function (item) {

            var html = '';

            var cssClass = "itemAction";

            var downloadWidth = 80;

            if (isLargeStyle) {
                cssClass += " largeImage";
                downloadWidth = 500;
            }

            html += '<paper-icon-item class="' + cssClass + '" data-index="' + index + '" data-action="' + action + '" data-isfolder="' + item.IsFolder + '" data-id="' + item.Id + '"  data-serverid="' + item.ServerId + '" data-type="' + item.Type + '">';

            var imgUrl = Emby.Models.imageUrl(item, {
                width: downloadWidth,
                type: "Primary"
            });

            if (!imgUrl) {
                imgUrl = Emby.Models.thumbImageUrl(item, {
                    width: downloadWidth,
                    type: "Thumb"
                });
            }

            if (imgUrl) {
                html += '<div class="paperIconItemImage lazy" data-src="' + imgUrl + '" item-icon>';
            } else {
                html += '<div class="paperIconItemImage" item-icon>';
            }
            html += indicators.getPlayedIndicatorHtml(item);
            var progressHtml = indicators.getProgressBarHtml(item);

            if (progressHtml) {
                html += progressHtml;
            }
            html += '</div>';

            var textlines = [];

            if (options.showParentTitle) {
                if (item.Type == 'Episode') {
                    textlines.push(item.SeriesName || '&nbsp;');
                } else if (item.Type == 'MusicAlbum') {
                    textlines.push(item.AlbumArtist || '&nbsp;');
                }
            }

            var displayName = itemHelper.getDisplayName(item);

            if (options.showIndexNumber && item.IndexNumber != null) {
                displayName = item.IndexNumber + ". " + displayName;
            }
            textlines.push(displayName);

            if (item.Type == 'Audio') {
                textlines.push(item.ArtistItems.map(function (a) {
                    return a.Name;

                }).join(', ') || '&nbsp;');
            }

            var lineCount = textlines.length;
            if (!options.enableSideMediaInfo) {
                lineCount++;
            }
            if (enableOverview && item.Overview) {
                lineCount++;
            }

            if (lineCount > 2) {
                html += '<paper-item-body three-line>';
            } else if (lineCount > 1) {
                html += '<paper-item-body two-line>';
            } else {
                html += '<paper-item-body>';
            }

            for (var i = 0, textLinesLength = textlines.length; i < textLinesLength; i++) {

                if (i == 0 && isLargeStyle) {
                    html += '<h2 class="listItemTitle">';
                }
                else if (i == 0) {
                    html += '<div>';
                } else {
                    html += '<div secondary>';
                }
                html += textlines[i] || '&nbsp;';
                if (i == 0 && isLargeStyle) {
                    html += '</h2>';
                } else {
                    html += '</div>';
                }
            }

            if (!options.enableSideMediaInfo) {
                html += '<div class="paperIconItemMediaInfo">' + mediaInfo.getMediaInfoHtml(item) + '</div>';
            }

            if (enableOverview && item.Overview) {
                html += '<div secondary class="overview">';
                html += item.Overview;
                html += '</div>';
            }

            html += '</paper-item-body>';

            if (options.enableSideMediaInfo) {
                html += '<div class="paperIconItemMediaInfo">' + mediaInfo.getMediaInfoHtml(item) + '</div>';
            }

            html += '</paper-icon-item>';

            index++;
            return html;

        }).join('');

        return outerHtml;
    }

    return {
        getListViewHtml: getListViewHtml
    };
});