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

    /**
     * Convert regular expression into equivalent NFA using Thompson's construction
     * @param {String} regex A regular expression in postfix
     * @returns {
     *  Array<{
     *      table: 
     *          Array<{
     *              stateID: Number,
     *              symbol: String,
     *              stateIDs: Array<Number>
     *          }>,
     *      start: Number,
     *      end: Array<Number>
     *  }>
     * } State transition table for NFA accepting regex
     *  (alongside start state and accept states)
     */
    #regexToNfa(regex) {
        const nfa = []; // State transition table
        const s = [];   // Stack of pairs of states to next consider
        var start = 0;  // ID of start state
        var end = 1;    // ID of accept state
        var count = 0;  // Counter for state IDs
        var c1 = 0;     // ID of a state to add to NFA
        var c2 = 0;     // ID of another state to add to NFA

        // Iterate through each character in the postfix regex
        for (var i=0; i<regex.length; i++) {
            if (regex[i] == '*') { // Kleene star operator
                // Pop last pair of states from stack (sub-NFA)
                var top = s.pop();
                var r1 = top[0]; // start of sub-NFA
                var r2 = top[1]; // end of sub-NFA
                // Set IDs of two new states
                c1 = count++;
                c2 = count++;
                // Push new states onto stack
                s.push([c1, c2]);
                // Add new states to NFA
                nfa.push({});
                nfa.push({});
                if (!(nfa[r2][EPSILON])) { // initialise epsilon transitions if undefined
                    nfa[r2][EPSILON] = [];
                }
                // Loop back to start of sub-NFA or continue
                nfa[r2][EPSILON].push(r1, c2);
                // Go to start of sub-NFA or skip
                nfa[c1][EPSILON] = [r1, c2];
                // Set new start and end states if necessary
                if (start == r1) {
                    start = c1;
                }
                if (end == r2) {
                    end = c2;
                }
            } else if (regex[i] == '.') { // Concatenation operator
                // Pop last two pairs of states from stack (two sub-NFAs)
                var top1 = s.pop();
                var top2 = s.pop();
                var r11 = top1[0];
                var r12 = top1[1];
                var r21 = top2[0];
                var r22 = top2[1];
                // Push 'start' of second pair and 'end' of first pair onto stack
                s.push([r21, r12]);
                if (!(nfa[r22][EPSILON])) { // initialise epsilon transitions if undefined
                    nfa[r22][EPSILON] = [];
                }
                // Connect first sub-NFA to second with epsilon transition
                nfa[r22][EPSILON].push(r11);
                // Set new start and end states if necessary
                if (start == r11) {
                    start = r21;
                }
                if (end == r22) {
                    end = r12;
                }
            } else if (regex[i] == '+') { // Or operator
                // Set IDs of two new states and add to NFA
                c1 = count++;
                c2 = count++;
                nfa.push({});
                nfa.push({});
                // Pop last two pairs of states from stack (two sub-NFAs)
                var top1 = s.pop();
                var top2 = s.pop();
                var r11 = top1[0];
                var r12 = top1[1];
                var r21 = top2[0];
                var r22 = top2[1];
                // Push new states to stack
                s.push([c1,c2]);
                // Traverse to second sub-NFA or first sub-NFA
                nfa[c1][EPSILON] = [r21, r11];
                if (!(nfa[r12][EPSILON])) { // initialise epsilon transitions if undefined
                    nfa[r12][EPSILON] = [];
                }
                // Continue from end of first sub-NFA
                nfa[r12][EPSILON].push(c2);
                if (!(nfa[r22][EPSILON])) { // initialise epsilon transitions if undefined
                    nfa[r22][EPSILON] = [];
                }
                // Continue from end of second sub-NFA
                nfa[r22][EPSILON].push(c2);
                // Set new start and end states if necessary
                if (start == r11 || start == r21) {
                    start = c1;
                }
                if (end == r22 || end == r12) {
                    end = c2;
                }
            } else { // symbol read
                // Set IDs of two new states and add to NFA
                c1 = count++;
                c2 = count++;
                nfa.push({});
                nfa.push({});
                // Push new states onto stack
                s.push([c1,c2]);
                // Connect the first state to the second via the symbol
                nfa[c1][regex[i]] = [c2];
            }
        }

        return {
            "table" : nfa,
            "start" : start,
            "end" : end
        }
    }

    /**
     * Closes expr in the Kleene star (*) operator with probability probKleene
     * @param {Number} n Number of terms in regex
     * @param {Array<String>} sigma Alphabet of regex
     * @param {Number} probOr Probability Or (+) operator used in favour of Concatenation (.) operator
     * @param {Number} probKleene Probability Kleene star (*) used
     * @param {Number} probEmpty Probability epsilon character used
     * @returns {String} Regular expression
     */
    #kleene(n, sigma, probOr, probKleene, probEmpty) {
        // Generate expression
        var expr = this.#expression(n, sigma, probOr, probKleene, probEmpty);
        // Apply Kleene star operator with probability probKleene
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

    /**
     * Constructs a regular expression with operators and symbols included probabilistically
     * @param {Number} n Number of terms in regex
     * @param {Array<String>} sigma Alphabet of regex
     * @param {Number} probOr Probability Or (+) operator used in favour of Concatenation (.) operator
     * @param {Number} probKleene Probability Kleene star (*) used
     * @param {Number} probEmpty Probability epsilon character used 
     * @returns {String} Regular expression
     */
    #expression(n, sigma, probOr, probKleene, probEmpty) {
        // if (n == 0) {
        //     return EPSILON;
        // } else if (n == 1) {
        if (n < 2) {
            // Randomly select symbol from sigma
            var symbol = sigma[Math.floor(Math.random() * sigma.length)];
            this.postfix += symbol;
            return symbol;
        } else if (Math.random() <= probEmpty) { // use epsilon with probability probEmpty
            this.postfix += EPSILON;
            // Generate smaller sub-expression
            var after = this.#kleene(n-1, sigma, probOr, probKleene, probEmpty);
            this.postfix += "+";
            return "(" + EPSILON + " + " + after + ")";
        }

        // var beforeSize = Math.floor(Math.random() * n);
        var beforeSize = Math.floor(n/2);

        // Generate two sub-expressions
        var before = this.#kleene(beforeSize, sigma, probOr, probKleene, probEmpty);
        var after = this.#kleene(n-beforeSize, sigma, probOr, probKleene, probEmpty);

        // Apply Or operator between the two with probability probOr
        if (Math.random() <= probOr) {
            // if (before == after) {
            //     return before;
            // }
            this.postfix += "+";
            return "(" + before + " + " + after + ")";
        }

        // Apply Concatenation operator between the two with probability 1-probOr
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

    /**
     * Draws edge to canvas
     * @param {CanvasRenderingContext2D} ctx 2D rendering context for drawing surface of FSM canvas
     */
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

            var beta = Math.atan2(yi-y2,xi-x2);
            
            // dynamically draw chevron
            // drawChevron(xi, yi, this.angle, Math.PI/5);
            ctx.beginPath();
            ctx.moveTo(xi, yi);
            ctx.lineTo(xi+CHEVRON*Math.cos(beta-Math.PI/5), yi+CHEVRON*Math.sin(beta-Math.PI/5));
            ctx.lineTo(xi+CHEVRON*Math.cos(beta+Math.PI/5), yi+CHEVRON*Math.sin(beta+Math.PI/5));
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
    }

    /**
     * Draws node to canvas
     * @param {CanvasRenderingContext2D} ctx 2D rendering context for drawing surface of FSM canvas
     */
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

