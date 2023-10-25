const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
import level1 from "/level1.json" assert { type: 'json'};

// Function to preload all images
function preloadImages(callback) {
    function imageLoaded(id, image, tile) {
        imagesLoaded[id] = {
            image: image,
            width: image.width,
            height: image.height
        };
        if(tile!=null && tile.objectgroup) {
            imagesLoaded[id].polygon = {};
            if(!tile.objectgroup.objects[0].polygon) {
                console.log("No polygon for tile: " + tile.id)
            }
            imagesLoaded[id].polygon.points = tile.objectgroup.objects[0].polygon;
            imagesLoaded[id].polygon.x = tile.objectgroup.objects[0].x;
            imagesLoaded[id].polygon.y = tile.objectgroup.objects[0].y;

        }

        if (Object.keys(imagesLoaded).length === level1.tilesets[0].tiles.length) {
            console.log("All images loaded")
            callback();
        }
    }

    for (let tile of level1.tilesets[0].tiles) {
        if (tile.image) {
            const image = new Image();

            image.onload = () => imageLoaded(tile.id, image, tile);
            image.src = tile.image;
        }
    }




}


function preloadSprites(callback) {
    function spriteSheet(image) {
        animations.image = image;
        for(let tile of animations.tileset.tiles) {
            spritesLoaded[tile.id] = {
                x: (animations.tileset.tilewidth * (tile.id%4))+16,
                y: (animations.tileset.tileheight * Math.floor(tile.id/4))+16,
                width: 16,
                height: 16
            }
            if(tile.animation) {
                spritesLoaded[tile.id].animation = tile.animation;
                spritesLoaded[tile.id].hitBox = {
                    x: tile.objectgroup.objects[0].x-16,
                    y: tile.objectgroup.objects[0].y-16,
                    width: tile.objectgroup.objects[0].width,
                    height: tile.objectgroup.objects[0].height
                }
            }
        }
        if(Object.keys(spritesLoaded).length === animations.tileset.tiles.length) {
            console.log("All sprites loaded")
            callback();
        }
    }

    const image = new Image();
    image.onload = () => spriteSheet(image);
    image.src = animations.tileset.image;

}

//scaling
const userScreenWidth = window.innerWidth * window.devicePixelRatio;
const userScreenHeight = window.innerHeight * window.devicePixelRatio;

const gameWidthInPixels = level1.width * level1.tilewidth;
const gameHeightInPixels = level1.height * level1.tileheight;

const scaleWidth = userScreenWidth / gameWidthInPixels;
const scaleHeight = userScreenHeight / gameHeightInPixels;

const scale = Math.min(scaleWidth, scaleHeight);

// const scale = 1;
let tileWidth = level1.tilewidth;
let tileHeight = level1.tileheight;
tileWidth = tileWidth * scale;
tileHeight = tileHeight * scale;

const mapRows = level1.height;
const mapCols = level1.width;
const mapWidth = (mapCols) * tileWidth;
const mapHeight = (mapRows) * tileHeight;


// Preload the images
preloadImages( () => {
    preloadSprites( () => {
        setInterval(() => {
            if(animations.currentFrame < animations.walkDown.animation.length-1) {
                animations.currentFrame++;
            } else {
                animations.currentFrame = 0;
            }

            let animation = animations[animations.action + animations.direction]
            let sprite = spritesLoaded[animation.id];
            let frame = sprite.animation[animations.currentFrame];
            let spriteImage = spritesLoaded[frame.tileid];
            player.hitbox = sprite.hitBox;


        },500)
        let animation = animations[animations.action + animations.direction]
        let sprite = spritesLoaded[animation.id];
        let frame = sprite.animation[animations.currentFrame];
        let spriteImage = spritesLoaded[frame.tileid];
        player.hitbox = sprite.hitBox;
        canvas.width = mapWidth;
        canvas.height = mapHeight;
        gameLoop();
    });
});

