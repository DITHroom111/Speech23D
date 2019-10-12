function processCommand(json) {
    if (typeof json["commandName"] === 'undefined') {
        throw new Error("No command name found!");
    }


    switch(json["commandName"]) {
        case 'create':
            alert("Create command);
            break;
        default:
            alert("Unknown command);
            break;
    }
}
