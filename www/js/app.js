var modules = {};
modules.contants = (function(){
    return {
        PERSISTENT_CROSSPLATFORM: 4,
        OFF_LINE: 'offline',
        ON_LINE: 'online'
    }
})();

modules.session = (function(){
    var authData = {};
    var connection = {
        status: '',
        type: ''
    };
    var credentials = {
        "grant_type": "password",
        "username": "suporte",
        "password": "suporte",
        "client_id": "engage",
        "client_secret": "795c9a6e0380476e98d2d6258003716e",
        "customer_id": "totvs"
    }
    var userPreferences = {
        useMobileData: true
    };
    var userRelated = {};
    return {
        connection: connection,
        credentials: credentials,
        authData: authData,
        userPreferences: userPreferences,
        userRelated: userRelated
    };
})();

modules.apiService = (function(session){
    var _baseUrl = "https://pre.engage.bz/api/v1/";
    var _getRequest = function(params){
        var settings = {
            "async": true,
            "crossDomain": true,
            "method": params.method || "GET",
            "data": params.data || {}
        };
        if(params.authenticated == false){
            settings.headers = {
                "Cache-Control": "no-cache",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            settings.url = _baseUrl + params.url;
        } else{
            settings.headers = {
                "Cache-Control": "no-cache",
                "Authorization": "Bearer " + session.authData.access_token
            }
            settings.url = _baseUrl + session.credentials.customer_id + "/" + params.url;
           
        }
        return settings;
    }
    var call = function(params){
        return $.ajax(_getRequest(params)).fail(function(error){
            console.log('deu erro na chamada da API');
            console.log('error', error);
        });
    }
    return {
        call: call
    }
})(modules.session);

modules.authService = (function(apiService, session){
    var authenticate = function(){
        return apiService.call({
            url: 'auth',
            method: "POST",
            data: session.credentials,
            authenticated: false
        })
        .done(function(authData){
            session.authData = authData;
        });
    }
    return {
        authenticate: authenticate
    }
})(modules.apiService, modules.session);

modules.fileService = (function(contants, session){
    var _checkConnection = function(){
        var errors = [];
        if(session.connection.status == contants.OFF_LINE)
            errors.push({ errorerrorCode:'connection_fail' });
        else if(!session.userPreferences.useMobileData
                && (session.connection.type == Connection.UNKNOWN
                || session.connection.type == Connection.ETHERNET
                || session.connection.type == Connection.WIFI
                || session.connection.type == Connection.CELL))
            errors.push({ errorerrorCode:'connection_type_not_enabled' });
        
        return errors
    }
    var createFileEntry = function(file) {
        var defer = $.Deferred();
        window.requestFileSystem(contants.PERSISTENT_CROSSPLATFORM, file.size, function(fs){
            defer.resolve(fs);
        }, function(error){
            defer.reject(error);
        });
        /*
        window.requestFileSystem(contants.PERSISTENT_CROSSPLATFORM, file.size, function (fs) {
            defer.resolve(fs);
            //fs.root.getFile(file.name, file.config, defer.resolve, defer.reject);
        }, defer.reject);
        */
        return defer.promise();
    }
    var downloadFile = function(url, fileEntry){     
        var defer = $.Deferred();
        var errors = _checkConnection();
        if(errors.length > 0) 
            defer.reject(errors);
        else{
            var fileTransfer = new FileTransfer();
            fileTransfer.download(url, fileEntry.toURL(), defer.resolve, defer.reject)
        }
        return defer;
    }
    return {
        createFileEntry: createFileEntry,
        downloadFile: downloadFile
    }
})(modules.contants, modules.session);

modules.userService = (function(session, apiService){   
    var getRelated = function(){
        return apiService.call({
            url: "users/" + session.authData.user_id + "/related"
        })
        .done(function(response){
            session.userRelated = response.result;
        });
    }
    return {
        getRelated: getRelated
    }
})(modules.session, modules.apiService);

modules.userCardController = (function(session, userService){
    var $lblUserData = $('#userData');
    var _getAttributeTag = function(value){
        return ('<p><small class="text-muted">'+ value +'</small></p>');
    }
    var init = function(){
        $lblUserData.text('carregando...');
        userService.getRelated()
            .done(function(){
                var attributes = _getAttributeTag('Nome: ' + session.userRelated.name);
                attributes += _getAttributeTag('Score: ' + session.userRelated.score);
                attributes += _getAttributeTag('Coins: ' + session.userRelated.coins);
                $lblUserData.html(attributes);
            });
    }
    return {
        init: init
    }
})(modules.session, modules.userService);

modules.networkCardController = (function(contants, session){
    var $chMobileData = $('#chMobileData');
    var $connectionType = $('#connectionType');
    var mobileDataEnabled_onChange = function(event){
        session.userPreferences.useMobileData = event.target.checked;
    }
    var onConnectionChange = function(){
        session.connection = {
            status: (navigator.connection.type == Connection.NONE ? contants.OFF_LINE : contants.ON_LINE),
            type: navigator.connection.type
        }
        $connectionType.text(session.connection.type);
    }
    var init = function(){
        $chMobileData.prop('checked', session.userPreferences.useMobileData);
        onConnectionChange();
    }
    return {
        onConnectionChange: onConnectionChange,
        init: init,
        mobileDataEnabled_onChange: mobileDataEnabled_onChange
    }
})(modules.contants, modules.session);

modules.downloadCardController = (function(fileService){
    var init = function(){
        fileService.createFileEntry({
            name: 'download.mp4',
            size: 0,
            config: { create: true, exclusive: false }
        }).done(function(fileEntry){
            console.log('createFileEntry SUCCESS');
            console.log('fileEntry', fileEntry);
        }).fail(function(error){
            console.log('createFileEntry ERROR');
            console.log('fileEntry', error);           
        });
    }
    return {
        init: init
    }
})(modules.fileService);

var app = (function(contants, session, authService, userCardController, networkCardController, downloadCardController){
    var $lblAuthData = $('#authData');
    var _bindAppEvents = function(){       
        $('#chMobileData').on('change', networkCardController.mobileDataEnabled_onChange);
        document.addEventListener("offline", networkCardController.onConnectionChange, false);
        document.addEventListener("online", networkCardController.onConnectionChange, false);
    }

    var _onDeviceReadyHandler = function() {
        window.open = cordova.InAppBrowser.open;
        _bindAppEvents();
        _startCards();
    }

    var _startCards = function() {
        $lblAuthData.text('autenticando...');
        authService.authenticate().done([
            userCardController.init,
            function(){ $lblAuthData.text(session.authData.access_token); }
        ]);
        networkCardController.init();
        downloadCardController.init();
    }

    var init = function(){
        document.addEventListener('deviceready', _onDeviceReadyHandler, false);
    }

    return {
        init: init
    }
})(modules.contants, modules.session, modules.authService, modules.userCardController, modules.networkCardController, modules.downloadCardController)