function update() {

    player.prevX = player.x;
    player.prevY = player.y;

    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;




    for(const collisionPolygon of collisionMap) {
        if(isColliding(player, collisionPolygon)) {
            console.log("collision")
            player.x = player.prevX;
            player.y = player.prevY;
        }
    }
    // for (let i = 0; i < timeBubbles.length; i++) {
    //     if (timeBubbles[i].timer > 0) {
    //         timeBubbles[i].timer--;
    //     } else {
    //         timeBubbles.splice(i, 1);
    //     }
    // }
    //
    // // Check for collision with the goal
    // const dx = player.x - goal.x;
    // const dy = player.y - goal.y;
    // const distance = Math.sqrt(dx * dx + dy * dy);
    // if (distance < player.radius + goal.radius) {
    //     alert("You completed level 1!");
    //     document.location.reload();
    // }

    // const collision = satCollision(player, collisionMap);
    // if(collision) {
    //     player.x = player.prevX-3;
    //     player.y = player.prevY-3;
    // }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw level

    // Draw the layers
    for (let layer of level1.layers) {
        let mapIndex = 0;
        let heights = [];
        for (let row = 0; row < mapRows; row ++) {
            let horiz = 0;
            for (let col = 0; col < mapCols; col++) {
                if(!heights[col]) heights[col] = 0;
                const tileVal = layer.data[mapIndex];
                if (tileVal !== 0) {
                    const tilesetIndex = tileVal-1;
                    if(tileVal === 379 && player.respawn) {
                        player.x = horiz+tileWidth;
                        player.y = heights[col];
                        player.respawn = false;
                    }
                    const image = imagesLoaded[tilesetIndex].image;
                    if (image) {
                        // col+=image.height;
                        // row+=image.width;
                        // console.log(horiz, heights[col], image.width, image.height)
                        let imgheight = heights[col];
                        if(image.height === 256)
                            imgheight -= tileHeight;
                        ctx.drawImage(image, horiz, imgheight, image.width*scale, image.height*scale);
                        if(imagesLoaded[tilesetIndex].polygon) {
                            const polygon = imagesLoaded[tilesetIndex].polygon;
                            // console.log(polygon)
                            const points = polygon.points;
                            const updatedPoints = {
                                x: horiz + (polygon.x) * scale,
                                y: imgheight + (polygon.y) * scale,
                                vertices: []
                            };
                            for (let i = 0; i < points.length; i++) {
                                updatedPoints.vertices.push({
                                    x: (points[i].x) * scale,
                                    y: points[i].y * scale
                                })
                            }
                            // console.log(updatedPoints)
                            collisionMap.push(updatedPoints);
                            ctx.strokeStyle = "red";
                            //increase width of stroke
                            ctx.lineWidth = 4;
                            ctx.beginPath();
                            ctx.moveTo(updatedPoints.x, updatedPoints.y);
                            for (let i = 1; i < updatedPoints.vertices.length; i++) {
                                ctx.lineTo( (updatedPoints.vertices[i].x  + updatedPoints.x), (updatedPoints.vertices[i].y  + updatedPoints.y));
                            }
                            ctx.closePath();
                            ctx.stroke();
                        }
                        //draw strokeRect around img
                        // ctx.strokeStyle = "black";
                        // //increase width of stroke
                        // ctx.lineWidth = 1;
                        // ctx.strokeRect(horiz, imgheight, image.width*scale, image.height*scale);

                    }
                }

                horiz += tileWidth;
                heights[col] += tileHeight;
                // heights[col] += tileHeight;


                mapIndex++;
            }
        }
    }


    let animation = animations[animations.action + animations.direction]
    let sprite = spritesLoaded[animation.id];
    let frame = sprite.animation[animations.currentFrame];
    let spriteImage = spritesLoaded[frame.tileid];

    // Draw the player
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.strokeRect(player.x+player.hitbox.x, player.y+player.hitbox.y, player.hitbox.width*playerScale, player.hitbox.height*playerScale);
    ctx.drawImage(animations.image,spriteImage.x, spriteImage.y, spriteImage.width, spriteImage.height, player.x, player.y, player.width, player.height);
}

const keys = {};

const playerScale = (128*scale)/24;


const player = {
    x: null,
    y: null,
    width: 16*playerScale,
    height: 16*playerScale,
    speed: 4,
    respawn: true
};


const timeBubbles = [];

const imagesLoaded = {}
const spritesLoaded = {}

const collisionMap = [];

const animations = {
    tileset: level1.tilesets[1],
    currentFrame: 0,
    direction: 'Down', // Default direction
    prevDirection: null, // Previous direction
    action: 'idle', // Default action
    walkDown: level1.tilesets[1].tiles.find(tile => tile.id === 2),
    walkUp: level1.tilesets[1].tiles.find(tile => tile.id === 6),
    walkLeft: level1.tilesets[1].tiles.find(tile => tile.id === 10),
    walkRight: level1.tilesets[1].tiles.find(tile => tile.id === 14),
    idleDown: level1.tilesets[1].tiles.find(tile => tile.id === 1),
    idleUp: level1.tilesets[1].tiles.find(tile => tile.id === 4),
    idleLeft: level1.tilesets[1].tiles.find(tile => tile.id === 8),
    idleRight:level1.tilesets[1].tiles.find(tile => tile.id === 12),
}