/**
 * Determines if DFAs given by 'user' and 'regex' accept the same language
 * @param {
 *  Array<{
 *      dfa: 
 *          Array<{
 *              stateIdFrom: Number,
 *              symbol: String,
 *              stateIdTo: Number
 *          }>,
 *      start: Number,
 *      accept: Array<Number>
 *  }>
 * } user State transition table, start state, and accept states defined for the user's DFA
 * @param {
 *  Array<{
 *      dfa: 
 *          Array<{
 *              stateIdFrom: Number,
 *              symbol: String,
 *              stateIdTo: Number
 *          }>,
 *      start: Number,
 *      accept: Array<Number>
 *  }>
 * } regex State transition table, start state, and accept states defined for the regex's DFA
 * @returns {Boolean} True iff user DFA and regex DFA accept the same language
 */
function isomorphic(user, regex) {
    const symbols = ['a', 'b'];
    // Array of all accept states (state IDs are unique across both DFAs)
    const accept  = user.accept.concat(regex.accept);
    // Each state has a set represented by a tree: 'parent' represents the root
    //  of the tree for a given state
    const parent = {};
    // Each state also has a rank denoting their height in their tree
    const rank = {};
    // Stack containing pairs of states, the first from 'user' and the second from 'regex'
    const pairStack = [];

    // Make sets for each state (represented as trees)
    for (var s of Object.keys(user.dfa)) {
        makeSet(parseInt(s), parent, rank);
    }
    for (var s of Object.keys(regex.dfa)) {
        makeSet(parseInt(s), parent, rank);
    }

    // Assume DFAs are equal to begin with
    var equal = true;

    // Calculate union of start states
    equal = unionCheck(user.start, regex.start, parent, rank, accept);

    // Push start states of both DFAs to stack
    pairStack.push([user.start, regex.start]);

    // While the stack is nonempty and condition of equivalence has not yet been violated
    while (pairStack.length > 0 && equal) {
        // Pop next pair of states
        pair = pairStack.pop();
        // For each symbol in the alphabet
        for (var c of symbols) {
            // Take transition via 'c' for each DFA and determine which set they belong to
            //  (i.e., the root of the tree they're in)
            var r1 = findSet(user.dfa[pair[0]][c], parent);
            var r2 = findSet(regex.dfa[pair[1]][c], parent);
            // If they belong to different sets
            if (r1 != r2) {
                // Take the union of the sets
                equal = unionCheck(r1, r2, parent, rank, accept);
                // Push the traversed to-states onto the stack
                pairStack.push([r1, r2]);
            }
        }
    }

    return equal;
}

