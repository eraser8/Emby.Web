define([], function () {

    function compareVersions(a, b) {

        // -1 a is smaller
        // 1 a is larger
        // 0 equal
        a = a.split('.');
        b = b.split('.');

        for (var i = 0, length = Math.max(a.length, b.length) ; i < length; i++) {
            var aVal = parseInt(a[i] || '0');
            var bVal = parseInt(b[i] || '0');

            if (aVal < bVal) {
                return -1;
            }

            if (aVal > bVal) {
                return 1;
            }
        }

        return 0;
    }

    function enableLocalPin(apiClient) {

        return apiClient.getPublicSystemInfo().then(function (result) {
            return compareVersions(result.Version, '3.0.5895') >= 0;
        });
    }

    return {
        enableLocalPin: enableLocalPin
    };
});
