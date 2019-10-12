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

function drawAssetOnScene(asset, scene) {
    var format = asset.formats.find( format => { return format.formatType === 'OBJ'; } );

    if ( format !== undefined ) {
        var obj = format.root;
        var mtl = format.resources.find( resource => { return resource.url.endsWith( 'mtl' ) } );

        var path = obj.url.slice( 0, obj.url.indexOf( obj.relativePath ) );

        var loader = new THREE.MTLLoader();
        loader.setCrossOrigin( true );
        loader.setMaterialOptions( { ignoreZeroRGBs: true } );
        loader.setTexturePath( path );
        loader.load( mtl.url, function ( materials ) {
            var loader = new THREE.OBJLoader();
            loader.setMaterials( materials );
            loader.load( obj.url, function ( object ) {
                var box = new THREE.Box3();
                box.setFromObject( object );

                // re-center
                var center = box.getCenter();
                center.y = box.min.y;
                object.position.sub( center );

                // scale
                var scaler = new THREE.Group();
                scaler.add( object );
                scaler.scale.setScalar( 6 / box.getSize().length() );
                scene.add( scaler );
            });
        });
    }
}
