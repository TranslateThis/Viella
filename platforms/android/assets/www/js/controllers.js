angular.module('app.controllers', ['timer'])

//++++++++++++++++++++++++++++++++++++++++++++++++ CONTROLADOR DEL REPRODUCTOR +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

.controller('reproducirCtrl', function($scope, $ionicPlatform, $fileFactory, $ionicPopup, $ionicActionSheet,$q) {
  var dirAlbums = [];
  $scope.status = 0;
  $scope.isPlaying = false;
  $scope.trackStatus = 1;
  $scope.toggleStatus = 0;
  $scope.images = [];
  $scope.cover = "";
  $scope.currentPosition = -1;
  $scope.currentName = "Reproducir";

  var numDirs = 0;
  var numFiles = 0;
  var my_media;
  var lonelyTracks = [];
  var size;
  var flag = true;
  var mode = false; //representa secuencial
  var index = 0;


document.addEventListener("deviceready", function() {
  var imagesAlbums = [];  
  var fs = new $fileFactory();
  

  screen.lockOrientation('portrait');

  window.plugins.toast.showWithOptions({
    message: "Viella se encuentra cargando la música disponible en su dipositivo móvil, aguarde unos instantes por favor ...",
    duration: 5000, // 5000 ms
    position: "center",
    styling: {
      opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
      backgroundColor: '#333333', // make sure you use #RRGGBB. Default #333333
      textColor: '#FFFFFF', // Ditto. Default #FFFFFF
      textSize: 20.5, // Default is approx. 13.
      cornerRadius: 16, // minimum is 0 (square). iOS default 20, Android default 100
      horizontalPadding: 20, // iOS default 16, Android default 50
      verticalPadding: 16 // iOS default 12, Android default 30
    }
  })

window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, firstFolder, null);

var audioFormats = ["mp3","wma","wma","m4a"];
var pathUrls = [cordova.file.externalRootDirectory,"file:///storage/extSdCard/","file:///storage/external_SD","file:///storage/sdcard1"];

for(i=0;i<pathUrls.length;i++){ 
  window.resolveLocalFileSystemURI(pathUrls[i],getDirSuccess,fail);
}

function getDirSuccess(dirEntry) {
  var directoryReader = dirEntry.createReader();
  directoryReader.readEntries(readerSuccess,fail);
}

function fail(e){
  console.log("Fallo en resolveLocalFileSystemURI");
}

// create timeout var outside your "readerSuccess" function scope
var readerTimeout = null, millisecondsBetweenReadSuccess = 3000;

var audioFormats = ["mp3","wma","wma","m4a"];
var dirAlbums = [];


function readerSuccess(entries) {
    var i = 0, len = entries.length;
    var flag = true;
    var albumDirectory = "";
    for (i; i < len; i++) {

        if (entries[i].isDirectory) {
            numDirs++;
            getDirSuccess(entries[i]);
        }
        else{
          var extension = entries[i].name.split(".").pop();
          if((audioFormats.indexOf(extension)) != -1 && flag){
            flag = false;
            albumDirectory = entries[i].nativeURL.substring(0, entries[i].nativeURL.lastIndexOf("/") + 1);
            dirAlbums.push(albumDirectory);
          }
        } 
    }
    if (readerTimeout) {
        window.clearTimeout(readerTimeout);
    }
    readerTimeout = window.setTimeout(weAreDone, millisecondsBetweenReadSuccess);
}

// additional event to call when totally done
function weAreDone() {
  //alert("cantidad de dirs: " + numDirs);
  for (var i = 0; i < dirAlbums.length; i++) {
    fs.getAlbumCover(dirAlbums[i]).then(function(result) {
      $scope.images.push({id:i, coverSrc:result[0], albumPath:result[1], trackCount:result[2]});
    });      
  }
}

}, false);

function firstFolder(fileSystemOne) { 
  var firstEntry = fileSystemOne.root; 
  firstEntry.getDirectory("Viella", {create: true, exclusive: false}, successOne, failOne); 
}

function successOne(dirOne) { 
  console.log("Se a creado el directorio " + dirOne.name); 
} 

function failOne(errorOne) { 
  console.log("Error creando el directorio " + errorOne.code); 
} 

function successTwo(dirTwo) { 
  console.log("Se a creado el directorio " + dirTwo.name); 
} 

function failTwo(errorTwo) { 
  console.log("Error creando el directorio " + errorTwo.code); 
}

//Reproduzco un audio grabado determinado

$scope.playAudioTrack = function(fileUrl,fileName){
  $scope.trackStatus = 1;
  $scope.currentPosition = $scope.tracksPositions.indexOf(fileUrl);


  if(flag){
    my_media = new Media(fileUrl, function(e) { 
    }, function(err) {
      console.log("media err", err);
    });
    my_media.play();
    flag=false;
    $scope.currentName = fileName;
    
    // Update media position every second
    var mediaTimer = setInterval(function () {
    my_media.getCurrentPosition(
        // success callback
        function (position) {
            if (position <= -0.0001) {
                $scope.nextTrack();
            }
        },
        // error callback
        function (e) {
            console.log("Error getting pos=" + e);
        }
    );
    }, 1000); 
  }
  else{
    console.log("No se pueden reproducir 2 temas al mismo tiempo");
    my_media.stop();
    my_media.release();
    flag = true;
    $scope.playAudioTrack(fileUrl,fileName);
  }
}

$scope.backTrack = function(){
	my_media.stop();
	flag = true;
	if( $scope.currentPosition != 0){
		$scope.currentPosition = $scope.currentPosition - 1;
	}
	else{
		$scope.currentPosition = $scope.tracksPositions.length - 1;
	}
	$scope.playAudioTrack($scope.tracksPositions[$scope.currentPosition],$scope.tracksPositionsNames[$scope.currentPosition]);
}

$scope.nextTrack = function(fileName){
	my_media.stop();
	flag = true;
  if(!mode){
    if($scope.currentPosition != ($scope.tracksPositions.length) - 1){
      $scope.currentPosition = $scope.currentPosition + 1;
    }
    else{
      $scope.currentPosition = 0;
    }
  }
  else{
    $scope.currentPosition = Math.floor(Math.random() * $scope.tracksPositions.length);
  }

  $scope.setSequential = function(){
    mode = false;
    $scope.toggleStatus = 0;
  }

  $scope.setRandom = function(){
    mode = true;
    $scope.toggleStatus = 1;
  }  
	$scope.playAudioTrack($scope.tracksPositions[$scope.currentPosition],$scope.tracksPositionsNames[$scope.currentPosition]);
}

//Freno la reproducción de un audio track
$scope.pauseAudioTrack = function(){
  $scope.trackStatus = 0;
  my_media.pause();
  flag=true;
}

$scope.resumeAudioTrack = function(){
  $scope.trackStatus = 1;
  my_media.play();
  flag=true;
}

$scope.backAlbums = function(){
  $scope.status = 0;
  $scope.$apply();
}


$scope.setRandom = function(){
  $scope.toggleStatus = 1;
}

$scope.setSequential = function(){
  $scope.toggleStatus = 0;
}

$scope.info = function(){
    window.plugins.toast.showWithOptions({
    message: "Viella ha sido desarrollado por alumnos de 6to año de la escuela experimental proA sede córdoba capital",
    duration: 6000, // 5000 ms
    position: "center",
    styling: {
      opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
      backgroundColor: '#333333', // make sure you use #RRGGBB. Default #333333
      textColor: '#FFFFFF', // Ditto. Default #FFFFFF
      textSize: 20.5, // Default is approx. 13.
      cornerRadius: 16, // minimum is 0 (square). iOS default 20, Android default 100
      horizontalPadding: 20, // iOS default 16, Android default 50
      verticalPadding: 16 // iOS default 12, Android default 30
    }
  })
}

$scope.trackOptions = function(entrie) {
$ionicActionSheet.show({
      titleText: 'Opciones',
      buttons: [
        { text: '<i class="icon ion-android-document assertive"></i> Detalles' },
        { text: '<i class="icon ion-ios-trash assertive"></i> Eliminar' },
        { text: '<i class="icon ion-share assertive"></i> Compartir' },
      ],

      cancel: function() {
        log('CANCELLED');
      },
      buttonClicked: function(index) {
        if(index === 0) {
          $scope.detailsAudioTrack(entrie);
        }
        else if(index === 1){
          $scope.deleteAudioTrack(entrie.fileUrl);
        }
        else if(index === 2){
          window.plugins.socialsharing.share('Acá está tu grabación', entrie.name, entrie.nativeURL);
        }        
      },
      destructiveButtonClicked: function() {
        console.log('DESTRUCT');
        return true;
      }
    });
}

var onSuccessCallback = function(entries){
  //var str = JSON.stringify(entries, null, 4);
  $scope.audioTracks = entries.length;
  var coverFormats = ["jpg","png", "jpeg", "bmp", "gif", "ico", "tiff","JPG","PNG", "JPEG", "BMP", "GIF", "TIFF", "ICO"];
  for (var k in entries){
    if (entries.hasOwnProperty(k) && entries[k].isFile) {
      var extension = entries[k].name.split(".").pop();
      if((coverFormats.indexOf(extension)) != -1){
        delete entries[k];
      }
    }
  }

$scope.music = entries;
$scope.$apply();
}

var onFailCallback = function(){
  // In case of error
}

var onResolveSuccess = function(fileEntry){
  var fileUrl = fileEntry.nativeURL;
  var n = fileUrl.lastIndexOf("/");
  var fileDir = fileUrl.substring(0,n);
  fileEntry.remove();

  window.resolveLocalFileSystemURL(fileDir, function (dirEntry) {
    var directoryReader = dirEntry.createReader();
    directoryReader.readEntries(onSuccessCallback,onFailCallback);
  });

  window.plugins.toast.showWithOptions({
    message: "Se ha eliminado correctamente el audio " + fileEntry.name,
    duration: 6000, // 5000 ms
    position: "top",
    styling: {
      opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
      backgroundColor: '#333333', // make sure you use #RRGGBB. Default #333333
      textColor: '#FFFFFF', // Ditto. Default #FFFFFF
      textSize: 20.5, // Default is approx. 13.
      cornerRadius: 16, // minimum is 0 (square). iOS default 20, Android default 100
      horizontalPadding: 20, // iOS default 16, Android default 50
      verticalPadding: 16 // iOS default 12, Android default 30
    }
  }) 

}

var fail = function(evt){
  console.log(evt.target.error.code);
}

function onConfirmDltRecordedAudio(buttonIndex, fileUrl) {
  if(buttonIndex == '1'){  //se confirma la eliminación del audio
    window.resolveLocalFileSystemURL(fileUrl, onResolveSuccess, fail);
  }
}

//Elimino un audio track
$scope.deleteAudioTrack = function(fileUrl){
  navigator.notification.confirm(
  '¿Desea eliminar este audio?',
  function(buttonIndex){
    onConfirmDltRecordedAudio(buttonIndex, fileUrl);
  },
  'Eliminando audio',           
  ['Aceptar','Cancelar']     
  );
}


//Detalles de un audio track
$scope.detailsAudioTrack = function(entrie){
  
  var extension = entrie.name.split(".").pop();
  var size = extension.length + 1;
  var name =  entrie.name.slice(0,  size * -1);
  var tracksOptionTemplate = '<div class="list"><div class="item item-divider">Nombre</div><div class="item">' + name + '</div>';
  tracksOptionTemplate = tracksOptionTemplate + '<div class="item item-divider">Extensión</div><div class="item">' + extension + '</div>';
  tracksOptionTemplate = tracksOptionTemplate + '<div class="item item-divider">Ubicación</div><div class="item">' + entrie.nativeURL + '</div></div>';
   var alertPopup = $ionicPopup.alert({
     title: 'Detalles',
     okText:'Cerrar',
     template:tracksOptionTemplate
   });
}

var readTracksScss = function(entries){
  var tracks = [];
  var tracksNames = [];
  var index = 0;
  var coverFormats = ["jpg","png", "jpeg", "bmp", "gif", "ico", "tiff","JPG","PNG", "JPEG", "BMP", "GIF", "TIFF", "ICO"];
  var audioFormats = ["mp3","wma","wma","m4a"];
  $scope.musicNew = [];

  for (var k in entries){
    if (entries.hasOwnProperty(k) && entries[k].isFile) {
      var extension = entries[k].name.split(".").pop();
      if(entries.hasOwnProperty(k) && entries[k].isFile && audioFormats.indexOf(extension) != -1){
        tracks[index] = entries[k].nativeURL;
        tracksNames[index] = entries[k].name;
        $scope.musicNew.push({nativeURL:entries[k].nativeURL, name:entries[k].name});
        index++;
      }
      else if ( (entries.hasOwnProperty(k) && entries[k].isFile && audioFormats.indexOf(extension) == -1 && coverFormats.indexOf(extension) == -1) || (entries.hasOwnProperty(k) && entries[k].isFile && coverFormats.indexOf(extension) != -1)){
        delete entries[k];
      }
      else if(entries[k].isDirectory){
        delete entries[k];
      }
    }
  }

  $scope.tracksPositions = tracks;
  $scope.tracksPositionsNames = tracksNames;
  $scope.$apply();
}

var readTracksFail = function () {

}

$scope.openDir = function (dirUrl,cover) {
  window.resolveLocalFileSystemURL(dirUrl, function (dirEntry) {
    var directoryReader = dirEntry.createReader();
    directoryReader.readEntries(readTracksScss,readTracksFail);
  });
  $scope.cover = cover;
  $scope.status = 1;
}

})
   
