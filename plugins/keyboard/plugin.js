define(['pluginManager'], function (pluginManager) {

    return function () {

        var self = this;

        self.name = 'Default Keyboard';
        self.type = 'keyboard';
        self.id = 'keyboard';

        function getKeys() {

            return {
                keys: {
                    // Default keys, separated into rows
                    standard: [
                        ['@', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'DEL'],
                        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
                        ['SHIFT', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
                        ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
                    ],

                    // Symbol keys
                    symbol: [
                        ['@', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
                        ['~', '#', '`', '£', '$', '%', '^', '&', '(', ')', '[', ']'],
                        ['•', '€', '¥', '¡', '¿', '*', '|', '{', '}', ':', '&quot;'],
                        ['_', '+', '!', '\\', '«', '»', '§', '<', '>', '?'],
                    ]
                },

                // Characters with diacritics appear when certain keys are held
                diacritics: {
                    a: 'äáâàåæ',
                    c: 'ç©',
                    d: 'ð',
                    e: 'ëéêè',
                    i: 'ïíîì',
                    m: 'µ',
                    n: 'ñ',
                    o: 'öóôòõø',
                    u: 'üúûù',
                    y: 'ÿý',
                }
            };
        }

        function getKeyText(key) {

            if (key == 'SHIFT') {

            }
            if (key == 'DEL') {
                return '<iron-icon icon="keyboard:backspace"></iron-icon>';
            }
            if (key == 'SPACE') {
                //return '<iron-icon icon="keyboard:space-bar"></iron-icon>';
            }

            return key;
        }
        function getKeyHtml(key) {
            return '<button data-key="' + key + '" class="clearButton keyboardButton">' + getKeyText(key) + '</button>';
        }

        function replaceAll(str, find, replace) {

            return str.split(find).join(replace);
        }

        function parentWithTag(elem, tagName) {

            while (elem.tagName != tagName) {
                elem = elem.parentNode;

                if (!elem) {
                    return null;
                }
            }

            return elem;
        }

        function setFieldValue(field, value) {

        }

        function onKeyClick(dlg, field, key) {

            field = parentWithTag(field, 'PAPER-INPUT') || field;

            switch (key) {

                case 'DEL':
                    if (field.value) {
                        field.value = field.value.substring(0, field.value.length - 1)
                    }
                    break;
                case 'SHIFT':
                    dlg.querySelector('.keyboardContainer').classList.toggle('upper');
                    break;
                case 'SPACE':
                    field.value += ' ';
                    break;
                default:

                    if (dlg.querySelector('.keyboardContainer').classList.contains('upper')) {
                        key = key.toUpperCase();
                    }
                    field.value += key;
                    break;
            }

            var displayValue = getDisplayValue(field);

            if (field.type == 'password') {
                var length = displayValue.length;
                displayValue = '';
                while (displayValue.length < length) {
                    displayValue += '*';
                }
            }

            dlg.querySelector('.keyboardValue').innerHTML = replaceAll(displayValue || '&nbsp;', ' ', '&nbsp;');
        }

        function getDisplayValue(field) {
            var displayValue = field.value;

            if (field.type == 'password') {
                var length = displayValue.length;
                displayValue = '';
                while (displayValue.length < length) {
                    displayValue += '*';
                }
            }

            return displayValue;
        }

        function parentWithClass(elem, className) {

            while (!elem.classList || !elem.classList.contains(className)) {
                elem = elem.parentNode;

                if (!elem) {
                    return null;
                }
            }

            return elem;
        }

        function showInternal(options, paperdialoghelper) {

            var dlg = paperdialoghelper.createDialog({
                removeOnClose: true,
                size: 'fullscreen'
            });

            dlg.classList.add('keyboardDialog');

            var html = '';

            html += '<div style="margin:0;padding:0;">';
            html += '<paper-icon-button tabindex="-1" icon="keyboard:arrow-back" class="btnKeyboardExit"></paper-icon-button>';

            if (options.label) {
                html += '<h1>';
                html += options.label;
                html += '</h1>';
            }

            html += '<div class="keyboardValue">' + (getDisplayValue(options.field) || '&nbsp;') + '</div>';

            var layout = getKeys();

            html += '<div class="keyboardContainer">';

            html += '<div class="standard">';
            layout.keys.standard.forEach(function (row) {

                html += '<div class="keyboardRow">';
                row.forEach(function (key) {

                    html += getKeyHtml(key);

                });
                html += '</div>';
            });
            html += '</div>';

            html += '<div class="symbols">';
            layout.keys.symbol.forEach(function (row) {

                html += '<div class="keyboardRow">';
                row.forEach(function (key) {

                    html += getKeyHtml(key);

                });
                html += '</div>';
            });
            html += '</div>';

            html += '<div class="keyboardRow">';
            html += getKeyHtml('SPACE');
            html += '</div>';

            html += '</div>';
            html += '</div>';

            dlg.innerHTML = html;
            document.body.appendChild(dlg);

            dlg.addEventListener('click', function (e) {

                var btn = parentWithClass(e.target, 'keyboardButton');
                if (btn) {
                    onKeyClick(dlg, options.field, btn.getAttribute('data-key'));
                }
            });

            dlg.querySelector('.btnKeyboardExit').addEventListener('click', function (e) {

                paperdialoghelper.close(dlg);
            });

            paperdialoghelper.open(dlg);
        }

        self.show = function (options) {

            require(['paperdialoghelper', 'css!' + Emby.PluginManager.mapPath(self, 'style.css'), 'iron-icon-set', 'html!' + Emby.PluginManager.mapPath(self, 'icons.html')], function (paperdialoghelper) {

                showInternal(options, paperdialoghelper);
            });
        };
    }
});