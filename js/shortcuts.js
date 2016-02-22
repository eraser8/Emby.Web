define(['playbackManager'], function (playbackManager) {

    function playAllFromHere(card) {
        var cards = card.parentNode.querySelectorAll('.itemAction[data-id]');
        var ids = [];

        var foundCard = false;
        for (var i = 0, length = cards.length; i < length; i++) {
            if (cards[i] == card) {
                foundCard = true;
            }
            if (foundCard) {
                ids.push(cards[i].getAttribute('data-id'));
            }
        }
        playbackManager.play({
            ids: ids
        });
    }

    function showSlideshow(startItemId) {

        return Emby.Models.item(startItemId).then(function (item) {

            return Emby.Models.items({

                MediaTypes: 'Photo',
                Filters: 'IsNotFolder',
                ParentId: item.ParentId

            }).then(function (result) {

                var items = result.Items;

                var index = items.map(function (i) {
                    return i.Id;

                }).indexOf(startItemId);

                if (index == -1) {
                    index = 0;
                }

                require(['slideshow'], function (slideshow) {

                    var newSlideShow = new slideshow({
                        showTitle: false,
                        cover: false,
                        items: items,
                        startIndex: index,
                        interval: 8000,
                        interactive: true
                    });

                    newSlideShow.show();
                });

            });
        });
    }

    function showItem(options) {

        if (options.Type == 'Photo') {

            showSlideshow(options.Id);
            return;
        }

        Emby.Page.showItem(options);
    }

    function onClick(e) {
        var card = Emby.Dom.parentWithClass(e.target, 'itemAction');

        if (card) {
            var action = card.getAttribute('data-action');

            if (action) {

                var id = card.getAttribute('data-id');
                var type = card.getAttribute('data-type');
                var isfolder = card.getAttribute('data-isfolder') == 'true';

                if (action == 'link') {
                    showItem({
                        Id: id,
                        Type: type,
                        IsFolder: isfolder
                    });
                }

                else if (action == 'instantmix') {
                    playbackManager.instantMix(id);
                }

                else if (action == 'play') {

                    var startPositionTicks = parseInt(card.getAttribute('data-startpositionticks') || '0');

                    playbackManager.play({
                        ids: [id],
                        startPositionTicks: startPositionTicks
                    });
                }

                else if (action == 'playallfromhere') {
                    playAllFromHere(card);
                }

                else if (action == 'setplaylistindex') {

                }
            }
        }
    }

    function bind(context) {
        context.addEventListener('click', onClick);
    }

    // Add some shortcuts
    document.addEventListener('click', onClick);

    return {
        bind: bind
    };

});