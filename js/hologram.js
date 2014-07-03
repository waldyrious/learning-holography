//TODO: implement intensity fade out and see what it means for aliasing

// coordinates of the points that make up the object.
// 0,0 is considered to be the center of the hologram plane.
// Units used for specifying the object points are centimeters,
// which are more intuitive for real-world objects.
var cm = 0.01; // 1 cm = 0.01 m
var obj = [
	{ x: 0.00*cm, y: 0.00*cm, z:-50*cm },
	{ x: 0.04*cm, y: 0.00*cm, z:-50*cm },
	{ x:-0.08*cm, y:-0.04*cm, z:-48*cm } 
];
// wavelength of the (laser) light: 630nm
// 
//   - [[laser]]: red (635 nm), green (532 nm), blue-violet (445 nm)
//   - visible spectrum colors by wavelength:  
// <pre>700  –  635   –    590   –    560   –   490  –   450   –    400
//      |  red  |  orange  |  yellow  |  green  |  blue  |  purple  |</pre>
//   - [wavelengths of commercially available lasers](http://upload.wikimedia.org/wikipedia/commons/4/48/Commercial_laser_lines.svg)
//   - 632.816 nm = wavelength of a typical red Neon-Helium (NeHe) laser in air.
var lambda = 633e-9;

// wavenumber: spatial angular frequency (radians per meter)
// this represents the number of cycles the wave completes per unit distance
var k = (2 * Math.PI) / lambda;
// Angle of the planar reference wave relative to positive z axis
var ref_angle = {x: 0.1, y: 0};
// x/y components of the ref. wave's direction (normal) vector.
var ref_x = Math.sin(ref_angle.x * Math.PI/180);
var ref_y = Math.sin(ref_angle.y * Math.PI/180);
var ref_z = Math.sqrt(1 - ref_x*ref_x - ref_y*ref_y); // z is the remaining to make a 1-long vector
// z-depth of the hologram plane (assuming it's parallel to the XY plane)
var holo_z = 0;

// aliasing artifacts:
// 
// - [Aliasing Artifacts and Accidental Algorithmic Art](http://www.cgl.uwaterloo.ca/~csk/papers/kaplan_bridges2005a.pdf)
// - [On the bathtub algorithm for dot-matrix holograms](http://bit-player.org/wp-content/extras/bph-publications/CompLang-1986-10-Hayes-holograms.pdf)
// - Aliasing and over-modulation — Holographic Imaging, p.215

