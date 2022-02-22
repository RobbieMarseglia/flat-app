let RADIUS = 40;        // state radius
let CHEVRON = RADIUS/4; // length of transition chevron
let SELECTAREA = 10;    // padding either side of transitions for easier selection
let FONTSIZE = 16;      // font size for labels
let EPSILON = String.fromCharCode(949); // epsilon symbol
let SIGMA = ['a','b',EPSILON]; // fsm alphabet
const nodes = [];       // array of states
var edges = [];         // array of transitions
var sid = 0;            // unique state ID
var tid = 0;            // unique transition ID
var highSid = -1;       // ID of highlighted state
var highTid = -1;       // ID of highlighted transition
var startSid = -1;      // ID of start state
var startTid = -1;      // ID of start transition

class Regex {

    constructor(n, sigma, probOr, probKleene, probEmpty) {
        this.postfix = "";
        this.regex = this.#kleene(n, sigma, probOr, probKleene, probEmpty);
        this.nfa = this.#regexToNfa(this.postfix); // construct alongside regex?
    }

    #regexToNfa(regex) {
        const nfa = [];
        const s = [];
        var start = 0;
        var end = 1;
        var count = 0;
        var c1 = 0;
        var c2 = 0;

        for (var i=0; i<regex.length; i++) {
            if (regex[i] == '*') {
                var top = s.pop();
                var r1 = top[0];
                var r2 = top[1];
                c1 = count++;
                c2 = count++;
                s.push([c1, c2]);
                nfa.push({});
                nfa.push({});
                if (!(nfa[r2][EPSILON])) {
                    nfa[r2][EPSILON] = [];
                }
                nfa[r2][EPSILON].push(r1, c2);
                nfa[c1][EPSILON] = [r1, c2];
                if (start == r1) {
                    start = c1;
                }
                if (end == r2) {
                    end = c2;
                }
            } else if (regex[i] == '.') {
                var top1 = s.pop();
                var top2 = s.pop();
                var r11 = top1[0];
                var r12 = top1[1];
                var r21 = top2[0];
                var r22 = top2[1];
                s.push([r21, r12]);
                if (!(nfa[r22][EPSILON])) {
                    nfa[r22][EPSILON] = [];
                }
                nfa[r22][EPSILON].push(r11);
                if (start == r11) {
                    start = r21;
                }
                if (end == r22) {
                    end = r12;
                }
            } else if (regex[i] == '+') {
                c1 = count++;
                c2 = count++;
                nfa.push({});
                nfa.push({});
                var top1 = s.pop();
                var top2 = s.pop();
                var r11 = top1[0];
                var r12 = top1[1];
                var r21 = top2[0];
                var r22 = top2[1];
                s.push([c1,c2]);
                nfa[c1][EPSILON] = [r21, r11];
                if (!(nfa[r12][EPSILON])) {
                    nfa[r12][EPSILON] = [];
                }
                nfa[r12][EPSILON].push(c2);
                if (!(nfa[r22][EPSILON])) {
                    nfa[r22][EPSILON] = [];
                }
                nfa[r22][EPSILON].push(c2);
                if (start == r11 || start == r21) {
                    start = c1;
                }
                if (end == r22 || end == r12) {
                    end = c2;
                }
            } else {
                c1 = count++;
                c2 = count++;
                nfa.push({});
                nfa.push({});
                s.push([c1,c2]);
                nfa[c1][regex[i]] = [c2];
            }
        }

