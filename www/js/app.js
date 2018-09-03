var modules = {};
modules.contants = (function(){
    return {
        PERSISTENT_CROSSPLATFORM: 1,
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
    var files = [];
    return {
        connection: connection,
        credentials: credentials,
        authData: authData,
        userPreferences: userPreferences,
        userRelated: userRelated,
        files: files
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
    var _getFileSystem = function(fileSize) {
        var defer = $.Deferred();
        window.requestFileSystem(contants.PERSISTENT_CROSSPLATFORM, fileSize, function(fs){
            console.log('FileSystem SUCCESS', fs);
            defer.resolve(fs);
        }, function(error){
            console.log('FileSystem ERROR', error);
            defer.reject(error);
        });
        return defer.promise();
    }
    var _getFileEntry = function(fileSystem, fileName, config){
        var defer = $.Deferred();
        fileSystem.root.getFile(fileName, config, function (fileEntry) {
            console.log('FileEntry SUCCESS', fileEntry);
            defer.resolve(fileEntry);
        }, function(error){
            console.log('FileEntry ERROR', error);
            defer.reject(error);
        });
        return defer.promise();
    }
    var downloadFile = function(file, progressHandler){     
        var defer = $.Deferred();
        var errors = _checkConnection();
        if(errors.length > 0) 
            defer.reject('checkConnection ERROR', errors);
        else{
            _getFileSystem(file.size)
            .done(function(fs){
                _getFileEntry(fs, file.name, file.config)
                .done(function(fileEntry){
                    var fileTransfer = new FileTransfer();
                    fileTransfer.onprogress = function(progressEvent){
                        var percent = Math.round(progressEvent.loaded / progressEvent.total) * 100;
                        defer.notify({percent: percent});
                    };
                    fileTransfer.download(file.url, fileEntry.toURL(), function(file){
                        console.log('download SUCCESS', file.remove);
                        defer.resolve(file);
                    }, function(error){
                        console.log('download ERROR', error);
                        defer.reject(error);
                    })
                })
                .fail(function(fileEntryError){
                    defer.reject(fileEntryError);
                });
            })
            .fail(function(fileSystemError){
                defer.reject(fileSystemError);
            });
        }
        return defer.promise();
    }
    var deleteFile = function(fileEntry){
        var defer = $.Deferred();
        fileEntry.remove(function(){
            defer.resolve();
        },function(error){
            defer.reject(error);
        });
        return defer.promise();
    }
    return {
        downloadFile: downloadFile,
        deleteFile: deleteFile
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

modules.downloadCardController = (function(session, fileService){
    var $progress = $('#progress');
    var $progressbar = $progress.find('.progress-bar');
    var $btnDownloadVideo = $('#btnDownloadVideo');
    var $btnDeleteVideo = $('#btnDeleteVideo');
    var _downloadVideo = function(file){
        $progressbar.css('width', '0%');
        $progressbar.attr('aria-valuenow', 0);
        $progress.show(); 
        fileService.downloadFile({
            size: 0,
            name: file.name,
            config: { 
                create: true, 
                exclusive: false 
            },
            url: file.url
        }).progress(function(progress){
            $progressbar.css('width', progress.percent + '%');
            $progressbar.attr('aria-valuenow', progress.percent);
        }).done(function(file){
            session.files[0] = file;
            console.log('downloadCardController => download SUCCESS', file);
        }).fail(function(error){
            console.log('downloadCardController => download ERROR', error);
        }).always(function(){
            _updateCard();
        });
    }
    var _deleteVideo = function(){
        fileService.deleteFile(session.files[0])
        .done(function(){
            console.log('delete file SUCCESS');
            session.files = [];
            _updateCard();
        })
        .fail(function(error){
            console.log('delete file ERROR', error);
        }).always(function(){
            _updateCard();
        });
    }
    var _updateCard = function(){
        $btnDownloadVideo.prop("disabled", session.files.length > 0);
        $btnDeleteVideo.prop("disabled", session.files.length == 0);
        $progress.hide();
    }
    var startDownloadButton_onClick = function(event){
        $btnDownloadVideo.prop("disabled", true);
        _downloadVideo({
            name: 'download.mp4',
            url: 'https://s3pre.engage.bz/apptest/video.mp4'
        });
    }
    var deleteVideoButton_onClick = function(event){
        $btnDeleteVideo.prop("disabled", true);
        _deleteVideo();
    }
    var init = function(){
        _updateCard();
    }
    return {
        init: init,
        startDownloadButton_onClick: startDownloadButton_onClick,
        deleteVideoButton_onClick: deleteVideoButton_onClick
    }
})(modules.session, modules.fileService);

var app = (function(contants, session, authService, userCardController, networkCardController, downloadCardController){
    var $lblAuthData = $('#authData');
    var _bindAppEvents = function(){       
        $('#chMobileData').on('change', networkCardController.mobileDataEnabled_onChange);
        $('#btnDownloadVideo').on('click', downloadCardController.startDownloadButton_onClick);
        $('#btnDeleteVideo').on('click', downloadCardController.deleteVideoButton_onClick);    
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