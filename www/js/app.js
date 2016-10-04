// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.routes', 'app.services', 'app.directives'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {

  	 // Disable BACK button on home
  	$ionicPlatform.registerBackButtonAction(function(event) {
    if (true) { // your check here
      console.log("Se ha presionado back button");
    }
  	}, 100);
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
      
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.filter('dirClean', function () {
  return function (item) {
    var str = JSON.stringify(item, null, 4);
    alert(str);
    var extension = item.name.split(".").pop();
    var coverFormats = ["jpg","png", "jpeg", "bmp", "gif", "ico", "tiff","JPG","PNG", "JPEG", "BMP", "GIF", "TIFF", "ICO"];
    if((coverFormats.indexOf(extension)) == -1){
      return item;
    }
  };
})

.factory("$fileFactory", function($q) {

    var audioFormats = ["mp3","wma","wma","m4a"];
    var discos = [];
    var i;

    var error = function(){
        log("error");
    }

    var success = function(entries){
        var albumDirectory = "";
        var i;
        var flag = true;
        for (i = 0; i < entries.length; i++) {
            if (entries[i].isDirectory === true) {
                // Recursive call
                addFileEntry(entries[i]);
            } 
            else {
                var extension = entries[i].name.split(".").pop();
                if((audioFormats.indexOf(extension)) != -1 && flag){
                        flag = false;
                        albumDirectory = entries[i].nativeURL.substring(0, entries[i].nativeURL.lastIndexOf("/") + 1);
                }
            }
        }
        
        if(albumDirectory != ""){
            alert(albumDirectory);
        }
        deferred.resolve();
    }

    var addFileEntry = function (entry) {
        var deferred = $q.defer();
        var dirReader = entry.createReader();
        dirReader.readEntries(success,error);
    };

    var File = function() { };

    File.prototype = {
        //obtengo todas las grabaciones de audio capturadas por el usuario
        getEntries: function(path) {
            var deferred = $q.defer();
            window.resolveLocalFileSystemURI(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();
                directoryReader.readEntries(function(entries) {
                    deferred.resolve(entries);
                }, function(error) {
                    deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        },
        getEntries2: function(path) {
            var deferred = $q.defer();
            window.resolveLocalFileSystemURI(path, addFileEntry, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;

        },
        getAlbumCover: function(path) {
            var deferred = $q.defer();
            var albumPath = [];
            var flag = true;
            var coverFormats = ["jpg","png", "jpeg", "bmp", "gif", "ico", "tiff","JPG","PNG", "JPEG", "BMP", "GIF", "TIFF", "ICO"];
            var audioFormats = ["mp3","wma","m4a"];
            var coversNumber = 0;
            var tracksNumber = 0;
            var chunkNumber = 0;
            var dirsNumber = 0;

            window.resolveLocalFileSystemURI(path, function(fileSystem) {
                var directoryReader = fileSystem.createReader();
                directoryReader.readEntries(function(entries) {

                for (var k in entries){
                    var extension = entries[k].name.split(".").pop();
                    if (entries.hasOwnProperty(k) && entries[k].isFile && coverFormats.indexOf(extension) != -1 && flag) {
                        albumPath[0] = entries[k].nativeURL;
                        flag = false;
                        coversNumber++;
                    }
                    else if(entries.hasOwnProperty(k) && entries[k].isFile && coverFormats.indexOf(extension) != -1 && !flag){
                        coversNumber++;
                    }
                    else if(entries.hasOwnProperty(k) && entries[k].isFile && audioFormats.indexOf(extension) != -1){
                        tracksNumber++;
                    }
                    else if(entries.hasOwnProperty(k) && entries[k].isFile && audioFormats.indexOf(extension) == -1 && coverFormats.indexOf(extension) == -1){
                        chunkNumber++;
                    }
                    else if(entries.hasOwnProperty(k) && entries[k].isDirectory){
                        dirsNumber++;
                    }
                }

                if(coversNumber == 0){
                    albumPath[0] = "img/UnkownAlbum.jpg";
                }

                albumPath[1] = path;
                albumPath[2] = Object.keys(entries).length - coversNumber - chunkNumber - dirsNumber;
                deferred.resolve(albumPath);
                }, function(error) {
                    deferred.reject(error);
                });
            }, function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }
    };
    return File;
});