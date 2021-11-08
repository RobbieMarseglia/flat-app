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
        ctx.stroke();
        ctx.restore();
    }

}

var MouseEvent = function(canvas, callback) {

    function coordinates(event) {
        var dimensions = canvas.getBoundingClientRect();
        return {
            x: event.clientX - dimensions.top,
            y: event.clientY - dimensions.left
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

function isNodeClicked(node, x, y) {
    var dx = node.x - x;
    var dy = node.y - y;
    console.log(node.x, node.y);
    console.log(x,y);
    if (dx*dx + dy*dy < RADIUS*RADIUS) {
        return true;
    }
    return false;
}

var canvas = document.getElementById('flat-canvas');
var ctx = canvas.getContext('2d');
var fromX = 0;
var fromY = 0;

var state = new Node(id, 100, 100);
state.draw(ctx);

var mtt = new MouseEvent(canvas,
    function(eventType, x, y) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch(eventType) {

            case 'down':
                fromX = x;
                fromY = y;
                if (isNodeClicked(state, x, y)) {
                    state.dragging = true;
                }
                break;

            case 'up':
                state.dragging = false;
                break;

            case 'move':
                var dx = x - fromX;
                var dy = y - fromY;
                fromX = x;
                fromY = y;

                if (state.dragging) {
                    state.x += dx;
                    state.y += dy;
                }
        }

        state.draw(ctx);
    }
);
