/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        window.PERSISTENT_CROSSPLATFORM = 4;
        window.open = cordova.InAppBrowser.open;
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        home.initialize();
    },

    /*
    openLogin: function(){
        // Testando o inapp-browser
        window.open = cordova.InAppBrowser.open;
        var ref = cordova.InAppBrowser.open("https://pre.engage.bz", "_blank", "location=yes");
        ref.addEventListener('loadstart', this.loadStartCallBack, false);
        ref.addEventListener('loadstop', this.loadStopCallBack, false);
        ref.addEventListener('exit', this.exitCallBack, false);
    },

    loadStartCallBack: function(params){
        console.log("loadStartCallBack");
        console.log(params);     
    },

    loadStopCallBack: function(params){
        console.log("loadStopCallBack");
        console.log(params);     
    },

    exitCallBack: function(params){
        console.log("exitCallBack");
        console.log(params);   
    }
    */
};

var consts = {};
consts.actions = {
    openHtml: 'open-html',
    download: 'download',
    openVideo: 'open-video'
};

var home = {
    initialize: function() {
        this.bindEvents();
        login.auth();
    },

    bindEvents: function() {
        $('button[type="button"]').on('click', home.button_OnClick);
    },

    button_OnClick: function(event) {
        event.preventDefault();
        var url = $(event.target).data('url');

        switch($(event.target).data('action')) {
            case consts.actions.openHtml:
                var ref = cordova.InAppBrowser.open(url, "_blank", "presentationstyle=fullscreen,fullscreen=yes");
                break;
            case consts.actions.openVideo:
                console.log("openVideo");
                window.fileEntry = "teste";
                var nativePath = cordova.file.dataDirectory + "download.mp4"
                console.log("native path: " + nativePath);
                window.resolveLocalFileSystemURL(nativePath, function(entry) {
                    console.log("achou o arquivo");
                    window.fileEntry = entry;

                    var video = document.getElementById('video');

                    var teste = entry.getMetadata();
                    var source = document.createElement('source');
                    source.setAttribute('src', window.fileEntry.toURL());
                    source.setAttribute('type', "video/mp4");
                    video.appendChild(source);
                });
                break;
            case consts.actions.download:
                downloadService.init();
                break;
            default:
                alert('Action not defined!');
        };
    }
}

