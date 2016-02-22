define(['imageLoader', 'itemShortcuts'], function (imageLoader, itemShortcuts) {

    function buildPeopleCardsHtml(people, options) {

        var className = 'card portraitCard personCard';

        if (options.block || options.rows) {
            className += ' block';
        }

        var html = '';
        var itemsInRow = 0;

        for (var i = 0, length = people.length; i < length; i++) {

            if (options.rows && itemsInRow == 0) {
                html += '<div class="cardColumn">';
            }

            var person = people[i];

            html += buildPersonCard(person, options, className);
            itemsInRow++;

            if (options.rows && itemsInRow >= options.rows) {
                itemsInRow = 0;
                html += '</div>';
            }
        }

        return html;
    }

    function buildPersonCard(person, options, className) {

        className += " itemAction scalableCard";

        var imgUrl = person.images ? person.images.primary : '';

        var cardImageContainerClass = 'cardImageContainer';
        if (options.coverImage) {
            cardImageContainerClass += ' coveredImage';
        }
        var cardImageContainer = imgUrl ? ('<div class="' + cardImageContainerClass + ' lazy" data-src="' + imgUrl + '">') : ('<div class="' + cardImageContainerClass + '">');

        var nameHtml = '';
        nameHtml += '<div class="cardText">' + person.Name + '</div>';

        if (person.Role) {
            nameHtml += '<div class="cardText">as ' + person.Role + '</div>';
        }
        else if (person.Type) {
            nameHtml += '<div class="cardText">' + Globalize.translate('core#' + person.Type) + '</div>';
        } else {
            nameHtml += '<div class="cardText">&nbsp;</div>';
        }

        var html = '\
<button type="button" data-isfolder="'+ person.IsFolder + '" data-type="' + person.Type + '" data-action="link" data-id="' + person.Id + '" raised class="' + className + '"> \
<div class="cardBox">\
<div class="cardScalable">\
<div class="cardPadder"></div>\
<div class="cardContent">\
' + cardImageContainer + '\
</div>\
</div>\
</div>\
<div class="cardFooter">\
' + nameHtml + '\
</div>\
</div>\
</button>'
        ;

        return html;
    }

    function buildPeopleCards(items, options) {

        // Abort if the container has been disposed
        if (!document.body.contains(options.parentContainer)) {
            return;
        }

        if (options.parentContainer) {
            if (items.length) {
                options.parentContainer.classList.remove('hide');
            } else {
                options.parentContainer.classList.add('hide');
                return;
            }
        }

        var html = buildPeopleCardsHtml(items, options);

        options.itemsContainer.innerHTML = html;

        imageLoader.lazyChildren(options.itemsContainer);

        itemShortcuts.off(options.itemsContainer);
        itemShortcuts.on(options.itemsContainer);
    }

    return {
        buildPeopleCards: buildPeopleCards
    };

});