'use strict';

//webkitURL is deprecated but nevertheless

const API_KEY = 'AIzaSyC3mTnJ6tywpTUAyBziSRnME63O5nSLOLg';


function processCommand(json, container, objects3d, objs) {
    console.log(Object.keys(json));
    if (typeof json["commandName"] === 'undefined') {
        throw new Error("No command name found!");
    }
    if (json["commandName"] == 'clear') {
        console.log('clear');
        clear(container, objects3d, objs);
    } else {
        if (typeof json["objectName"] === 'undefined') {
            throw new Error("No object name found!");
        }
        var object = objects3d.get(json["objectName"]);

        switch(json["commandName"]) {
            case 'create':
                console.log('create');
                create(json["objectName"], container, objects3d, objs);
            case 'remove':
                console.log('remove');
                remove(json["objectName"], container, objects3d, objs);
                break;
            case 'rotate':
                console.log('rotate');
                rotate(object, json["angle"]);
                break;
            case 'move':
                console.log('move');
                if (typeof json["type"] === 'undefined') {
                    throw new Error("No move type found!");
                }
                switch (json["type"]) {
                    case 'up':
                        up(object);
                        break;
                    case 'down':
                        down(object);
                        break;
                    case 'left':
                        left(object);
                        break;
                    case 'right':
                        right(object);
                        break;
                    case 'front':
                        front(object);
                        break;
                    case 'back':
                        back(object);
                        break;
                }
                break;
            case 'teleportate':
                console.log('teleportate');
                var subject = objects3d.get(json["subjectName"]);
                teleportate(object, subject, json["edge"]);
                break;
            case 'makeBigger':
                console.log('makeBigger');
                makeBigger(object);
                break;
            case 'colour':
                console.log('colour');
                colour(json["objectName"], container, objects3d, objs, json["r"], json["g"], json["b"]);
                break;
            case 'makeSmaller':
                console.log('makeSmaller');
                makeSmaller(object);
                break;
            default:
                console.log("Unknown command");
                break;
        }
    }
}

function teleportate(object, subject, edge) {
	var subjectBbox = new THREE.Box3().setFromObject(subject);
	var subjectCenter = subjectBbox.getCenter();
	var subjectSize = subjectBbox.getSize();

	var objectBbox = new THREE.Box3().setFromObject(object);
	var objectCenter = objectBbox.getCenter();
	var objectSize = objectBbox.getSize();

    object.position.x = subject.position.x;
    object.position.y = subject.position.y;
    object.position.z = subject.position.z;

    if (edge == "up") {
        object.position.y += subjectSize.y;
    } else if (edge == "down") {
        object.position.y -= subjectSize.y;
    } else if (edge == "right") {
        object.position.x += subjectSize.x;
    } else if (edge == "left") {
        object.position.x -= subjectSize.x;
    } else if (edge == "front") {
        object.position.z += subjectSize.z;
    } else if (edge == "back") {
        object.position.z -= subjectSize.z;
    }
}

function rotate(object, angle) {
    object.rotateY(angle);
}

function colour(objectName, container, objects3d, objs, r, g, b) {
    objects3d.get(objectName).traverse(function (child) {
        if (child instanceof THREE.Mesh) {
            child.material.color.setRGB(r, g, b);
        }
    });
}

const SCALE_MULT = 1.5;

function makeBigger(object) {
    var biggerMatrix = new THREE.Matrix4();
    biggerMatrix.makeScale(SCALE_MULT, SCALE_MULT, SCALE_MULT);
    object.applyMatrix(biggerMatrix);
}

function makeSmaller(object) {
    var smallerMatrix = new THREE.Matrix4();
    smallerMatrix.makeScale(1.0 / SCALE_MULT, 1.0 / SCALE_MULT, 1.0 / SCALE_MULT);
    object.applyMatrix(smallerMatrix);
}

const MOVE_STEP = 1;

function up(object) {
    object.translateY(MOVE_STEP);
}

function down(object) {
    object.translateY(-MOVE_STEP);
}

function left(object) {
    object.translateX(-MOVE_STEP);
}

function right(object) {
    object.translateX(MOVE_STEP);
}

function front(object, container, objects) {
    object.translateZ(MOVE_STEP);
}

function back(object, container, objects) {
    object.translateZ(-MOVE_STEP);
}

function clear(container, objects3d, objs) {
    while (container.children.length) {
        container.remove(container.children[0]);
    }
    objects3d.clear();
    objs.clear();
}

function remove(objectName, container, objects3d, objs) {
    container.remove(objects3d.get(objectName));
    objects3d.delete(objectName);
    objs.delete(objectName);
}

function create(objectName, container, objects3d, objs) {
    function drawAsset(asset) {
        drawAssetOnScene(asset, container, objects3d, objs, objectName);
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

function drawObject(objects3d, obj, materials, objectName) {
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

        console.log("Adding object to scene");

        container.add(scaler);
        objects3d.set(objectName, scaler);
    });
}

function drawObjectWithMtl(objects3d, obj, mtl, objectName) {
    var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));

    var loader = new THREE.MTLLoader();
    loader.setCrossOrigin(true);
    loader.setMaterialOptions({ignoreZeroRGBs: true});
    loader.setTexturePath(path);
    loader.load(mtl.url, function(materials) {
        drawObject(objects3d, obj, materials, objectName);
    });
}


function drawAssetOnScene(asset, container, objects3d, objs, objectName) {
    var format = asset.formats.find(format => {return format.formatType === 'OBJ';});
    if (format !== undefined) {
        var obj = format.root;
        var mtl = format.resources.find(resource => {return resource.url.endsWith('mtl')});

        objs.set(objectName, obj);
        drawObjectWithMtl(objects3d, obj, mtl, objectName);
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


function stopRecordingWithScene(container, objects3d, objs) {
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
        uploadWavWithScene(blob, container, objects3d, objs);
    }
	rec.exportWAV(uploadWav);
}

function uploadWavWithScene(blob, container, objects3d, objs) {
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
                processCommand(commands[i], container, objects3d, objs);
            }
        }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, "speech.wav");
    xhr.open("POST", "upload", true);
    xhr.send(fd);
}

function uploadTextWithScene(text, container, objects3d, objs) {
    console.log("get form with text: " + text);

    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
        if (this.readyState === 4) {
            console.log("Server returned: ", e.target.responseText);
        }
        console.log("responceText: " + xhr.responseText);
        if (xhr.responseText.endsWith("failed")) {
            rawTextField.innerHTML = xhr.responseText;
        } else {
            var parsed = JSON.parse(xhr.responseText);
            rawTextField.innerHTML = parsed["rawText"];
            var commands = parsed["commands"];
            console.log(commands);
            for (var i = 0; i < commands.length; ++i) {
                console.log(i);
                processCommand(commands[i], container, objects3d, objs);
            }
        }
    };
    var fd = new FormData();
    fd.append("text", text);
    xhr.open("POST", "upload_text", true);
    xhr.send(fd);

}

function downloadSceneWithScene(scene) {
    var zip = new JSZip();
    var oexporter = new THREE.OBJExporter();
    var result = oexporter.parse(scene);
    console.log("result: " + result);
    console.log("result.obj: " + result.mtl)

   var blob = new Blob([result], {
			type : 'text/plain'
		});
    saveAs(blob, 'model.obj');
     
}