        return {
            "table" : nfa,
            "start" : start,
            "end" : end
        }
    }

    #kleene(n, sigma, probOr, probKleene, probEmpty) {
        var expr = this.#expression(n, sigma, probOr, probKleene, probEmpty);
        if (Math.random() <= probKleene) {
            if (expr.length > 1) {
                expr = "(" + expr + ")*";
            } else {
                expr = expr + "*";
            }
            this.postfix += "*";
        }
        return expr;
    }

    #expression(n, sigma, probOr, probKleene, probEmpty) {
        // if (n == 0) {
        //     return EPSILON;
        // } else if (n == 1) {
        if (n < 2) {
            var symbol = sigma[Math.floor(Math.random() * sigma.length)];
            this.postfix += symbol;
            return symbol;
        } else if (Math.random() <= probEmpty) {
            this.postfix += EPSILON;
            var after = this.#kleene(n-1, sigma, probOr, probKleene, probEmpty);
            this.postfix += "+";
            return "(" + EPSILON + " + " + after + ")";
        }

        // var beforeSize = Math.floor(Math.random() * n);
        var beforeSize = Math.floor(n/2);

        // console.log(beforeSize, n-beforeSize);

        var before = this.#kleene(beforeSize, sigma, probOr, probKleene, probEmpty);
        var after = this.#kleene(n-beforeSize, sigma, probOr, probKleene, probEmpty);

        if (Math.random() <= probOr) {
            // if (before == after) {
            //     return before;
            // }
            this.postfix += "+";
            return "(" + before + " + " + after + ")";
        }

        // console.log(before, after);
        // if (before == EPSILON) {
        //     return after;
        // } else if (after == EPSILON) {
        //     return before;
        // }
        this.postfix += ".";
        return before + after;
    }

}

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

        // Set if curved
        this.curved = false;
    }

    draw(ctx) {

        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";

        // Colour edge red if highlighted
        if (this.id == highTid) {
            ctx.strokeStyle = "#ff0000";
            ctx.fillStyle = "#ff0000";
        }

        ctx.beginPath();

        if (this.fromNode == this.toNode) { // self loop
            this.angle = 5*Math.PI/16;
            var dx = Math.cos(this.angle)*RADIUS;
            var dy = Math.sin(this.angle)*RADIUS;
            var xn = this.fromNode.x;
            var yn = this.fromNode.y;

            // Start of arc
            var x1 = xn-dx;
            var y1 = yn-dy;
            // End of arc
            var x2 = xn+dx;
            var y2 = yn-dy;
            // Arc turning point
            var x3 = xn;
            var y3 = yn-1.7*RADIUS;

            // Find circle equation from three points (above)
            var circle = circleFromPoints(x1, y1, x2, y2, x3, y3);

            this.x = circle.x; // x centre
            this.y = circle.y // y centre
            this.radius = circle.radius;

            // Angle between arc centre and end of arc
            var alpha = Math.atan2(y2-this.y, x2-this.x); 

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, Math.PI-alpha, alpha); // arc is drawn outside of node area
            ctx.stroke();

            // Draw chevron at end of arc
            // drawChevron(x2, y2, this.angle, Math.PI/10);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2+CHEVRON*Math.cos(this.angle-Math.PI/10), y2-CHEVRON*Math.sin(this.angle-Math.PI/10));
            ctx.lineTo(x2-CHEVRON*Math.cos(this.angle+Math.PI/10), y2-CHEVRON*Math.sin(this.angle+Math.PI/10));
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.strokeStyle = "#000000"; // revert colour to black
            ctx.fillStyle = "#000000";

            ctx.beginPath();
            ctx.fillText(this.label, x3, y3-4);
            ctx.stroke();

            ctx.fillStyle = "#fcfcfc"
        } else if (this.curved) { // curved edge between nodes
            var x1 = this.fromNode.x;
            var y1 = this.fromNode.y;

            var x2 = this.toNode.x;
            var y2 = this.toNode.y;

            var dx = x1-x2;
            var dy = y1-y2;
            // var len = Math.sqrt(dx*dx+dy*dy);
            this.angle = Math.atan2(dy, dx);

            var x3 = 0.5*(x1+x2) + 2*SELECTAREA*Math.cos(this.angle - Math.PI/2);
            var y3 = 0.5*(y1+y2) + 2*SELECTAREA*Math.sin(this.angle - Math.PI/2);

            // create circle using three points
            var circle = circleFromPoints(x1, y1, x2, y2, x3, y3);

            var xc = circle.x;
            var yc = circle.y;

            // only draw section between nodes
            var startAngle = Math.atan2(y2-yc, x2-xc);
            var endAngle = Math.atan2(y1-yc, x1-xc);

            ctx.beginPath();
            ctx.arc(xc, yc, circle.radius, startAngle, endAngle);
            ctx.stroke();

            // get coords of arc intersection with 'to' node
            var alpha = Math.acos(RADIUS/(2*circle.radius)) - startAngle + Math.PI;

            var xi = x2 + RADIUS*Math.cos(alpha);
            var yi = y2 - RADIUS*Math.sin(alpha);
            
            // dynamically draw chevron
            // drawChevron(xi, yi, this.angle, Math.PI/5);
            ctx.beginPath();
            ctx.moveTo(xi, yi);
            ctx.lineTo(xi+CHEVRON*Math.cos(this.angle-Math.PI/5), yi+CHEVRON*Math.sin(this.angle-Math.PI/5));
            ctx.lineTo(xi+CHEVRON*Math.cos(this.angle+Math.PI/5), yi+CHEVRON*Math.sin(this.angle+Math.PI/5));
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.strokeStyle = "#000000"; // revert colour to black
            ctx.fillStyle = "#000000";

            // draw the label at the third point that was created
            ctx.fillStyle = "#fcfcfc";
                
            var width = ctx.measureText(this.label).width;

            ctx.fillRect(x3-width/2, y3-FONTSIZE+2, width, FONTSIZE+2);

            ctx.fillStyle = "#000000";

            ctx.beginPath();
            ctx.fillText(this.label, x3, y3);
            ctx.stroke();

            ctx.fillStyle = "#fcfcfc";
        } else {
            if (this.id == startTid) { // start edge
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
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            // Draw chevron at end of edge
            drawChevron(toX, toY, this.angle, Math.PI/6);

            ctx.strokeStyle = "#000000"; // revert colour to black
            ctx.fillStyle = "#fcfcfc";

            if (this.fromNode != null) {

                var width = ctx.measureText(this.label).width;

                var x = (this.fromNode.x + this.toNode.x) / 2;
                var y = (this.fromNode.y + this.toNode.y) / 2;

                ctx.fillRect(x-width/2, y-FONTSIZE+2, width, FONTSIZE+2);

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

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.fillText(this.label, this.x, this.y+5);
        ctx.stroke();

        ctx.fillStyle = "#fcfcfc";
    }
}

function isomorphic(user, regex) {
    // console.log(user.dfa);
    // console.log(regex.dfa);

    const symbols = ['a', 'b'];
    const accept  = user.accept.concat(regex.accept);
    const parent = {};
    const rank = {};
    const pairStack = [];

    for (var s of Object.keys(user.dfa)) {
        makeSet(parseInt(s), parent, rank);
    }
    for (var s of Object.keys(regex.dfa)) {
        makeSet(parseInt(s), parent, rank);
    }

    var equal = true;

    equal = unionCheck(user.start, regex.start, parent, rank, accept);

    pairStack.push([user.start, regex.start]);

    while (pairStack.length > 0 && equal) {
        pair = pairStack.pop();
        for (var c of symbols) {
            // console.log(parent[user.dfa[pair[0]][c]]);
            var r1 = findSet(user.dfa[pair[0]][c], parent);
            var r2 = findSet(regex.dfa[pair[1]][c], parent);
            if (r1 != r2) {
                equal = unionCheck(r1, r2, parent, rank, accept);
                pairStack.push([r1, r2]);
            }
        }
    }

    return equal;
}

function makeSet(x, parent, rank) {
    parent[x] = x;
    rank[x] = 0;
}

function unionCheck(x, y, parent, rank, accept) {
    var a = findSet(x, parent);
    var b = findSet(y, parent);
    if (accept.includes(a)) {
        if (!accept.includes(b)) {
            return false;
        }
    } else {
        if (accept.includes(b)) {
            return false;
        }
    }
    link(a, b, parent, rank);
    return true;
}

function link(x, y, parent, rank) {
    if (rank[x] > rank[y]) {
        parent[y] = x;
    } else {
        parent[x] = y;
        if (rank[x] == rank[y]) {
            rank[y] += 1;
        }
    }
}

function findSet(x, parent) {
    if (x != parent[x]) {
        parent[x] = findSet(parent[x], parent);
    }
    return parent[x];
}

function subsetConstruct(nfa, final, dfaId) {
    const symbols = ['a', 'b'];

    const accept = [];
    var start = dfaId;

    const dfa = {};
    const dfaIds = {};

    const nodeClosure = [];
    for (const [n, t] of Object.entries(nfa)) {
        nodeClosure[n] = [];
    }

    var firstState = eClose([startSid], nodeClosure, nfa);
    dfa[dfaId] = {};
    dfaIds[firstState] = dfaId++;
    for (var n of firstState) {
        if (final.includes(n)) {
            accept.push(dfaIds[firstState]);
            break;
        }
    }

    const nodeQueue = [firstState];
    
    while (nodeQueue.length > 0) {
        var currentState = nodeQueue.shift();
        for (var s of symbols) {
            var subset = nodeSubset(currentState, s, nodeClosure, nfa).sort();
            if (!(subset in dfaIds)) {
                dfa[dfaId] = {};
                dfaIds[subset] = dfaId++;
                for (var n of subset) {
                    if (final.includes(n)) {
                        accept.push(dfaIds[subset]);
                        break;
                    }
                }
                nodeQueue.push(subset);
            }
            dfa[dfaIds[currentState]][s] = dfaIds[subset];
        }
    }

    return {
        dfa : dfa,
        accept : accept,
        start : start
    }
}

function nodeSubset(states, symbol, nodeClosure, nfa) {
    var subset = new Set();
    for (var s of states) {
        for (var t in nfa[s]) {
            if (t == symbol) {
                for (var n of nfa[s][t]) {
                    subset.add(n);
                }
            }
        }
    }
    var nodeIds  = [];
    for (var n of subset.values()) {
        nodeIds.push(n);
    }
    return eClose(nodeIds, nodeClosure, nfa);
}

function eClose(states, nodeClosure, nfa) {
    var closed = new Set();
    for (var n of states) {
        if (nodeClosure[n].length == 0) {
            var nClosed = new Set();
            var eStates = close(n, nodeClosure, nClosed, nfa);
            for (var q of eStates) {
                nodeClosure[n].push(q);
            }
        }
        for (var q of nodeClosure[n]) {
            closed.add(q);
        }
    }
    const values = [];
    for (var v of closed.values()) {
        values.push(v);
    }
    return values;
}

function close(k, nodeClosure, nClosed, nfa) {
    if (nodeClosure[k].length == 0) { // if E-CLOSE(k) not yet calculated
        nClosed.add(k);
        if (nfa[k].length != 0 && EPSILON in nfa[k]) { // if state k has epsilon transitions
            for (var q of nfa[k][EPSILON]) { // for each state immediately reachable via epsilon transitions from state k
                if (!nClosed.has(q)) { // if state q not in E-CLOSE(n)
                    for (var p of close(q, nodeClosure, nClosed, nfa)) { // add each state from E-CLOSE(q) to E-CLOSE(n)
                        nClosed.add(p);
                    }
                }
            }
        }
    } else { // if E-CLOSE(k) already calculated
        for (var q of nodeClosure[k]) { // add each state from E-CLOSE(k) to E-CLOSE(n)
            nClosed.add(q);
        }
    }
    return nClosed.values();
}

function getSymbols(label) {
    var s = new Set();
    var symbols = ['a', 'b', EPSILON];
    for (var char of label) {
        if (symbols.includes(char)) {
            s.add(char);
        }
    }
    return s.values();
}

function transTable() {
    var nfa = {};
    var final = [];
    for (var n of nodes) {
        nfa[n.id] = {};
        for (var s of SIGMA) {
            nfa[n.id][s] = [];
        }
        if (n.accept) {
            final.push(n.id);
        }
    }
    for (var e of edges) {
        var symbols = getSymbols(e.label);
        for (var s of symbols) {
            nfa[e.fromNode.id][s].push(e.toNode.id);
        }
    }

    // var nodeClosure = [];
    // var nodeIds = [];
    // for (var n of nodes) {
    //     nodeClosure[n.id] = [];
    //     nodeIds.push(n.id);
    // }

    // console.log(nodeSubset([0,1], 'a', nodeClosure, nfa));

    // var s = eClose(nodeIds, nodeClosure, nfa);

    // console.log(nodeClosure);

    return {
        table : nfa,
        accept : final
    }
}

function drawChevron(x, y, angleEdge, angleHead) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x-CHEVRON*Math.cos(angleEdge - angleHead), y-CHEVRON*Math.sin(angleEdge - angleHead));
    ctx.lineTo(x-CHEVRON*Math.cos(angleEdge + angleHead), y-CHEVRON*Math.sin(angleEdge + angleHead));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