function draw(canvas, pixelSize, nextPixelSize) {
	//console.log("now drawing " + canvas.id);
	//var canvas = document.getElementById(canvasID);
	if (canvas.getContext) { // test for browser support of the canvas API
		// [Canvas context](http://wiki.whatwg.org/wiki/CanvasContexts) can be 2d or webgl
		var ctx = canvas.getContext('2d');
		// To implement the interference phenomenon, we have to sum the waves together.
		// We'll be repainting the canvas, one wave at a time,
		// but by default, writing over the same pixel in canvas
		// completely replaces what was there before.
		// So we need to use the canvas compositing mode "lighter",
		// which implements the [additive color model](https://en.wikipedia.org/wiki/Additive_color).
		// With "lighter", RGB values are summed, saturating at 255; for example:
		// (100,100,100) + (0,100,200) = (100,200,255).
		// See http://jsfiddle.net/esfmM/, http://jsfiddle.net/HKv9G/
		ctx.globalCompositeOperation = "lighter";
		var start = new Date();
		var hologramCenterX = canvas.width * pixelSize / 2;
		var hologramCenterY = canvas.height * pixelSize / 2;
		var maxFreq = lambda/(2*pixelSize);
		for (var holo_x = 0; holo_x < canvas.width; holo_x++) {
			// calculate physical horizontal coordinate of current hologram pixel
			// holo_x actually corresponds to the top-left corner of the pixel;
			// since the pixel has 1x1 size, we add 0.5 to make the distance calculation
			// take into account the actual center of the pixel
			var hpx = (holo_x + 0.5) * pixelSize;
			for (var holo_y = 0; holo_y < canvas.height; holo_y++) { // Note: the e^x code is Math.exp(x);
				// Calculate physical vertical coordinate of current hologram pixel
				var hpy = (holo_y + 0.5) * pixelSize;
				// Calculate value of the planar reference wavefront
				// at the current point of the hologram.
				// * To understand how the formula works, imagine that the wave was
				//   propagating entirely in the x direction. This would mean that we
				//   could simply take a location in x and get the number of cycles
				//   that the wave completed until there (starting at the origin)
				//   by multiplying this distance by k (which, recall, is the
				//   spatial angular frequency of the wave, i.e. "radians per meter").
				// * But of course, the wave does not actually propagate
				//   entirely in the x direction (we made sure of that when defining 
				//   its normal vector through ref_x and ref_y above).
				//   Instead, for every wavelength it propagates in the direction
				//   of its normal, it will only move in x by a small fraction of
				//   that distance (i.e., ref_x).
				//   So we scale the x position by ref_x first, and only then
				//   convert the result to a phase angle by multiplying it by k.
				//   We also add the y displacement, in case the wave also moves
				//   in y (in this case it doesn't).
				// * Since the center of the coordinate sytem (x=0, y=0) corresponds
				//   to the top left corner of the hologram, we add the hologramCenter
				//   variables to make the origin of this phenomenon (ref_phase = 0)
				//   happen at the center of the hologram. (maybe we should center stuff
				//   so they're correctly placed around the origin, and instead tweak the display)
				// * There's an alternative explanation, leading to the same result,
				//   in http://waldir.github.io/learning-holography/pb-cgh-formulas.xhtml
				var ref_proj = (ref_x * (hpx + hologramCenterX) + ref_y * (hpy + hologramCenterY));
				var sinThetaRefX = ref_x/Math.sqrt(ref_x*ref_x + ref_z*ref_z);
				var sinThetaRefY = ref_y/Math.sqrt(ref_y*ref_y + ref_z*ref_z);
				for (var pt = 0; pt < obj.length; pt++) {
					// Calculate physical horizontal coordinate of current object point
					// half the width of the hologram's dimensions is added to center the point horizontally
					var opx = hologramCenterX + obj[pt].x;
					// Calculate physical vertical coordinate of current object point
					var opy = hologramCenterY - obj[pt].y;
					// horizontal distance between current hologram pixel and current object point
					var distX = hpx - opx;
					// vertical distance between current hologram pixel and current object point
					var distY = hpy - opy;
					// depth difference between hologram plane and object point
					var distZ = holo_z - obj[pt].z;
					// Use the Euclidean formula to calculate the distance between point and hologram pixel
					var obj_dist = Math.sqrt( Math.pow(distX, 2) + Math.pow(distY, 2) + Math.pow(distZ, 2) );
					// Test for aliasing
					var sinThetaObjX = distX/Math.sqrt(distX*distX + distZ*distZ);
					var sinThetaObjY = distY/Math.sqrt(distY*distY + distZ*distZ);
					if ( Math.abs(sinThetaObjX - sinThetaRefX) <= maxFreq && Math.abs(sinThetaObjY - sinThetaRefY) <= maxFreq) {
						// How to include amplitude attenuation? should be A/r,
						// but that means the amplitude when r=0 would be infinite, and it should be A.
						// Using Math.exp(-obj_dist) should work, but what would be the appropriate scaling factor?
						var intensity = Math.cos(k*(obj_dist - ref_proj)); // normal cosine range, -1 to 1
						intensity = (intensity + 1) / 2; // convert to 0 to 1 range
						// We can't normalize the range of the final result after the loop is done,
						// because the canvas would be saturated (overexposed) by then.
						// Therefore we divide each wave by the number of waves,
						// so that the final result ends up normalized within the allowed range.
						intensity /= obj.length; 
						// Convert range 0-1 to an integer in the range 0-255
						var intRGB = Math.round(intensity * 255);
						// fillStyle uses the same color syntax as css
						ctx.fillStyle = "rgb(" + intRGB + "," + intRGB + "," + intRGB + ")";
					}
					else {
						ctx.fillStyle = "black";
					}
					// paint the pixel with the calculated intensity.
					// See http://html5tutorial.com/how-to-draw-a-point-with-the-canvas-api/
					ctx.fillRect(holo_x, holo_y, 1, 1);
				}
			}
		}
		// Measure calculation time for display
		var now = new Date();
		var elapsed = document.getElementById("time-" + canvas.id);
		elapsed.textContent = (now - start) / 1000 + ' s';
		// Draw square depicting area covered by the next resolution level
		// FIXME: this doesn't seem to be working correctly. The area of the
		//        next hologram area indeed appears to be correct,
		//        but the contents of that area don't match what is actually seen
		//        when that hologram is rendered.
		if (nextPixelSize) {
			var zoomedWidth = canvas.width * nextPixelSize / pixelSize;
			var zoomedHeight = canvas.height * nextPixelSize / pixelSize;
			ctx.strokeStyle = "white";
			ctx.strokeRect(
				canvas.width/2 - zoomedWidth/2, canvas.height/2 - zoomedHeight/2,
				zoomedWidth, zoomedHeight
			);
		}
		var dataURL = canvas.toDataURL();
		document.getElementById(canvas.id + '-img').src = dataURL;
	} else {
		// code for browsers that don't support canvas
	}
}

function run() {
	// Pixel pitch of the holograms.
	// Note: All browsers currently assume 96 DPI as the screen resolution.  
	// See [Physical units on the web](https://docs.google.com/document/d/1CTMaSmFpCjhw90wNR_hl_uL2nKD2QPtPaBgnrT1X8I0/edit).  
	// Once real pixel size can be obtained, we can generate a real-size hologram
	// but for now 96dpi is a good approximation
	// 96 px = 1 in = 25.4 mm  -->  1 px = 0.26458(3) mm = 264.583 µm
	var resolutions = [
		264.58e-6 + (1e-8)/3, // 1px = .00026458(3) m = .26458(3) mm
		80e-6,
		40e-6,
		20e-6
	];
	for (var r = 0; r < resolutions.length; r++) {
		// generate resolution values in alternative units
		var res_um = Math.round(resolutions[r] * 1e6);
		var dpi = Math.round(25400 / res_um);
		var width = 200;
		var size_cm = Math.round(width * res_um * 1e-3) / 10;
		// create elements and add to DOM
		var div = document.createElement('div');
		var cnv = document.createElement('canvas');
		cnv.setAttribute('id', 'hologram-' + res_um);
		cnv.setAttribute('width', width);
		cnv.setAttribute('height', 200);
		div.appendChild(cnv);
		var img = document.createElement('img');
		img.setAttribute('id', cnv.id + '-img');
		div.appendChild(img);
		var par = document.createElement('p');
		par.innerHTML = 'resolution: <span class="right">' + dpi + ' dpi</span><br />'
			+ 'hologram pixel size: <span class="right">' + res_um + ' µm</span><br />'
			+ 'hologram width: <span class="right">' + size_cm + ' cm</span><br />'
			+ 'processing time: <span class="right" id="time-' + cnv.id + '"></span><br />';
		div.appendChild(par);
		document.getElementsByTagName("body")[0].appendChild(div);
		//draw hologram
		var nextRes = resolutions[r + 1] || 0;
		draw(cnv, resolutions[r], nextRes);
	}
}
