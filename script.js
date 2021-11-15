let RADIUS = 40; // state radius
let CHEVRON = RADIUS/4; // length of transition chevron
const nodes = []; // array of states
const edges = [];
var sid = 0; // unique state ID
var tid = 0; // unique transition ID
var highSid = 0; // ID of highlighted state
var highTid = 0; // ID of highlighted transition
var startSid = 0; // ID of start state
var startTid = 0; // ID of start transition (necessary?)

// class Start {

//     constructor(node) {

//     }

// }

class Edge {

    constructor(id, fromNode, toNode) {
        this.id = id;
        this.fromNode = fromNode;
        this.toNode = toNode;
    }

    draw(ctx) {
        ctx.beginPath();
        if (this.fromNode == null) { // start edge
            var toX = this.toNode.x-RADIUS;
            var toY = this.toNode.y;
            var fromX = toX-RADIUS;
            var fromY = toY;
            var dx = RADIUS;
            var dy = 0;
            var angle = Math.atan2(dy, dx);
        } else { // edge between nodes
            var toX = this.toNode.x;
            var toY = this.toNode.y;
            var fromX = this.fromNode.x;
            var fromY = this.fromNode.y;

            // Calculates line angle between centres of each node
            var dx = toX-fromX;
            var dy = toY-fromY;
            var angle = Math.atan2(dy, dx);

            // 'Remove' portion of edge contained within nodes
            fromX += Math.cos(angle)*RADIUS;
            fromY += Math.sin(angle)*RADIUS;
            toX -= Math.cos(angle)*RADIUS;
            toY -= Math.sin(angle)*RADIUS;
        }

        // Draw connecting line
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);

        // Draw chevron at end of edge
        ctx.lineTo(toX-CHEVRON*Math.cos(angle-Math.PI/6), toY-CHEVRON*Math.sin(angle-Math.PI/6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX-CHEVRON*Math.cos(angle+Math.PI/6), toY-CHEVRON*Math.sin(angle+Math.PI/6));
        ctx.stroke();
    }

}

class Node {

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.accept = false;
        this.dragging = false;
        this.neighbours = [];
    }

    draw(ctx) {
        // Colour state red if highlighted
        if (this.id == highSid) {
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
            ctx.arc(this.x, this.y, RADIUS-8, 0, 2*Math.PI);
            ctx.fill();
            ctx.stroke();
        }

        ctx.strokeStyle = "#000000"; // revert colour to black
    }

}

// Might get this to return the node instead of the ID
function nodeUnderMouse(x, y) {
    for (var i=nodes.length-1; i >= 0 ; i--) {
        var node = nodes[i];
        var dx = node.x-x;
        var dy = node.y-y;
        // Use Pythagoras' Theorem to check if mouse is within node's area
        if (dx*dx+dy*dy < RADIUS*RADIUS) {
            return i;
        }
    }
    return -1
}

function coordinates(event) {
    var dimensions = canvas.getBoundingClientRect();
    // Account for offset of canvas by subtracting its top most- and left most-position in the window
    return {
        x: event.clientX-dimensions.left,
        y: event.clientY-dimensions.top
    }
}

function updateCanvas(eventType) {
    // Only update canvas if user is dragging state, pressing key, or clicking mouse
    if (state && (state.dragging || eventType == "down")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw nodes
        for (var i=0; i<nodes.length; i++) {
            nodes[i].draw(ctx);
        }
        // Draw edges
        for (var i=0; i<edges.length; i++) {
            edges[i].draw(ctx);
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
                startSid = highSid;
                for (var i=0; i<edges.length; i++) {
                    if (edges[i].fromNode == null) {
                        for (var j=0; j<nodes.length; j++) {
                            if (nodes[j].id == highSid) {
                                edges[i].toNode = nodes[j];
                                break;
                            }
                        }
                        break;
                    }
                }
                break;

            case 'a':
                if (nodes.length > 0) {
                    for (var i=0; i<nodes.length; i++) {
                        if (nodes[i].id == highSid) {
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

// Check for SHIFT-Click
canvas.addEventListener("mousedown",
    function(event) {
        var coords = coordinates(event);
        var x = coords.x;
        var y = coords.y;
        var stateIndex = nodeUnderMouse(x, y);
        if (stateIndex != -1) {
            state = nodes[stateIndex];
            state.dragging = true;
            highSid = state.id;
            canvas.style.cursor = "move";
        } else {
            var n = new Node(sid, x, y);
            if (nodes.length == 0){
                var e = new Edge(tid, null, n);
                edges.push(e);
                tid++;
            }
            nodes.push(n);
            highSid = sid;
            sid++;
            state = n;
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

        var dx = x-fromX;
        var dy = y-fromY;
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

// const nodeA = new Node(0, 400, 100);
// const nodeB = new Node(0, 100, 200);
// nodeA.draw(ctx);
// nodeB.draw(ctx);

// const edge = new Edge(0, nodeA, nodeB);
// edge.draw(ctx);