function circleFromPoints(x1, y1, x2, y2, x3, y3) {
    // Find circle equation from three points (above)
    var a = x1*(y2-y3)-y1*(x2-x3)+x2*y3-x3*y2;
    var b = (x1**2+y1**2)*(y3-y2)+(x2**2+y2**2)*(y1-y3)+(x3**2+y3**2)*(y2-y1);
    var c = (x1**2+y1**2)*(x2-x3)+(x2**2+y2**2)*(x3-x1)+(x3**2+y3**2)*(x1-x2);

    var x = -b/(2*a); // x centre
    var y = -c/(2*a); // y centre

    return {
        'x' : x,
        'y' : y,
        'radius' : Math.hypot(x-x1, y-y1)
    }
}

function getFromId(id, arr) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i].id == id) {
            return i;
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
                if (edge.curved) {
                    var perc = (dx*(x-edge.fromNode.x+2*SELECTAREA*Math.cos(1.5*Math.PI-edge.angle))+dy*(y-edge.fromNode.y-2*SELECTAREA*Math.sin(1.5*Math.PI-edge.angle)))/(len*len);
                    var dist = (dx*(y-edge.fromNode.y-2*SELECTAREA*Math.sin(1.5*Math.PI-edge.angle))-dy*(x-edge.fromNode.x+2*SELECTAREA*Math.cos(1.5*Math.PI-edge.angle)))/len;
                } else {
                    var perc = (dx*(x-edge.fromNode.x)+dy*(y-edge.fromNode.y))/(len*len);
                    var dist = (dx*(y-edge.fromNode.y)-dy*(x-edge.fromNode.x))/len;
                }
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
        for (var j=0; j<nodes.length; j++) {
            nodes[j].draw(ctx);
            // Draw start edge
            if (nodes[j].id == startSid) {
                edges[getFromId(startTid, edges)].draw(ctx);
            }
        }
    }
}