/**
 * Create new tree rooted at state ID x (represents a set for x)
 * @param {Number} x State ID
 * @param {Array<Number>} parent Array of root nodes for each tree set
 * @param {Array<Number>} rank Array of rank for each node
 */
function makeSet(x, parent, rank) {
    parent[x] = x;
    rank[x] = 0;
}

/**
 * Calculates the union of sets x and y and whether the user and regex
 *  DFAs are isomorphic up to this point
 * @param {Number} x State ID
 * @param {Number} y State ID
 * @param {Array<Number>} parent Array of root nodes for each tree set
 * @param {Array<Number>} rank Array of rank for each node
 * @param {Boolean} accept Flag to see if user and regex DFAs are isomorphic
 * @returns {Boolean} True iff the union of sets x and y contain either
 *  only accepting states, or only non-accepting states
 */
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

/**
 * Sets the root node of the lower ranked state as the higher ranked state
 * @param {Number} x State ID
 * @param {Number} y State ID
 * @param {Array<Number>} parent Array of root nodes for each tree set
 * @param {Array<Number>} rank Array of rank for each node
 */
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

/**
 * Finds the root node for state x
 * @param {Number} x State ID
 * @param {Array<Number>} parent Array of root nodes for each tree set
 * @returns {Number} Root node for state x
 */
function findSet(x, parent) {
    if (x != parent[x]) {
        parent[x] = findSet(parent[x], parent);
    }
    return parent[x];
}

/**
 * Convert NFA to a DFA using subset construction
 * @param {
 *  Array<{
 *      stateID: Number,
 *      symbol: String,
 *      stateIDs: Array<Number>
 *  }>
 * } nfa State transition table
 * @param {Array<Number>} final NFA accept states
 * @param {Number} dfaId ID of initial DFA state
 * @returns {
 *  Array<{
 *      dfa: 
 *          Array<{
 *              stateIdFrom: Number,
 *              symbol: String,
 *              stateIdTo: Number
 *          }>,
 *      start: Number,
 *      accept: Array<Number>
 *  }>
 * } State transition table, start state, and accept states defined for the resulting DFA
 */
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
        start : start,
        accept : accept
    }
}

/**
 * Calculates subset of states reached by reading 'symbol' from each state
 *  in 'states' then applying E-CLOSE to it
 * @param {Array<Number>} states Subset of states in NFA
 * @param {String} symbol State transition symbol
 * @param {Array<{stateID: Array<Number>}>} nodeClosure Closure set for each state in NFA
 * @param {
 *  Array<{
 *      stateID: Number,
 *      symbol: String,
 *      stateIDs: Array<Number>
 *  }>
 * } nfa State transition table
 * @returns {Array<Number>} Subset of NFA states that constitute a state in the DFA
 */
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

/**
 * Calculates E-CLOSE of 'states'
 * @param {Array<Number>} states Subset of states in NFA
 * @param {Array<{stateID: Array<Number>}>} nodeClosure Closure set for each state in NFA
 * @param {
 *  Array<{
 *      stateID: Number,
 *      symbol: String,
 *      stateIDs: Array<Number>
 *  }>
 * } nfa State transition table
 * @returns {Array<Number>} Subset of states as a result of applying E-CLOSE to 'states'
 */
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

/**
 * Calculates E-CLOSE for a specific state k
 * @param {Number} k State ID
 * @param {Array<{stateID: Array<Number>}>} nodeClosure Closure set for each state in NFA 
 * @param {Set<Number>} nClosed E-CLOSE set
 * @param {
 *  Array<{
 *      stateID: Number,
 *      symbol: String,
 *      stateIDs: Array<Number>
 *  }>
 * } nfa State transition table
 * @returns {IterableIterator<Number>} States reached through E-CLOSE(k)
 */
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

/**
 * Extract symbols from transition label
 * @param {String} label Label of transition
 * @returns {IterableIterator<String>} Symbols extracted from 'label'
 */
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