window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if(keys['a'] && keys['d']) {
        keys['a'] = false;
        keys['d'] = false;
    }
    if(keys['w'] && keys['s']) {
        keys['w'] = false;
        keys['s'] = false;
    }

    if(!keys['w'] && !keys['s'] && !keys['a'] && !keys['d']) {
        animations.action = 'idle';
        animations.currentFrame = 0;
    }

    if(keys['w'] || keys['s'] || keys['a'] || keys['d']) {
        animations.action = 'walk';
    }

    // Handle direction change based on key presses
    if (keys['a'] || keys['ArrowLeft']) {
        if(keys['w'] || keys['ArrowUp'] || keys['s'] || keys['ArrowDown']) {
            // Player is moving diagonally
            // Direction stays the same (up or down)
        } else
            animations.direction = 'Left';
    } else if (keys['d'] || keys['ArrowRight']) {
        if(keys['w'] || keys['ArrowUp'] || keys['s'] || keys['ArrowDown']) {
            // Player is moving diagonally
            // Direction stays the same (up or down)
        } else
            animations.direction = 'Right';
    }

    if (keys['w'] || keys['ArrowUp']) {
        if (keys['a'] || keys['ArrowLeft'] || keys['d'] || keys['ArrowRight']) {
            // Player is moving diagonally
            // Direction stays the same (left or right)
        } else {
            animations.direction = 'Up';
        }
    } else if (keys['s'] || keys['ArrowDown']) {
        if (keys['a'] || keys['ArrowLeft'] || keys['d'] || keys['ArrowRight']) {
            // Player is moving diagonally
            // Direction stays the same (left or right)
        } else {
            animations.direction = 'Down';
        }
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if(!keys['w'] && !keys['s'] && !keys['a'] && !keys['d']) {
        animations.action = 'idle';
        animations.currentFrame = 0;
    }
    if ((e.key === 'a' || e.key === 'ArrowLeft') && animations.direction === 'Left') {
        if (keys['w'] || keys['ArrowUp']) {
            animations.direction = 'Up';
        } else if (keys['s'] || keys['ArrowDown']) {
            animations.direction = 'Down';
        }
    } else if ((e.key === 'd' || e.key === 'ArrowRight') && animations.direction === 'Right') {
        if (keys['w'] || keys['ArrowUp']) {
            animations.direction = 'Up';
        } else if (keys['s'] || keys['ArrowDown']) {
            animations.direction = 'Down';
        }
    } else if ((e.key === 'w' || e.key === 'ArrowUp') && animations.direction === 'Up') {
        if (keys['a'] || keys['ArrowLeft']) {
            animations.direction = 'Left';
        } else if (keys['d'] || keys['ArrowRight']) {
            animations.direction = 'Right';
        }
    } else if ((e.key === 's' || e.key === 'ArrowDown') && animations.direction === 'Down') {
        if (keys['a'] || keys['ArrowLeft']) {
            animations.direction = 'Left';
        } else if (keys['d'] || keys['ArrowRight']) {
            animations.direction = 'Right';
        }
    }

});

canvas.addEventListener("click", (event) => {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;
    timeBubbles.push({ x: mouseX, y: mouseY, radius: 20, timer: 100 });
});
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

//collision detection
function isColliding(player, polygon) {
    // Convert local polygon vertices to global coordinates
    for (const vertex of [
        { x: player.x, y: player.y },
        { x: player.x + player.width, y: player.y },
        { x: player.x, y: player.y + player.height },
        { x: player.x + player.width, y: player.y + player.height }
    ]) {
        // Check if the vertex is inside the polygon using the point-in-polygon algorithm
        if (isPointInPolygon(vertex, polygon)) {
            return true; // Collision detected
        }
    }

    return false; // No collision detected
}

function isPointInPolygon(point, polygon) {
    const { x, y, vertices } = polygon;

    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i].x + x;
        const yi = vertices[i].y + y;
        const xj = vertices[j].x + x;
        const yj = vertices[j].y + y;
        const intersect =
            yi > point.y !== yj > point.y &&
            point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

