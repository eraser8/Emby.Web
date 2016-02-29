define(['loading', 'scrollHelper', 'connectionManager', './startuphelper', 'focusManager', 'coreIcons'], function (loading, scrollHelper, connectionManager, startupHelper, focusManager) {

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function renderLoginUsers(view, apiClient, users, serverId, initScroller) {

        var items = users.map(function (user) {

            var imgUrl = user.PrimaryImageTag ?
                apiClient.getUserImageUrl(user.Id, {
                    width: 400,
                    tag: user.PrimaryImageTag,
                    type: "Primary"
                }) :
                '';

            var loginPage = 'manuallogin';

            var url = user.HasPassword ?
                ('/startup/' + loginPage + '.html?serverid=' + serverId + '&user=' + user.Name) :
                '';

            return {
                name: user.Name,
                showIcon: !imgUrl,
                showImage: imgUrl,
                icon: 'person',
                cardImageStyle: "background-image:url('" + imgUrl + "');",
                id: user.Id,
                url: url,
                serverId: user.ServerId,
                defaultText: true
            };

        });

        items.push({
            name: Globalize.translate('core#ButtonManualLogin'),
            showIcon: true,
            showImage: false,
            icon: 'lock',
            cardImageStyle: '',
            cardType: 'manuallogin',
            defaultText: true,
            url: '/startup/manuallogin.html?serverid=' + serverId
        });

        items.push({
            name: Globalize.translate('core#EmbyConnect'),
            showIcon: true,
            showImage: false,
            icon: 'cloud',
            cardImageStyle: '',
            cardType: 'embyconnect',
            defaultText: true,
            url: '/startup/connectlogin.html'
        });

        items.push({
            name: Globalize.translate('core#ButtonChangeServer'),
            showIcon: true,
            showImage: false,
            icon: 'cast',
            cardImageStyle: '',
            cardType: 'changeserver',
            defaultText: true,
            url: '/startup/selectserver.html'
        });

        var html = items.map(function (item) {

            var secondaryText = item.defaultText ? '&nbsp;' : '';

            var cardImageContainer;

            if (item.showIcon) {
                cardImageContainer = '<iron-icon class="cardImageIcon" icon="' + item.icon + '"></iron-icon>';
            } else {
                cardImageContainer = '<div class="cardImage" style="' + item.cardImageStyle + '"></div>';
            }

            var tagName = 'paper-button';
            var innerOpening = '<div class="cardBox">';
            var innerClosing = '</div>';

            return '\
<' + tagName + ' raised class="card squareCard loginSquareCard scalableCard" data-cardtype="' + item.cardType + '" data-url="' + item.url + '" data-name="' + item.name + '" data-serverid="' + item.serverId + '">\
'+ innerOpening + '<div class="cardScalable">\
<div class="cardPadder"></div>\
<div class="cardContent">\
<div class="cardImageContainer coveredImage defaultCardColor'+ getRandomInt(1, 5) + '">\
'+ cardImageContainer + '</div>\
</div>\
</div>\
<div class="cardFooter">\
<div class="cardText">'+ item.name + '</div>\
<div class="cardText dim">' + secondaryText + '</div>\
</div>'+ innerClosing + '\
</'+ tagName + '>';

        }).join('');

        var itemsContainer = view.querySelector('.users');
        itemsContainer.innerHTML = html;

        loading.hide();

        if (initScroller) {
            scrollHelper.centerFocus.on(itemsContainer, true);
        }

        focusManager.autoFocus(itemsContainer);
    }

    return function (view, params) {

        var self = this;

        view.addEventListener("viewshow", function (e) {

            var isRestored = e.detail.isRestored;

            var serverId = params.serverid;

            Emby.Page.setTitle(null);
            Emby.Backdrop.clear();

            if (!isRestored) {
                loading.show();
                var apiClient = connectionManager.getApiClient(serverId);
                apiClient.getPublicUsers().then(function (result) {

                    renderLoginUsers(view, apiClient, result, serverId, !isRestored);
                    view.querySelector('.pageHeader').classList.remove('hide');

                }, function (result) {

                    renderLoginUsers(view, apiClient, [], serverId, !isRestored);
                });

                view.querySelector('.users').addEventListener('click', function (e) {

                    startupHelper.onScrollSliderClick(e, function (card) {

                        var url = card.getAttribute('data-url');

                        if (url) {
                            Emby.Page.show(url);
                        } else {
                            startupHelper.authenticateUser(view, card.getAttribute('data-serverid'), card.getAttribute('data-name'));
                        }
                    });
                });
            }
        });
    }

});