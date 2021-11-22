let RADIUS = 40; // state radius
let CHEVRON = RADIUS/4; // length of transition chevron
let SELECTAREA = 10; // padding either side of transitions for easier selection
let FONTSIZE = "16px"; // font size for labels
const nodes = []; // array of states
const edges = []; // array of transitions
var sid = 0; // unique state ID
var tid = 0; // unique transition ID
var highSid = 0; // ID of highlighted state
var highTid = -1; // ID of highlighted transition
var startSid = 0; // ID of start state
var startTid = 0; // ID of start transition

class Edge {

    constructor(id, fromNode, toNode) {
        this.id = id;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.label = "";

        // Set if self loop
        this.x = null;
        this.y = null;
        this.radius = null;

        // Set if non self loop
        this.angle = null;
    }

    draw(ctx) {

        // Colour edge red if highlighted
        if (this.id == highTid) {
            ctx.strokeStyle = "#ff0000";
        }

        ctx.beginPath();

        if (this.fromNode == this.toNode) { // self loop
            var angle = 5*Math.PI/16;
            var dx = Math.cos(angle)*RADIUS;
            var dy = Math.sin(angle)*RADIUS;
            var xn = this.fromNode.x;
            var yn = this.fromNode.y;

            // Start of arc
            var x1 = xn-dx;
            var y1 = yn-dy;
            // End of arc
            var x2 = xn+dx;
            var y2 = yn-dy;
            // Highest point of arc
            var x3 = xn;
            var y3 = yn-1.7*RADIUS;

            // Find circle equation from three points (above)
            var a = x1*(y2-y3)-y1*(x2-x3)+x2*y3-x3*y2;
            var b = (x1**2+y1**2)*(y3-y2)+(x2**2+y2**2)*(y1-y3)+(x3**2+y3**2)*(y2-y1);
            var c = (x1**2+y1**2)*(x2-x3)+(x2**2+y2**2)*(x3-x1)+(x3**2+y3**2)*(x1-x2);

            this.x = -b/(2*a); // x centre
            this.y = -c/(2*a); // y centre
            this.radius = Math.hypot(this.x-x1, this.y-y1);

            // Angle between arc centre and end of arc
            var alpha = Math.atan2(y2-this.y, x2-this.x); 

            ctx.arc(this.x, this.y, this.radius, Math.PI-alpha, alpha); // arc is drawn outside of node area

            // Draw chevron at end of arc
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2+CHEVRON*Math.cos(angle-Math.PI/10), y2-CHEVRON*Math.sin(angle-Math.PI/10));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2-CHEVRON*Math.cos(angle+Math.PI/10), y2-CHEVRON*Math.sin(angle+Math.PI/10));

            ctx.stroke();

            ctx.strokeStyle = "#000000"; // revert colour to black

            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.fillText(this.label, x3, y3-4);
            ctx.stroke();

            ctx.fillStyle = "#fcfcfc"
        } else {
            if (this.fromNode == null) { // start edge
                var toX = this.toNode.x-RADIUS;
                var toY = this.toNode.y;
                var fromX = toX-RADIUS;
                var fromY = toY;
                var dx = RADIUS;
                var dy = 0;
                this.angle = Math.atan2(dy, dx);
            } else { // edge between nodes
                var toX = this.toNode.x;
                var toY = this.toNode.y;
                var fromX = this.fromNode.x;
                var fromY = this.fromNode.y;

                // Calculates line angle between centres of each node
                var dx = toX-fromX;
                var dy = toY-fromY;
                this.angle = Math.atan2(dy, dx);

                // 'Remove' portion of edge contained within nodes
                fromX += Math.cos(this.angle)*RADIUS;
                fromY += Math.sin(this.angle)*RADIUS;
                toX -= Math.cos(this.angle)*RADIUS;
                toY -= Math.sin(this.angle)*RADIUS;
            }

            // Draw connecting line
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);

            // Draw chevron at end of edge
            ctx.lineTo(toX-CHEVRON*Math.cos(this.angle-Math.PI/6), toY-CHEVRON*Math.sin(this.angle-Math.PI/6));
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX-CHEVRON*Math.cos(this.angle+Math.PI/6), toY-CHEVRON*Math.sin(this.angle+Math.PI/6));
            ctx.stroke();

            ctx.strokeStyle = "#000000"; // revert colour to black

            if (this.fromNode != null) {
                // var width = ctx.measureText(this.label).width;
                // var height = ctx.measureText(this.label).height; //undefined

                var x = (this.fromNode.x + this.toNode.x) / 2;
                var y = (this.fromNode.y + this.toNode.y) / 2;

                // ctx.fillRect(x-width/2, y-height/2, width, height);

                ctx.fillStyle = "#000000";

                ctx.beginPath();
                ctx.fillText(this.label, x, y);
                ctx.stroke();

                ctx.fillStyle = "#fcfcfc";
            }
        }
    }
}

class Node {

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.label = "";
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

        // TODO: add background to text
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.fillText(this.label, this.x, this.y+5);
        ctx.stroke();

        ctx.fillStyle = "#fcfcfc";
    }
}

function getFromId(id, arr) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i].id == id) {
            return arr[i];
        }
    }
}


