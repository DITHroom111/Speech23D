'use strict';


const API_KEY = 'AIzaSyC3mTnJ6tywpTUAyBziSRnME63O5nSLOLg';


function getFirstAsset(data) {
    var assets = data.assets;
    if (assets) {
        return assets[0];
    } else {
        alert("No assets found");
    }
}


function processFirstAsset(keywords, processAsset) {
    var url = `https://poly.googleapis.com/v1/assets?keywords=${keywords}&format=OBJ&key=${API_KEY}`;

    var request = new XMLHttpRequest();
    request.open( 'GET', url, true );
    request.addEventListener('load', function(event) {
        processAsset(getFirstAsset(JSON.parse(event.target.response)));
    });
    request.send(null);
}