var canvas = document.getElementById('flat-canvas');
// var regex = document.getElementById('regex-generator');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#fcfcfc";
ctx.textAlign = "center";
ctx.font = FONTSIZE + "px Arial";
var fromX = 0;
var fromY = 0;

// ===== Regex =====
// const regular_expression = new Regex(6, ['a','b'], 0.45, 0.2, 0.1);
// console.log(regular_expression.regex);
// const nfa = regular_expression.nfa;
// console.log(nfa.table);

// == Isomorphism ==
const nfaAA = {};

nfaAA[0] = {};
nfaAA[0]['a'] = [1];
nfaAA[1] = {};
nfaAA[1]['a'] = [2];
nfaAA[2] = {};

startSid = 0;
const user = subsetConstruct(nfaAA, [2], 0);

const nfaAB = {};

nfaAB[0] = {};
nfaAB[0]['a'] = [1];
nfaAB[1] = {};
nfaAB[1]['a'] = [2];
nfaAB[2] = {};

const regex = subsetConstruct(nfaAB, [2], Object.keys(user.dfa).length);

console.log(user, regex);

console.log(isomorphic(user, regex));

// ==== Subset ====
// const nfa = {};

// nfa[0] = {};
// nfa[0][EPSILON] = [1];
// nfa[0]['a'] = [2];