function edgeUnderMouse(x, y) {
    for (var i=edges.length-1; i >=0; i--) {
        var edge = edges[i];
        if (edge.id != startTid) {
            if (edge.fromNode == edge.toNode) {
                var dx = edge.x-x;
                var dy = edge.y-y;
                if (dx*dx+dy*dy < (edge.radius+SELECTAREA)*(edge.radius+SELECTAREA)) {
                    return i;
                }
            } else {
                var dx = edge.toNode.x - edge.fromNode.x;
                var dy = edge.toNode.y - edge.fromNode.y;
                var len = Math.sqrt(dx*dx+dy*dy);
                var perc = (dx*(x-edge.fromNode.x)+dy*(y-edge.fromNode.y))/(len*len);
                var dist = (dx*(y-edge.fromNode.y)-dy*(x-edge.fromNode.x))/len;
                if (perc > 0 && perc < 1 && Math.abs(dist) < SELECTAREA) {
                    return i;
                }
            }
        }
    }
    return -1;
}

function nodeUnderMouse(x, y) {
    for (var i=nodes.length-1; i >= 0; i--) {
        var node = nodes[i];
        var dx = node.x-x;
        var dy = node.y-y;
        // Use Pythagoras' Theorem to check if mouse is within node's area
        if (dx*dx+dy*dy < RADIUS*RADIUS) {
            return i;
        }
    }
    return -1 // indicates no node under mouse
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

        // Draw edges
        for (var i=0; i<edges.length; i++) {
            if (edges[i].id != startTid) {
                edges[i].draw(ctx);
            }
        }

        // Draw nodes
        for (var i=0; i<nodes.length; i++) {
            nodes[i].draw(ctx);
            // Draw start edge
            if (nodes[i].id == startSid) {
                getFromId(startTid, edges).draw(ctx);
            }
        }
    }
}

var canvas = document.getElementById('flat-canvas');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#fcfcfc";
ctx.textAlign = "center";
ctx.font = FONTSIZE + " Arial";
var fromX = 0;
var fromY = 0;

// way to do it without?
var state = null;

window.addEventListener("keydown",
    function(event){

        var toLabel = null;

        if (highSid != -1) {
            toLabel = getFromId(highSid, nodes);
        } else if (highTid != -1) {
            toLabel = getFromId(highTid, edges);
        }

        if (toLabel != null && event.key.length == 1) {
            var unicode = event.key.charCodeAt(0);
            // if ((unicode > 47 && unicode < 58) || (unicode > 64 && unicode < 91) || (unicode > 96 && unicode < 123) || unicode == 32) {
                toLabel.label += event.key;
            // }
        } else if (event.key == "Backspace") {
            toLabel.label = toLabel.label.slice(0,-1);
        }

        updateCanvas("down");
    }
);

canvas.addEventListener("dblclick",
    function(event) {

        var coords = coordinates(event); // get mouse coordinates
        var x = coords.x;
        var y = coords.y;
        var stateIndex = nodeUnderMouse(x, y);
        var edgeIndex = edgeUnderMouse(x, y);

        if (stateIndex != -1) { // node selected
            nodes[stateIndex].accept = !nodes[stateIndex].accept;
        } else if (edgeIndex == -1) { // empty space on canvas selected
            if (event.shiftKey) { // shift held
                if (highSid != -1) {
                    var n = new Node(sid, x, y);
                    state = n;
                    nodes.push(n);
                    sid++;
                    if (nodes.length == 1) {
                        var e = new Edge(tid, null, n);
                    } else {
                        var e = new Edge(tid, getFromId(highSid, nodes), n);
                    }
                    edges.push(e);
                    tid++;
                }
            } else if (event.ctrlKey) { // ctrl held
                var n = new Node(sid, x, y);
                state = n;
                nodes.push(n);
                highSid = sid;
                highTid = -1;
                sid++;
                if (nodes.length == 1) {
                    var e = new Edge(tid, null, n);
                    edges.push(e);
                } else {
                    // Set start edge to point at this node
                    for (var i=0; i<edges.length; i++) {
                        if (edges[i].fromNode == null) {
                            edges[i].toNode = getFromId(highSid, nodes);
                            break;
                        }
                    }
                }
            } else {
                var n = new Node(sid, x, y);
                state = n;
                nodes.push(n);
                highSid = sid;
                highTid = -1;
                sid++;
                if (nodes.length == 1) {
                    var e = new Edge(tid, null, n);
                    edges.push(e);
                    tid++;
                }
            }
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
        var edgeIndex = edgeUnderMouse(x, y);

        if (stateIndex != -1) { // state selected
            if (event.shiftKey) { // shift held
                if (highSid != -1) { // a state is currently highlighted
                    var from = getFromId(highSid, nodes);
                    var create = true;
                    for (var i=0; i<edges.length; i++) {
                        if (edges[i].fromNode == from && edges[i].toNode == nodes[stateIndex]) {
                            create = false;
                            break;
                        }
                    }
                    if (create) {
                        var e = new Edge(tid, getFromId(highSid, nodes), nodes[stateIndex]);
                        edges.push(e);
                        tid++;
                    }
                }
            } else if (event.ctrlKey) { // ctrl held
                state = nodes[stateIndex];
                highSid = state.id;
                highTid = -1;
                startSid = highSid; // set highlighted state as start state
                // Set start edge to point at this node
                for (var i=0; i<edges.length; i++) {
                    if (edges[i].fromNode == null) {
                        edges[i].toNode = getFromId(highSid, nodes);
                        break;
                    }
                }
            } else {
                state = nodes[stateIndex];
                state.dragging = true;
                highSid = state.id;
                highTid = -1;
                canvas.style.cursor = "move";
            }
        } else if (edgeIndex != -1) { // edge selected
            var edge = edges[edgeIndex];
            highTid = edge.id;
            highSid = -1;
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
