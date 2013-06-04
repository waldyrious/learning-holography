// coordinates of the points that make up the object.
// 0,0 is considered to be the center of the hologram plane.
// Units used for specifying the object points are centimeters,
// which are more intuitive for real-world objects.
var cm = 0.01; // 1 cm = 0.01 m
var obj = [
	{ x: 0.00*cm, y: 0.00*cm, z:-50*cm },
	{ x: 0.04*cm, y: 0.00*cm, z:-50*cm },
	{ x:-0.08*cm, y:-0.04*cm, z:-49*cm }
];
// wavelength of the (laser) light: 630nm
lambda = 630e-9;
// wavenumber: spatial angular frequency (radians per meter)
k = (2*Math.PI)/lambda;
// z-depth of the hologram plane (assuming it's parallel to the XY plane)
var holo_z = 0;
// All browsers currently assume 96 DPI as the screen resolution.	 	
// See http://www.quirksmode.org/blog/archives/2012/07/more_about_devi.html
// Once real pixel size can be obtained, we can generate a real-size hologram
// but for now 96dpi is a good approximation
// 96 px = 1 in = 25.4 mm  -->  1 px = 0.26458(3) mm = 264.583 µm
//pixelSize = { "hologram": 264.583e-6, "hologram-zoomed": 20e-6 };
function draw(canvas, pixelSize, nextPixelSize){
	//console.log("now drawing " + canvas.id);
	//var canvas = document.getElementById(canvasID);
	if (canvas.getContext) { // test for browser support of the canvas API
		//can be 2d or webgl: http://wiki.whatwg.org/wiki/CanvasContexts
		var ctx = canvas.getContext('2d');
		// the lighter compositing mode allows overlapping values
		// to be summed rather than multiplied. This allows controlling
		// the dynamic range of the image (max intensity = locations
		// where all point object waves interfere constructively)
		ctx.globalCompositeOperation = "lighter";
		var start = new Date();
		hologramCenterX = canvas.width * pixelSize / 2;
		hologramCenterY = canvas.height * pixelSize / 2;
		for(pt=0; pt<obj.length; pt++) {
			// depth difference between hologram plane and object point
			var distZ = holo_z - obj[pt].z;
			for ( holo_x=0; holo_x<canvas.width; holo_x++ ) {
				// calculate physical horizontal coordinates of current hologram pixel
				// holo_x actually corresponds to the top-left corner of the pixel;
				// since the pixel has 1x1 size, we add 0.5 to make the distance calculation
				// take into account the actual center of the pixel
				var hpx = (holo_x+0.5)*pixelSize;
				// calculate physical horizontal coordinates of current object point
				// half the width of the hologram's dimensions is added to center the point horizontally
				var opx = hologramCenterX + obj[pt].x;
				// horizontal distance between current hologram pixel and current object point
				var distX = hpx - opx;
				for ( holo_y=0; holo_y<canvas.height; holo_y++ ) { // Note: the e^x code is Math.exp(x);
					// calculate physical vertical coordinates of current hologram pixel
					var hpy = (holo_y+0.5)*pixelSize;
					// calculate physical vertical coordinates of current object point
					var opy = hologramCenterY - obj[pt].y;
					// vertical distance between current hologram pixel and current object point
					var distY = hpy - opy;
					// Euclidean distance formula
					radius = Math.sqrt( Math.pow(distX, 2) +  Math.pow(distY, 2) +  Math.pow(distZ, 2) );
					// divide by number of points to allow dynamic range in final image
					//intensity = Math.abs(Math.cos(radius*k))/obj.length;
					intensity = (Math.cos(radius*k)+1)/(2*obj.length);
					intRGB = Math.round(intensity*255);
					// fillStyle uses the same color syntax as css
					ctx.fillStyle = "rgb("+ intRGB +","+ intRGB +","+ intRGB +")";
					// see http://html5tutorial.com/how-to-draw-a-point-with-the-canvas-api/
					ctx.fillRect (holo_x, holo_y, 1, 1);
				}
			}
		}
		var now = new Date();
		var elapsed = document.getElementById("time-" + canvas.id);
		elapsed.textContent = (now - start)/1000 + ' s'
		if (nextPixelSize){
			zoomedSize = canvas.width * nextPixelSize / pixelSize;
			console.log(zoomedSize);
			ctx.strokeStyle = "red";
			ctx.strokeRect (
				canvas.width/2-zoomedSize/2, canvas.height/2-zoomedSize/2,
				zoomedSize, zoomedSize
			);
		}
		var dataURL = canvas.toDataURL();
		document.getElementById(canvas.id+'-img').src = dataURL;
	}
	else {
		// code for browsers that don't support canvas
	}
}

function run(){
	// pixel pitch of the holograms
	var resolutions = [
		264.58e-6+(1e-8)/3,
		//150e-6,
		100e-6,
		70e-6,
		20e-6
	];
	for (r=0; r<resolutions.length; r++) {
		// generate resolution values in alternative units
		res_um = Math.round(resolutions[r]*1e6);
		dpi = Math.round(25400/res_um);
		size_cm = Math.round(200*res_um*1e-3)/10;
		// create elements and add to DOM
		var div = document.createElement('div');
		var cnv = document.createElement('canvas');
		cnv.setAttribute('id', 'hologram-' + res_um );
		cnv.setAttribute('width', 200);
		cnv.setAttribute('height', 200);
		div.appendChild(cnv);
		var img = document.createElement('img');
		img.setAttribute('id', cnv.id+'-img');
		div.appendChild(img);
		var par = document.createElement('p');
		par.innerHTML = 'resolution: <span class="right">'+ dpi +' dpi</span><br>'
			+ 'hologram pixel size: <span class="right">'+ res_um +' µm</span><br>'
			+ 'hologram size: <span class="right">'+ size_cm +' cm</span><br>'
			+ 'processing time: <span class="right" id="time-'+ cnv.id +'"></span><br>';
		div.appendChild(par);
		document.getElementsByTagName("body")[0].appendChild(div);
		//draw hologram
		box = resolutions[r+1] || 0;
		draw(cnv, resolutions[r], box);
	}
}