/**
 * Create state transition table and accept states from
 *  user defined NFA
 * @returns {
 *  Array<{
 *      table: 
 *          Array<{
 *              stateID: Number,
 *              symbol: String,
 *              stateIDs: Array<Number>
 *          }>,
 *      accept: Array<Number>
 *  }>
 * } State transition table and accept states
 */
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

/**
 * Draw arrow (chevron) at the end of an edge
 * @param {Number} x x-coordinate for end of edge
 * @param {Number} y y-coordinate for end of edge
 * @param {Number} angleEdge Angle (radians) between positive x-axis and edge
 * @param {Number} angleHead Angle (radians) between edge and chevron
 */
function drawChevron(x, y, angleEdge, angleHead) {

    // ctx.beginPath();
    // ctx.moveTo(xi, yi);
    // ctx.lineTo(xi+CHEVRON*Math.cos(this.angle-Math.PI/5), yi+CHEVRON*Math.sin(this.angle-Math.PI/5));
    // ctx.lineTo(xi+CHEVRON*Math.cos(this.angle+Math.PI/5), yi+CHEVRON*Math.sin(this.angle+Math.PI/5));
    // ctx.closePath();
    // ctx.stroke();
    // ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x-CHEVRON*Math.cos(angleEdge - angleHead), y-CHEVRON*Math.sin(angleEdge - angleHead));
    ctx.lineTo(x-CHEVRON*Math.cos(angleEdge + angleHead), y-CHEVRON*Math.sin(angleEdge + angleHead));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

/**
 * Construct a circle given three points
 * @param {Number} x1 x-coordinate of point 1
 * @param {Number} y1 y-coordinate of point 1
 * @param {Number} x2 x-coordinate of point 2
 * @param {Number} y2 y-coordinate of point 2
 * @param {Number} x3 x-coordinate of point 3
 * @param {Number} y3 y-coordinate of point 3
 * @returns {
 *  Array<{
 *      x: Number,
 *      y: Number,
 *      radius: Number
 *  }>
 * } Coordinates for centre of circle and the circle's radius
 */
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

/**
 * Return index from state/edge array given a state/edge ID respectively
 * @param {Number} id State/Edge ID
 * @param {Number} arr State/Edge array
 * @returns {Number} Index of state/edge
 */
function getFromId(id, arr) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i].id == id) {
            return i;
        }
    }
}

/**
 * Return index of edge at the cursor's position
 *  (or -1 if cursor isn't hovering over any edge)
 * @param {Number} x x-position of cursor
 * @param {Number} y y-position of cursor
 * @returns {Number} Index of edge, or -1 if no edge present
 */
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

/**
 * Return index of node at the cursor's position
 *  (or -1 if cursor isn't hovering over any node)
 * @param {Number} x x-position of cursor
 * @param {Number} y y-position of cursor
 * @returns {Number} Index of node, or -1 if no node present
 */
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

/**
 * Calculate offset of mouse coordinates from the position of the canvas
 * @param {MouseEvent} event Event when mouse interacts with HTML document
 * @returns {
 *  Array<{
 *      x: Number,
 *      y: Number
 *  }>
 * } Coordinates of mouse with respect to canvas position
 */
function coordinates(event) {
    var dimensions = canvas.getBoundingClientRect();
    // Account for canvas offset by subtracting its top most- and left most-position in window
    return {
        x: event.clientX-dimensions.left,
        y: event.clientY-dimensions.top
    }
}

/**
 * Draws edges and nodes to the canvas
 * @param {Boolean} mouseDown Indicates if the mouse is pressed down
 */
function updateCanvas(mouseDown) {
    // Only update canvas if user is dragging state, pressing key, or clicking mouse
    if (state && (state.dragging || mouseDown)) {
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

// const regular_expression = new Regex(6, ['a','b'], 0.45, 0.2, 0.1);
// console.log(regular_expression.regex);
// const nfa = regular_expression.nfa;
// console.log(nfa.table);

// const nfaAA = {};

// nfaAA[0] = {};
// nfaAA[0]['a'] = [1];
// nfaAA[1] = {};
// nfaAA[1]['a'] = [2];
// nfaAA[2] = {};

// startSid = 0;
// const user = subsetConstruct(nfaAA, [2], 0);

// const nfaAB = {};

// nfaAB[0] = {};
// nfaAB[0]['a'] = [1];
// nfaAB[1] = {};
// nfaAB[1]['b'] = [2];
// nfaAB[2] = {};

// const regex = subsetConstruct(nfaAB, [2], Object.keys(user.dfa).length);

// // console.log(user);
// // console.log(regex);

// console.log(isomorphic(user, regex));

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

        updateCanvas(true);
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
        updateCanvas(true);
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
        updateCanvas(true);
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
                updateCanvas(false); // only update if dragging node
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