//++++++++++++++++++++++++++++++++++++++++++++++++++++ CONTROLADOR DE GRABAR AUDIO +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++     
.controller('grabarAudioCtrl', function($scope, $ionicPopup) {
  $scope.state = "record";
  $scope.audioFormat = "wav";
  var audio;

  $scope.start = function () {
    $scope.$broadcast('timer-start');
  };
  $scope.stop = function () {
    $scope.$broadcast('timer-stop');
  };

  $scope.updateSelection = function(position, items, title) {
        angular.forEach(items, function(subscription, index) {
            if (position != index)
                subscription.checked = false;
                $scope.selected = title;
            }
        );
    }

  //Selección de formato de Grabación de un Audio 
  $scope.formatos = function(){
      $scope.devList = [{ text: "Amr", checked: false },{ text: "Mp3", checked: false },{ text: "M4a", checked: false },{ text: "Wav", checked: true  },{ text: "Wma", checked: false }];

      var prueba = '<ion-checkbox class="checkbox-assertive checkbox-circle" ng-repeat="item in devList" ng-model="item.checked" ng-checked="item.checked" ng-click="updateSelection($index, devList, item.text)">{{ item.text }}</ion-checkbox>'

    // Popup para seleccionar formáto de grabación
    var myPopup = $ionicPopup.show({
      template: prueba,
      title: 'Seleccione formato de grabación',
      subTitle: 'Recuerde comprobar la compatibilidad de su  móvil (Por defecto se recomienda Wav)',
      scope: $scope,
      buttons: [
        { text: 'Cerrar' },
        {
          text: '<b>Confirmar</b>',
          type: 'button-assertive',
          onTap: function(e) {
            for (var k in $scope.devList){
              if ($scope.devList.hasOwnProperty(k) && $scope.devList[k].checked ) {
                $scope.audioFormat = $scope.devList[k].text;
              }
            }
          }
        }
      ]
    });
  }

	//Grabación de un Audio 
	$scope.capturarAudio = function(){
		$scope.state = "recording";
   		var extension = "." + $scope.audioFormat;
   		filepart = new Date();
   		var day = filepart.getDate().toString();
   		var month = (filepart.getMonth()+1).toString();
   		var year = filepart.getFullYear().toString();
   		var hours = filepart.getHours().toString();
   		var minutes = filepart.getMinutes().toString();
   		var seconds = filepart.getSeconds().toString();
   		var sep = "-";
   		var filename = day + sep + month + sep + year + sep + hours + sep + minutes + sep + seconds + extension;
   		var src = cordova.file.externalRootDirectory + "/Viella/" + filename;
   		audio = new Media(src, function(e){console.log(e,"success");}, function(e){console.log(e,"error");});
   		audio.startRecord();
	}

  //Freno la grabación del Audio
	$scope.pararAudio = function(){
    	audio.stopRecord();
    	audio.release();
    	//var str = JSON.stringify(audio, null, 4);
    	$scope.state = "record";
    	window.plugins.toast.showWithOptions({
    		message: "El audio capturado ha sido agregado a la biblioteca de grabaciones.",
    		duration: 5000, // 5000 ms
    		position: "top",
    		styling: {
      			opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
      			backgroundColor: '#333333', // make sure you use #RRGGBB. Default #333333
      			textColor: '#FFFFFF', // Ditto. Default #FFFFFF
      			textSize: 20.5, // Default is approx. 13.
      			cornerRadius: 16, // minimum is 0 (square). iOS default 20, Android default 100
      			horizontalPadding: 20, // iOS default 16, Android default 50
      			verticalPadding: 16 // iOS default 12, Android default 30
    		}
  		});
	}

})

