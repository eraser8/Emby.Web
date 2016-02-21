define(['paperdialoghelper', 'css!./style.css'], function (paperdialoghelper) {

    return function (options) {

        if (typeof options === 'string') {
            options = {
                title: Globalize.translate('core#HeaderAlert'),
                text: options
            };
        }

        var message = options.text;
        var title = options.title;
        var callback = options.callback;

        var dlg = paperdialoghelper.createDialog({
            size: 'fullscreen'
        });

        dlg.classList.add('dialogComponent');

        var html = '';
        html += '<div class="dialogContent">';
        html += '<h1 class="dialogTitle">' + title + '</h1>';
        html += '<div class="dialogMessage">' + message + '</div>';
        html += '<div>';

        var index = 0;

        html += options.buttons.map(function (b) {

            var buttonHtml = '<paper-button raised class="btnDialogOption block" data-index="' + index + '">' + b + '</paper-button>';
            index++;
            return buttonHtml;

        }).join('');

        html += '</div>';
        html += '</div>';

        dlg.innerHTML = html;
        document.body.appendChild(dlg);

        var resultIndex = -1;

        dlg.addEventListener('click', function (e) {

            var actionSheetMenuItem = Emby.Dom.parentWithClass(e.target, 'btnDialogOption');

            if (actionSheetMenuItem) {

                resultIndex = parseInt(actionSheetMenuItem.getAttribute('data-index'));
                paperdialoghelper.close(dlg);
            }
        });

        return paperdialoghelper.open(dlg).then(function () {
            dlg.parentNode.removeChild(dlg);

            if (callback) {
                callback(resultIndex);
            }

            return resultIndex;
        });
    };
});