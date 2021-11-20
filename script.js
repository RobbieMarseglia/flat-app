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

        if (this.fromNode == this.toNode) { // self loop
            var angle = Math.PI/4;
            var dx = Math.cos(angle)*RADIUS;
            var dy = Math.sin(angle)*RADIUS;
            var xn = this.fromNode.x;
            var yn = this.fromNode.y;

            var x1 = xn-dx;
            var y1 = yn+dy;
            var x2 = xn+dx;
            var y2 = yn+dy;
            var x3 = xn;
            var y3 = yn+1.5*RADIUS;

            var a = x1*(y2-y3)-y1*(x2-x3)+x2*y3-x3*y2;
            var b = (x1**2+y1**2)*(y3-y2)+(x2**2+y2**2)*(y1-y3)+(x3**2+y3**2)*(y2-y1);
            var c = (x1**2+y1**2)*(x2-x3)+(x2**2+y2**2)*(x3-x1)+(x3**2+y3**2)*(x1-x2);

            var x = -b/(2*a);
            var y = -c/(2*a);

            var r = Math.sqrt(x**2+y**2);

            ctx.arc(x, y, r, 0, 2*Math.PI);
            ctx.stroke();
        } else {
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

function getFromId(id, arr) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i].id == id) {
            return arr[i];
        }
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
    // Account for canvas offset by subtracting its top most- and left most-position in window
    return {
        x: event.clientX-dimensions.left,
        y: event.clientY-dimensions.top
    }
}

function updateCanvas(eventType) {
    // Only update canvas if user is dragging state, pressing key, or clicking mouse
    if (state && (state.dragging || eventType == "down")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

        // Draw start node and start edge first
        getFromId(startSid, nodes).draw(ctx);
        getFromId(startTid, edges).draw(ctx);

        // Draw edges
        for (var i=0; i<edges.length; i++) {
            if (edges[i].id != startTid) {
                edges[i].draw(ctx);
            }
        }

        // Draw nodes
        for (var i=0; i<nodes.length; i++) {
            if (nodes[i].id != startSid) {
                nodes[i].draw(ctx);
            }
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

// TODO: double click to make accept state

window.addEventListener("keydown",
    function(event){

        switch(event.key){

            case 's':
                startSid = highSid; // set highlighted state as start state
                // Set start edge to point at this node
                for (var i=0; i<edges.length; i++) {
                    if (edges[i].fromNode == null) {
                        edges[i].toNode = getFromId(highSid, nodes);
                        break;
                    }
                }
                break;

            case 'a':
                // Toggle if node is an accept state
                if (nodes.length > 0) {
                    const s = getFromId(highSid, nodes);
                    s.accept = !s.accept;
                }
                break;

            // case 'Delete'
        }

        updateCanvas("down");
    }
);

canvas.addEventListener("mousedown",
    function(event) {

        var coords = coordinates(event); // get mouse coordinates
        var x = coords.x;
        var y = coords.y;
        var stateIndex = nodeUnderMouse(x, y);

        if (!event.shiftKey) { // shift key not held
            // Drag node if existing one is selected
            if (stateIndex != -1) {
                state = nodes[stateIndex];
                state.dragging = true;
                highSid = state.id;
                canvas.style.cursor = "move";
            // Create new node if one is not selected
            } else {
                var n = new Node(sid, x, y);
                // Set start edge to point to new node if it's the first to be drawn
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
        } else { // shift key held
            // Create edge from highlighted node to selected node
            if (stateIndex != -1) {
                // TODO: check if edge already exists between nodes
                var e = new Edge(tid, getFromId(highSid, nodes), nodes[stateIndex]);
                edges.push(e);
                tid++;
                // highSid = nodes[stateIndex].id; // with or without?
                updateCanvas("down");
            }
        }
        console.log(nodes);
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
