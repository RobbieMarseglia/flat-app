// document.getElementById("flat-canvas").addEventListener("click", drawCircle);
// let RADIUS = 40;
// const nodes = [];
// var id = 0;

// function drawCircle(event) {
//     var c = document.getElementById("flat-canvas");
//     var ctx = c.getContext("2d");

//     var x = event.clientX - c.offsetLeft;
//     var y = event.clientY - c.offsetTop;

//     var canv_width = ctx.canvas.clientWidth;
//     var canv_height = ctx.canvas.clientHeight;

//     // Only draw circle if completely within canvas
//     if ((y+RADIUS < canv_height-5) && (y-RADIUS > 5) && (x+RADIUS < canv_width-5) && (x-RADIUS > 5)){
//         const n = new Node(id, x, y);
//         n.draw(ctx);
//         nodes.push(n);
//         id++;
//     }
// }

let RADIUS = 40;
const nodes = [];
var id = 0;
var highId = 0;

class Node {

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.accept = false;
        this.dragging = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        console.log(highId);
        if (this.id == highId) {
            ctx.strokeStyle = "#ff0000";
            ctx.stroke();
        } else {
            console.log("black");
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
        }
        ctx.restore();
    }

}

var MouseEvent = function(canvas, callback) {

    function coordinates(event) {
        var dimensions = canvas.getBoundingClientRect();
        return {
            x: event.clientX - dimensions.left,
            y: event.clientY - dimensions.top
        }
    }

    function mouseDown(event) {
        event.preventDefault();
        var coords = coordinates(event);
        callback('down', coords.x, coords.y);
    }

    function mouseUp(event) {
        event.preventDefault();
        callback('up');
    }

    function mouseMove(event) {
        event.preventDefault();
        var coords = coordinates(event);
        callback('move', coords.x, coords.y);
    }

    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    canvas.onmousemove = mouseMove;

}

// function isNodeClicked(node, x, y) {
//     var dx = node.x - x;
//     var dy = node.y - y;
//     if (dx*dx + dy*dy < RADIUS*RADIUS) {
//         return true;
//     }
//     return false;
// }

function nodeUnderMouse(x, y) {
    for (let i=0; i< nodes.length; i++) {
        var node = nodes[i];
        var dx = node.x - x;
        var dy = node.y - y;
        if (dx*dx + dy*dy < RADIUS*RADIUS) {
            return i;
        }
    }
    return -1;
}

var canvas = document.getElementById('flat-canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#fcfcfc";
var fromX = 0;
var fromY = 0;

var s = new Node(id, 100, 100);
nodes.push(s);
s.draw(ctx);
id++

var state = null;

var me = new MouseEvent(canvas,
    function(eventType, x, y) {

        switch(eventType) {

            case 'down':
                fromX = x;
                fromY = y;

                var stateId = nodeUnderMouse(x,y);
                if (stateId != -1) {
                    state = nodes[stateId];
                    state.dragging = true;
                    canvas.style.cursor = "move";
                } else {
                    var s = new Node(id, x, y);
                    nodes.push(s);
                    highId = id;
                    id++;
                }

                console.log("down");
                // } else {
                //     var s = new Node(id, x, y);
                //     nodes.push(s);
                //     highId = id;
                //     s.draw(ctx);
                //     id++;
                // }

                // if (isNodeClicked(state, x, y)) {
                //     state.dragging = true;
                // }
                break;

            case 'up':
                if (state) {
                    if (state.dragging) {
                        state.dragging = false;
                        canvas.style.cursor = "auto";
                    } 
                }
                break;

            case 'move':
                var stateId = nodeUnderMouse(x,y);
                if (stateId != -1) {
                    canvas.style.cursor = "move";
                } else {
                    canvas.style.cursor = "auto";
                }

                var dx = x - fromX;
                var dy = y - fromY;
                fromX = x;
                fromY = y;

                if (state) {
                    if (state.dragging) {
                        state.x += dx;
                        state.y += dy;
                    }
                }
        }

        if (nodes.length != 0) {
            if (state && state.dragging) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                for (let i=0; i<nodes.length; i++) {
                    nodes[i].draw(ctx);
                }
            }
        }
    }
);
