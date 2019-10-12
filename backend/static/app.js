'use strict';

//webkitURL is deprecated but nevertheless

const API_KEY = 'AIzaSyC3mTnJ6tywpTUAyBziSRnME63O5nSLOLg';


function processCommand(json, container, objects) {
    console.log(Object.keys(json));
    if (typeof json["commandName"] === 'undefined') {
        throw new Error("No command name found!");
    }
    if (json["commandName"] != 'clear') {
        if (typeof json["objectName"] === 'undefined') {
            throw new Error("No object name found!");
        }
    }

    switch(json["commandName"]) {
        case 'create':
            console.log('create');
            create(json["objectName"], container, objects);
            break;
        case 'remove':
            console.log('remove');
            remove(json["objectName"], container, objects);
            break;
        case 'clear':
            console.log('clear');
            clear(container, objects);
            break;
        case 'rotate':
            console.log('rotate');
            break;
        case 'move':
            console.log('move');
            if (typeof json["type"] === 'undefined') {
                throw new Error("No move type found!");
            }
            switch (json["type"]) {
                case 'up':
                    up(json["objectName"], container, objects);
                    break;
                case 'down':
                    down(json["objectName"], container, objects);
                    break;
                case 'left':
                    left(json["objectName"], container, objects);
                    break;
                case 'right':
                    right(json["objectName"], container, objects);
                    break;
                case 'front':
                    front(json["objectName"], container, objects);
                    break;
                case 'back':
                    back(json["objectName"], container, objects);
                    break;
            }
            break;
        case 'teleportate':
            console.log('teleportate');
            break;
        case 'makeBigger':
            console.log('makeBigger');
            makeSmaller(json["objectName"], container, objects);
            break;
        case 'makeSmaller':
            console.log('makeSmaller');
            makeBigger(json["objectName"], container, objects);
            break;
        default:
            console.log("Unknown command");
            break;
    }
}

const SCALE_MULT = 1.5;

function makeBigger(objectName, container, objects) {
    Matrix4 biggerMatrix = TREE.Matrix4.makeScale(SCALE_MULT, SCALE_MULT, SCALE_NULT);
    objects.get(objectName).applyMatrix(biggerMatrix);
}

function makeSmaller(objectName, container, objects) {
    Matrix4 smallerMatrix = TREE.Matrix4.makeScale(1.0 / SCALE_MULT, 1.0 / SCALE_MULT, 1.0 / SCALE_NULT);
    objects.get(objectName).applyMatrix(smallerMatrix);
}


const MOVE_STEP = 100;

function up(objectName, container, objects) {
    objects.get(objectName).translateZ(MOVE_STEP);
}

function down(objectName, container, objects) {
    objects.get(objectName).translateZ(-MOVE_STEP);
}

function left(objectName, container, objects) {
    objects.get(objectName).translateX(MOVE_STEP);
}

function right(objectName, container, objects) {
    objects.get(objectName).translateX(-MOVE_STEP);
}

function front(objectName, container, objects) {
    objects.get(objectName).translateY(MOVE_STEP);
}

function back(objectName, container, objects) {
    objects.get(objectName).translateY(-MOVE_STEP);
}


function clear(container, objects) {
    while (container.children.length) {
        container.remove(container.children[0]);
    }
    objects.clear();
}

function remove(objectName, container, objects) {
    container.remove(objects.get(objectName));
    objects.delete(objectName);
}

function create(objectName, container, objects) {
    function drawAsset(asset) {
        drawAssetOnScene(asset, container, objects, objectName);
    }
    processFirstAsset(objectName, drawAsset);
}

function findAssetWithExactTitle(text, assets) {
    console.log(text);
    for (var i = 0; i < assets.length; ++i) {
        console.log(assets[i].displayName);
        if (assets[i].displayName.toLowerCase() == text) {
            return i;
        }
    }
    return -1;
}


function getBestAsset(data, text) {
    var assets = data.assets;
    if (assets) {
        var bestAssetIndex = findAssetWithExactTitle(text, assets);
        if (bestAssetIndex != -1) {
            return assets[bestAssetIndex];
        } else {
            return assets[0];
        }
    } else {
        console.log("No assets found");
    }
}


function processFirstAsset(objectName, processAsset) {
    var url = `https://poly.googleapis.com/v1/assets?keywords=${objectName}&format=OBJ&pageSize=100&key=${API_KEY}`;

    var request = new XMLHttpRequest();
    request.open( 'GET', url, true );
    request.addEventListener('load', function(event) {
        processAsset(getBestAsset(JSON.parse(event.target.response), objectName));
    });
    request.send(null);
}


function drawAssetOnScene(asset, container, objects, objectName) {
    var format = asset.formats.find(format => {return format.formatType === 'OBJ';});

    if ( format !== undefined ) {
        var obj = format.root;
        var mtl = format.resources.find(resource => {return resource.url.endsWith('mtl')});

        var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));

        var loader = new THREE.MTLLoader();
        loader.setCrossOrigin(true);
        loader.setMaterialOptions({ignoreZeroRGBs: true});
        loader.setTexturePath(path);
        loader.load(mtl.url, function(materials) {
            var loader = new THREE.OBJLoader();
            loader.setMaterials(materials);
            loader.load(obj.url, function(object) {
                var box = new THREE.Box3();
                box.setFromObject(object);

                // re-center
                var center = box.getCenter();
                center.y = box.min.y;
                object.position.sub(center);

                // scale
                var scaler = new THREE.Group();
                scaler.add(object);
                scaler.scale.setScalar(6 / box.getSize().length());
                container.add(scaler);
                objects.set(objectName, scaler);
            });
        });
    }
}

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

    var constraints = {audio: true, video: false}

 	/*
    	Disable the record button until we get a success or fail from getUserMedia()
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;
    rawTextField.innerHTML = "tell me a command!";

	/*
    	We're using the standard promise based getUserMedia()
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		var audioContext = new AudioContext();

		//update the format
		//document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		var input = audioContext.createMediaStreamSource(stream);

		/*
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input, {numChannels: 1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
	});
}


function stopRecordingWithScene(container, objects) {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;

	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink

    function uploadWav(blob) {
        uploadWavWithScene(blob, container, objects);
    }
	rec.exportWAV(uploadWav);
}

function uploadWavWithScene(blob, container, objects) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            console.log("Server returned: ", e.target.responseText);
        }
        console.log(xhr.responseText);
        if (xhr.responseText.endsWith("failed")) {
            rawTextField.innerHTML = xhr.responseText;
        } else {
            var parsed = JSON.parse(xhr.responseText);
            rawTextField.innerHTML = parsed["rawText"];
            var commands = parsed["commands"];
            console.log(commands);
            for (var i = 0; i < commands.length; ++i) {
                console.log(i);
                processCommand(commands[i], container, objects);
            }
        }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, "speech.wav");
    xhr.open("POST", "upload", true);
    xhr.send(fd);
}
