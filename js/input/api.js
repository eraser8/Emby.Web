define(['connectionManager', 'playbackManager', 'events'], function (connectionManager, playbackManager, events) {

    function onWebSocketMessageReceived(e, msg) {

        var localPlayer;

        if (msg.MessageType === "Play") {

            //localPlayer = MediaController.getLocalPlayer();

            if (msg.Data.PlayCommand == "PlayNext") {
                //localPlayer.queueNext({ ids: msg.Data.ItemIds });
            }
            else if (msg.Data.PlayCommand == "PlayLast") {
                //localPlayer.queue({ ids: msg.Data.ItemIds });
            }
            else {
                //localPlayer.play({ ids: msg.Data.ItemIds, startPositionTicks: msg.Data.StartPositionTicks });
            }

        }
        else if (msg.MessageType === "ServerShuttingDown") {
            //playbackManager.setDefaultPlayerActive();
        }
        else if (msg.MessageType === "ServerRestarting") {
            //playbackManager.setDefaultPlayerActive();
        }
        else if (msg.MessageType === "Playstate") {

            //localPlayer = MediaController.getLocalPlayer();

            //if (msg.Data.Command === 'Stop') {
            //    playbackManager.stop();
            //}
            //else if (msg.Data.Command === 'Pause') {
            //    playbackManager.pause();
            //}
            //else if (msg.Data.Command === 'Unpause') {
            //    playbackManager.unpause();
            //}
            //else if (msg.Data.Command === 'Seek') {
            //    playbackManager.seek(msg.Data.SeekPositionTicks);
            //}
            //else if (msg.Data.Command === 'NextTrack') {
            //    playbackManager.nextTrack();
            //}
            //else if (msg.Data.Command === 'PreviousTrack') {
            //    playbackManager.previousTrack();
            //}
        }
        else if (msg.MessageType === "GeneralCommand") {

            //var cmd = msg.Data;

            //localPlayer = MediaController.getLocalPlayer();

            //MediaController.sendCommand(cmd, localPlayer);
        }
    }

    function bindEvents(apiClient) {

        events.off(apiClient, "websocketmessage", onWebSocketMessageReceived);
        events.on(apiClient, "websocketmessage", onWebSocketMessageReceived);
    }

    //var current = connectionManager.currentApiClient();
    //if (current) {
    //    bindEvents(current);
    //}

    events.on(connectionManager, 'apiclientcreated', function (e, newApiClient) {

        bindEvents(newApiClient);
    });

});