//+++++++++++++++++++++++++++++++++++++++++ CONTROLADOR DE LAS GRABACIONES +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

.controller('grabacionesCtrl', function($scope, $ionicPlatform, $fileFactory) {

  var fs = new $fileFactory();
  var path = cordova.file.externalRootDirectory + "/Viella/";
  $scope.playingRecords = false;
  
  fs.getEntries(path).then(function(result) {
    $scope.audioTracks = result.length;
    $scope.files = result;
  });

  var my_media;

  //Reproduzco un audio grabado determinado
  $scope.playRecordedAudio = function(name){
  	$scope.playingRecords = true;
    my_media = new Media(cordova.file.externalRootDirectory + "/Viella/" + name, function(e) { 
    my_media.release();
    }, function(err) {
      console.log("media err", err);
    });
    my_media.play();
  }

  var onResolveSuccess = function(fileEntry){
    fileEntry.remove();
    fs.getEntries(path).then(function(result) {
      $scope.audioTracks = result.length;
      $scope.files = result;
    });

    window.plugins.toast.showWithOptions({
    	message: "Se ha eliminado correctamente el audio " + fileEntry.name,
    	duration: 6000, // 5000 ms
    	position: "top",
    	styling: {
    		opacity: 0.75, // 0.0 (transparent) to 1.0 (opaque). Default 0.8
    		backgroundColor: '#333333', // make sure you use #RRGGBB. Default #333333
    		textColor: '#FFFFFF', // Ditto. Default #FFFFFF
      		textSize: 20.5, // Default is approx. 13.
    		cornerRadius: 16, // minimum is 0 (square). iOS default 20, Android default 100
    		horizontalPadding: 20, // iOS default 16, Android default 50
    		verticalPadding: 16 // iOS default 12, Android default 30
    	}
  	}); 
  }

  var fail = function(evt){
    console.log(evt.target.error.code);
  }


  function onConfirmDltRecordedAudio(buttonIndex, name) {
    if(buttonIndex == '1'){  //se confirma la eliminación del audio
      window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory + "/Viella/" + name, onResolveSuccess, fail);
    }
  }

  //Freno la reproducción de un audio
  $scope.stopRecordedAudio = function(){
  	$scope.playingRecords = false;
    my_media.stop();
  }

  //Elimino un audio grabado determinado
  $scope.deleteRecordedAudio = function(name){
    navigator.notification.confirm(
    '¿Desea eliminar este audio?',
    function(buttonIndex){
      onConfirmDltRecordedAudio(buttonIndex, name);
    },
    'Eliminando Audio',           
    ['Aceptar','Cancelar']     
    );
  }

  var options = {
    message: 'Compartir esto', 
    subject: 'Asunto', 
    files: ['', ''], 
    url: 'https://www.website.com/foo/#bar?a=b',
    chooserTitle: 'Seleccionar servicio' 
  }

  var onSuccessShare = function(result) {
    console.log("Envio completado? " + result.completed); 
    console.log("Enviado al servicio: " + result.app); 
  }

  var onErrorShare = function(msg) {
    console.log("Sharing failed with message: " + msg);
  }

  $scope.shareAudio = function(name,nativeURL){
    window.plugins.socialsharing.share('Acá está tu grabación', name, nativeURL);
  }

})
       