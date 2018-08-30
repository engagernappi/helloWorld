var modules = {};
modules.contants = (function(){
    return {
        PERSISTENT_CROSSPLATFORM: '',
        IS_PHONEGAP: (!!cordova)
    }
})();

modules.session = (function(){
    var _authData = {};
    var setAuthData = function(authData){
        _authData = authData;
    }
    var getAccessToken = function(){
        return _authData.access_token;
    }
    var credentials = {
        "grant_type": "password",
        "username": "suporte",
        "password": "suporte",
        "client_id": "engage",
        "client_secret": "795c9a6e0380476e98d2d6258003716e",
        "customer_id": "totvs"
    }
    return {
        credentials: credentials,
        getAccessToken: getAccessToken,
        setAuthData: setAuthData
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
                "Authorization": "Bearer " + session.access_token,
                "Cache-Control": "no-cache"
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
            session.setAuthData(authData);
        });
    }
    return {
        authenticate: authenticate
    }
})(modules.apiService, modules.session);

modules.homeController = (function(){
    var mobileDataEnabled_onChange = function(htmlElement, event){
        console.log('checked', event.target.checked);
    }
    var init = function(){
        console.log('homeController init')
    }
    return {
        init: init,
        mobileDataEnabled_onChange: mobileDataEnabled_onChange
    }
})();

var app = (function(contants, authService, homeController){
    var _bindEvents = function(){
        document.addEventListener('deviceready', _onDeviceReadyHandler, false);       
    }

    var _onDeviceReadyHandler = function() {
        contants.PERSISTENT_CROSSPLATFORM = 4;
        window.open = cordova.InAppBrowser.open;
        authService.authenticate().done(homeController.init);
    }

    var init = function(){
        if(contants.IS_PHONEGAP){
            _bindEvents();
        } else{
            contants.PERSISTENT_CROSSPLATFORM = 4;
            authService.authenticate().done(homeController.init);            
        }      
    }
    
    return {
        init: init,
        homeController: homeController
    }
})(modules.contants, modules.authService, modules.homeController)