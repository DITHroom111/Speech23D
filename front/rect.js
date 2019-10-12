'use strict';

class SceneObject {
    constructor(id, polyText, minX, minY, minZ, xSize, ySize, zSize) {
        this.id = id;
        this.polyText = polyText;

        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;

        this.xSize = xSize;
        this.ySize = ySize;
        this.zSize = zSize;
    }
}
