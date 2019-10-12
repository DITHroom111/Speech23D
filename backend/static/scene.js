function processCommand(json, scene) {
    if (typeof json["commandName"] === 'undefined') {
        throw new Error("No command name found!");
    }
    if (typeof json["objectName"] === 'undefined') {
        throw new Error("No object name found!");
    }

    switch(json["commandName"]) {
        case 'create':
            alert('create');
            create(json["objectName"])
            break;
        case 'rotate':
            alert('rotate;);
            break;
        case 'move':
            alert('move');
            break;
        case 'teleportate':
            alert('teleportate');
            break;
        case 'makeBigger':
            alert('makeBigger');
            break;
        case 'makeSmaller':
            alert('makeSmaller');
            break;
        default:
            alert("Unknown command);
            break;
    }
}

function create(objectName, scene) {

}
