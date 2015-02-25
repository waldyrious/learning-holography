var pos = { x: 0, y: 0, z: 0 };
var tau = Math.PI*2;

function draw() {
	var canvas = document.getElementById("canvas-zp");
	if (canvas.getContext) { // test for browser support of the canvas API
		// [Canvas context](http://wiki.whatwg.org/wiki/CanvasContexts) can be 2d or webgl
		var ctx = canvas.getContext('2d');
//		ctx.globalCompositeOperation = "lighter";
		var start = new Date();
		for (var zp_x = 0; zp_x < canvas.width; zp_x++) {
			for (var zp_y = 0; zp_y < canvas.height; zp_y++) {
				var intensity = Math.cos(tau*(Math.pow(zp_x - canvas.width/2, 2) + Math.pow(zp_y - canvas.height/2, 2))/(canvas.width*pos.z)); // normal cosine range, -1 to 1
				intensity = (intensity + 1) / 2; // convert to 0 to 1 range
				// Convert range 0-1 to an integer in the range 0-255
				var intRGB = Math.round(intensity * 255);
				// fillStyle uses the same color syntax as css
				ctx.fillStyle = "rgb(" + intRGB + "," + intRGB + "," + intRGB + ")";
				// paint the pixel with the calculated intensity.
				// See http://html5tutorial.com/how-to-draw-a-point-with-the-canvas-api/
				ctx.fillRect(zp_x, zp_y, 1, 1);
			}
		}
		// Measure calculation time for display
		var now = new Date();
		var elapsed = document.getElementById("duration");
		elapsed.textContent = (now - start) / 1000 + ' s';
//		var dataURL = canvas.toDataURL();
//		document.getElementById(canvas.id + '-img').src = dataURL;
	} else {
		// code for browsers that don't support canvas
	}
}

function setSourceLocation(){
	pos.x = document.getElementById("x-slider").value;
	pos.y = document.getElementById("y-slider").value;
	pos.z = document.getElementById("z-slider").value;
	draw();
}