var session = {};
var login = {
    _settings: {
        "async": true,
        "crossDomain": true,
        "url": "https://pre.engage.bz/api/v1/auth",
        "method": "POST",
        "headers": {
            "Cache-Control": "no-cache",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        "data": {
            "grant_type": "password",
            "username": "mauricio.pradella@engage.bz",
            "password": "totvs",
            "client_id": "engage",
            "client_secret": "795c9a6e0380476e98d2d6258003716e",
            "customer_id": "totvs"
        }
    },

    auth: function(){
        console.log("chamando: https://pre.engage.bz/api/v1/auth");
        $('#session').html("<p>Logando o usuário...</p>");
        $.ajax(this._settings).done(function (response) {
            session = response;
            console.log(session);

            $('#session').html("<p>AccessToken: " + session.access_token + "</p>");
            settingsService.getSettings();
        });
    } 
};

var api = {
    baseUrl: "https://pre.engage.bz/api/v1/",

    getSettings: function(action, method){
        return {
            "url": this.baseUrl + session.customer_id + "/" + action,
            "method": method || "GET",
            "headers": {
                "Authorization": "Bearer " + session.access_token,
                "Cache-Control": "no-cache"
            }
        }
    }
};

var settings = [];
var settingsService = {
    getSettings: function(){
        var settings = api.getSettings("infos/settings", "GET");
        console.log("chamando: " + settings.url);
        $('#settings').html("<p>Carregando as configurações...</p>");
        $.ajax(settings).done(function (response) {
            settings = response.results;
            console.log(settings);

            $('#settings').html("<p>" + settings.length + " configurações encontradas</p>");
            userService.getRelated();
        });
    }
}

var user = {};
var userService = {
    getRelated: function(){
        var settings = api.getSettings("users/" + session.user_id + "/related", "GET");
        console.log("chamando: " + settings.url);
        $.ajax(settings).done(function (response) {
            user.related = response.result;
            console.log(user);

            $('#user').html("<p>Logado: " + user.related.name + "</p>");
            //downloadService.init();
        });
    }
};

/*
var downloadService = {
    init: function(){
        window.requestFileSystem(window.PERSISTENT, 0, function (fs) {
            console.log("downloadService.init");
            console.log(fs);
            downloadService.getFile(fs.root);
        }, downloadService.onErrorLoadFs);
    },

    onErrorLoadFs: function onErrorLoadFs(params){
        console.log("downloadService.onErrorLoadFs");
        console.log(params);
    },

    getFile: function(dirEntry) {
        console.log("downloadService.getFile");
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://s3.engage.bz/treinamentohcn/cursos/curso15313/data/video1.mp4', true);
        xhr.responseType = 'blob';

        xhr.onload = function(event) {
            console.log("getFile.onload");
            console.log(event);
            console.log(this);
            if (this.status == 200) {
                var blob = new Blob([this.response]);
                downloadService.saveFile(dirEntry, blob, "downloadedImage.mp4");
            }
        };
        xhr.send();
    },

    saveFile: function(dirEntry, fileData, fileName) {
        console.log("downloadService.saveFile");
        dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
            downloadService.writeFile(fileEntry, fileData);
        }, downloadService.onErrorCreateFile);
    },

    writeFile: function(fileEntry, dataObj, isAppend) {
        console.log("downloadService.writeFile");
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function(e) {
                console.log("Successful file write...");
                console.log(e);
                downloadService.displayImageByFileURL(fileEntry);

                if (dataObj.type == "image/png") {
                    //readBinaryFile(fileEntry);
                }
                else {
                    //readFile(fileEntry);
                }
            };

            fileWriter.onerror = function(e) {
                console.log("Failed file write: " + e.toString());
            };
            fileWriter.write(dataObj);
        });
    },

    onErrorCreateFile: function(error){
        console.log("onErrorCreateFile");
        console.log(error);
    },

    displayImageByFileURL: function (fileEntry) {
        console.log("displayImageByFileURL");
        window.fileTest = fileEntry;
        var elem = document.getElementById('video');
        //elem.src = fileEntry.toURL();
        elem.src = fileEntry.toInternalURL();
        //elem.autoplay = true;
    }
}
*/

var downloadService = {
    init: function(){
        console.log("downloadService.init");

        window.requestFileSystem(window.PERSISTENT_CROSSPLATFORM, 0, function (fs) {
            console.log('requestFileSystem -> fs');
            console.log(fs);
            // Make sure you add the domain name to the Content-Security-Policy <meta> element.
            var url = 'https://s3pre.engage.bz/apptest/video.mp4';
            // Parameters passed to getFile create a new file or return the file if it already exists.
            fs.root.getFile('download.mp4', { create: true, exclusive: false }, function (fileEntry) {
                console.log('getFile -> fileEntry');
                console.log(fileEntry);
                downloadService.download(fileEntry, url, true);
            }, downloadService.onErrorCreateFile);

        }, downloadService.onErrorLoadFs);
    },

    onErrorCreateFile: function(error){
        console.log("onErrorCreateFile");
    },

    onErrorLoadFs: function(error){
        console.log("onErrorLoadFs");
    },

    download: function(fileEntry, uri, readBinaryData) {
        var fileTransfer = new FileTransfer();
        var fileURL = fileEntry.toURL();

        console.log('download');
        console.log(fileEntry);
        console.log(uri)
        console.log(readBinaryData)

        fileTransfer.download(
            uri,
            fileURL,
            function (entry) {
                console.log("Successful download...");
                console.log(entry);
                window.entryTest = entry
                //console.log("download complete: " + entry.toURL());
                //console.log(fileEntry.toURL());
            },
            function (error) {
                console.log("download error source " + error.source);
                console.log("download error target " + error.target);
                console.log("upload error code" + error.code);
            },
            null
        );
    }
}