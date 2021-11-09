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
        if (this.id == highId) {
            ctx.strokeStyle = "#ff0000";
        }
        ctx.stroke();
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
                    highId = state.id;
                    canvas.style.cursor = "move";
                } else {
                    var s = new Node(id, x, y);
                    nodes.push(s);
                    highId = id;
                    id++;
                    state = s;
                }
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

        if (state && (state.dragging || eventType == "down")) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i=0; i<nodes.length; i++) {
                nodes[i].draw(ctx);
            }
        }
    }
);