// nfa[1] = {};
// nfa[1]['a'] = [0];

// nfa[2] = {};
// nfa[2]['a'] = [1];
// nfa[2]['b'] = [1,2];

// startSid = 0;
// console.log(nfa);
// console.log("start: 0");
// console.log("accept: [1]");
// console.log(subsetConstruct(nfa, [1], 0));

// way to do it without?
var state = null;

window.addEventListener("keydown",
    function(event){

        var addLabel = null;

        if (highSid != -1) {
            index = getFromId(highSid, nodes);
            addLabel = nodes[index];
        } else if (highTid != -1) {
            index = getFromId(highTid, edges);
            addLabel = edges[index];
        }

        if (addLabel != null && event.key.length == 1) {
            var length = addLabel.label.length;
            if (length > 0 && addLabel.label[length-1] == '\\' && event.key == 'e') {
                addLabel.label = addLabel.label.slice(0,-1) + EPSILON;
            } else {
                addLabel.label += event.key;
            }
        } else if (event.key == "Backspace") {
            addLabel.label = addLabel.label.slice(0,-1);
        } else if (event.key == "Delete") {
            if (highSid != -1) {
                var new_edges = [];
                for (var i=0; i<edges.length; i++) {
                    if (edges[i].fromNode == nodes[index] || edges[i].toNode == nodes[index]) {
                        if (edges[i].id == startTid) {
                            startTid = -1;
                        }
                    } else {
                        new_edges.push(edges[i]);
                    }
                }
                edges = new_edges;
                if (nodes[index].id == startSid) {
                    startSid = -1;
                }
                nodes.splice(index,1);
                highSid = -1;
            } else if (highTid != -1) {
                if (edges[index].id == startTid) {
                    startTid = -1;
                }
                for (var i=0; i<edges.length; i++) {
                    if (edges[i].fromNode == edges[index].toNode && edges[i].toNode == edges[index].fromNode) {
                        edges[i].curved = false;
                        break;
                    }
                }
                edges.splice(index,1);
                highTid = -1;
            }
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
                    var e = new Edge(tid, nodes[getFromId(highSid, nodes)], n);
                    sid++;
                    edges.push(e);
                    tid++;
                }
            } else if (event.ctrlKey) { // ctrl held
                var n = new Node(sid, x, y);
                state = n;
                nodes.push(n);
                highSid = sid;
                highTid = -1;
                startSid = sid;
                sid++;
                if (startTid == -1) {
                    var e = new Edge(tid, null, n);
                    edges.push(e);
                    startTid = tid;
                    tid++;
                } else {
                    // Set start edge to point at this node
                    for (var i=0; i<edges.length; i++) {
                        if (edges[i].id == startTid) {
                            edges[i].toNode = nodes[getFromId(highSid, nodes)];
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
                    var from = nodes[getFromId(highSid, nodes)];
                    var create = true;
                    var curve = false;
                    for (var i=0; i<edges.length; i++) {
                        if (create && edges[i].fromNode == from && edges[i].toNode == nodes[stateIndex]) { // if edge already exists
                            create = false;
                        }
                        if (!curve && edges[i].fromNode == nodes[stateIndex] && edges[i].toNode == from) { // if reversed edge exists
                            curve = true;
                            edges[i].curved = true;
                        }
                    }
                    if (create) {
                        var e = new Edge(tid, nodes[getFromId(highSid, nodes)], nodes[stateIndex]);
                        edges.push(e);
                        tid++;
                        e.curved = curve;
                    }
                }
            } else if (event.ctrlKey) { // ctrl held
                state = nodes[stateIndex];
                highSid = state.id;
                highTid = -1;
                startSid = highSid; // set highlighted state as start state

                if (startTid == -1) {
                    var e = new Edge(tid, null, state);
                    edges.push(e);
                    startTid = tid;
                    tid++;
                } else {
                    // Set start edge to point at this node
                    for (var i=0; i<edges.length; i++) {
                        if (edges[i].id == startTid) {
                            edges[i].toNode = nodes[getFromId(highSid, nodes)];
                            break;
                        }
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
        var coords = coordinates(event); // get mouse coordinates
        var x = coords.x;
        var y = coords.y;
        var stateId = nodeUnderMouse(x,y);

        // Change look of mouse if hovering over state
        if (stateId != -1) {
            canvas.style.cursor = "move";
        } else {
            canvas.style.cursor = "auto";
        }

        // Calculate change in mouse position
        var dx = x-fromX;
        var dy = y-fromY;
        fromX = x;
        fromY = y;

        if (state) { // there exists at least one state
            if (state.dragging) { // the state is being dragged
                state.x += dx;
                state.y += dy;
                updateCanvas("move"); // only update if dragging node
            }
        }
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
