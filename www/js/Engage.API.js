var Engage = Engage || {};
Engage.MiddlewareAPI = (function () {

    function _getConfig(config) {
        console.log('Engage.MiddlewareAPI.getConfig chamado')
        console.log(config);
        //config = {method, data, url}

        if (!config) {
            throw new Error('Error: Engage API - missing config param')
        }
        if (!config.url || typeof config.url !== 'string') {
            throw new Error ('Error: Engage API - missing url')
        }

        var _data = config.data || "";

        var _method = config.method || "POST";

        var _config = {
            "url": config.url,
            "method": _method,
            "data": _data
        }

        var sendData = {
            "config": JSON.stringify(_config)
        }
        console.log(sendData)
        sendData = jQuery.param(sendData);

        console.log(sendData)

        return sendData;
        
    }

    function _getHeader() {
        var _headers = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
            }
        }
        return _headers;
    }

    return {
        getConfig: _getConfig,
        getHeader: _getHeader
    }
}())