require(['inputmanager', 'components/PxGamepad'], function (inputmanager) {

    function notifyApp() {

        inputmanager.notify();
    }

    function sendCommand(name) {

        inputmanager.handle(name);
    }

    var pxgamepad = new PxGamepad();
    //pxgamepad.start();

    function onUpdateTick() {

        pxgamepad.update();
        requestAnimationFrame(onUpdateTick);
    }

    requestAnimationFrame(onUpdateTick);

    pxgamepad.on('dpadUp', function () {
        sendCommand('up');
    });

    pxgamepad.on('dpadDown', function () {
        sendCommand('down');
    });

    pxgamepad.on('dpadLeft', function () {
        sendCommand('left');
    });

    pxgamepad.on('dpadRight', function () {
        sendCommand('right');
    });

    pxgamepad.on('select', function () {
        sendCommand('back');
    });

    pxgamepad.on('x', function () {
        sendCommand('select');
    });

    pxgamepad.on('y', function () {
        sendCommand('back');
    });

    pxgamepad.on('start', function () {
        sendCommand('select');
    });

    pxgamepad.on('a', function () {
        sendCommand('select');
    });

    pxgamepad.on('b', function () {
        sendCommand('back');
    });

});