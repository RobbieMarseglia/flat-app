// Git push test

let RADIUS = 40; // state radius
const nodes = []; // array of states
var id = 0; // unique state ID
var highId = 0; // ID of highlighted state
var startId = 0; // ID of start state

// class Edge {

//     constructor()

// }

class Node {

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.accept = false;
        this.dragging = false;
    }

    draw(ctx) {
        // Colour state red if highlighted
        if (this.id == highId) {
            ctx.strokeStyle = "#ff0000";
        }

        // Draw state
        ctx.beginPath();
        ctx.arc(this.x, this.y, RADIUS, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw smaller circle inside to denote accept state
        if (this.accept) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, RADIUS - 8, 0, 2*Math.PI);
            ctx.fill();
            ctx.stroke();
        }

        ctx.strokeStyle = "#000000"; // revert colour to black

        // Add start arrow if start state
        if (this.id == startId) {
            ctx.beginPath();
            // TODO: define function when needed
            var headLength = 10;
            var toX = this.x - RADIUS;
            var fromX = toX - 40;
            var angle = Math.atan2(0, 40);
            ctx.moveTo(fromX, this.y);
            ctx.lineTo(toX, this.y);
            ctx.lineTo(toX - headLength*Math.cos(angle - Math.PI/6), this.y - headLength*Math.sin(angle - Math.PI/6));
            ctx.moveTo(toX, this.y);
            ctx.lineTo(toX - headLength*Math.cos(angle + Math.PI/6), this.y - headLength*Math.sin(angle + Math.PI/6));
            ctx.stroke()
        }
    }

}

function nodeUnderMouse(x, y) {
    for (var i=nodes.length-1; i >= 0 ; i--) {
        var node = nodes[i];
        var dx = node.x - x;
        var dy = node.y - y;
        if (dx*dx + dy*dy < RADIUS*RADIUS) {
            return i;
        }
    }
    return -1
}

function coordinates(event) {
    var dimensions = canvas.getBoundingClientRect();
    return {
        x: event.clientX - dimensions.left,
        y: event.clientY - dimensions.top
    }
}

function updateCanvas(eventType) {
    if (state && (state.dragging || eventType == "down")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i=0; i < nodes.length; i++) {
            nodes[i].draw(ctx);
        }
    }
}

var canvas = document.getElementById('flat-canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#fcfcfc";
var fromX = 0;
var fromY = 0;

// way to do it without?
var state = null;

window.addEventListener("keydown",
    function(event){

        switch(event.key){

            case 's':
                startId = highId;
                break;

            case 'a':
                if (nodes.length > 0) {
                    for (var i=0; i < nodes.length; i++){
                        if (nodes[i].id == highId) {
                            nodes[i].accept = !nodes[i].accept;
                            break;
                        }
                    }
                }
                break;

            // case 'Delete'
        }

        updateCanvas("down");
    }
);

canvas.addEventListener("mousedown",
    function(event) {
        var coords = coordinates(event);
        var x = coords.x;
        var y = coords.y;
        var stateIndex = nodeUnderMouse(x, y);
        if (stateIndex != -1) {
            state = nodes[stateIndex];
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
        updateCanvas("down");
    }
);

canvas.addEventListener("mousemove",
    function(event) {
        var coords = coordinates(event);
        var x = coords.x;
        var y = coords.y;
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
        updateCanvas("move");
    }
);

canvas.addEventListener("mouseup",
    function(){
        if (state) {
            if (state.dragging) {
                state.dragging = false;
                canvas.style.cursor = "auto";
            } 
        }
    }
);
