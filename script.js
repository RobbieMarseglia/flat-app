document.getElementById("flat-canvas").addEventListener("click", drawCircle);
let RADIUS = 40;

function drawCircle(event) {
    var c = document.getElementById("flat-canvas");
    var ctx = c.getContext("2d");

    var centre_x = event.clientX - c.offsetLeft;
    var centre_y = event.clientY - c.offsetTop;

    var canv_width = ctx.canvas.clientWidth;
    var canv_height = ctx.canvas.clientHeight;

    // Only draw circle if completely within canvas
    if ((centre_y+RADIUS < canv_height-5) && (centre_y-RADIUS > 5) && (centre_x+RADIUS < canv_width-5) && (centre_x-RADIUS > 5)){
        ctx.beginPath();
        ctx.arc(centre_x, centre_y, RADIUS, 0, 2 * Math.PI);
        ctx.stroke();
    }
}