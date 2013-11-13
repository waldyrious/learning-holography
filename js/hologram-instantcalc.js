"use strict"

/*============================================================================*/
/*                 INITIALIZE VARIABLES AND SETUP CANVASES                    */
/*============================================================================*/

// Get canvas-related values needed for their manipulation
var diagramCanvas = document.getElementById("diagram"),
    diagram = diagramCanvas.getContext('2d'),
    hologramCanvas = document.getElementById("hologram"),
    hologram = hologramCanvas.getContext('2d'),
    curvesCanvas = document.getElementById("curves"),
    curves = curvesCanvas.getContext('2d'),
    dw = diagramCanvas.width,  dh = diagramCanvas.height,
    diagramRadius = distanceToOrigin(dw, dh) / 2,
    hw = hologramCanvas.width, hh = hologramCanvas.height,
    cw = curvesCanvas.width,   ch = curvesCanvas.height,
    arrowBoxSize = Math.round(dw < dh? dw/5 : dh/5);
// Define shortcuts to make code more readable and less repetitive
var tau = Math.PI*2,
    deg2rad = tau/360;
// Define properties that affect the hologram itself
var wavLen = 50,
    refAngle = 0,
    points = [
    	{ x:-dw/3, y: -dh/2, phase: 0 },
    	{ x: dw/3, y: -3*dh/4, phase: 0 }
    ],
    horizCycleLength;
// Variables to control the appearance and behavior of the visualization
var displayCurves = false;
// Auxiliary variables
var numWaves = points.length + 1; // one wave per point source, plus the reference wave

// Center coordinate origin horizontally for both canvases
diagram.translate(dw/2, 0);
hologram.translate(dw/2, hh);
curves.translate(cw/2, ch);
// Make the y axis grow upwards
diagram.scale(1,-1);
hologram.scale(1,-1);
curves.scale(1,-1);

/*============================================================================*/
/*                         MASTER UPDATE FUNCTION                             */
/*============================================================================*/

// Update all canvases with content based on the new values of the various parameters
function refresh() {
	// Reset canvases and hologram values
	diagram.clearRect(-dw/2, 0, dw, -dh);
	hologram.clearRect(-hw/2, 0, hw, hh);
	curves.clearRect(-cw/2, 0, cw, ch);
	// Check whether to display individual intensity curves for each wave.
	// This affects both the diagram and curves canvases.
	// Note: the curves canvas is filled in paintHologram().
	displayCurves = document.getElementById("show-curves").checked;
	// Update the diagram canvas with the updated content
	drawPlanarWave();
	drawCircularWaves();
	drawPlanarWaveDirectionBox();
	// Update the hologram and the curves canvases.
	paintHologram();
}

/*============================================================================*/
/*          FUNCTIONS TO DRAW THE VARIOUS ELEMENTS                         */
/*============================================================================*/

// Draw the planar (reference) wave's wavefronts in the diagram canvas
function drawPlanarWave() {

	diagram.save();

	// If user chooses to show the intensity profiles
	// (which implies color-coding the curves and the waves to match them)
	// paint as red, using the HSL format to match the code for the other waves
	// Otherwise paint as "silver" (light grey)
	diagram.strokeStyle = displayCurves ? "hsl(0, 100%, 80%)" : "Silver";

	// the angle is inverted to make it more intuitive to manipulate
	diagram.rotate(-refAngle*deg2rad);

	diagram.beginPath();

	// Draw a set of horizontal lines (which, in a rotated coordinate system,
	// end up becoming rotated parallel lines)
	for (var i=0; i<diagramRadius*2; i+=wavLen) {
		// Draw horizontal lines upwards from the center of the coordinate system
		diagram.moveTo(-diagramRadius*2, i+wavLen);
		diagram.lineTo( diagramRadius*2, i+wavLen);
		// Don't draw the central line twice
		if (i == 0) { continue; }
		// Draw horizontal lines downwards from the center of the coordinate system
		diagram.moveTo(-diagramRadius*2,-i+wavLen);
		diagram.lineTo( diagramRadius*2,-i+wavLen);
	}

	diagram.stroke();

	diagram.restore();
}

// Draw a small box in the corner of the diagram canvas,
// containing an arrow showing the propagation direction of the reference wave
function drawPlanarWaveDirectionBox() {
	
	diagram.save();

	diagram.fillStyle   = "White";
	diagram.strokeStyle = "Black";
	diagram.fillRect(  -dw/2-1, -dh-1, arrowBoxSize, arrowBoxSize);
	diagram.strokeRect(-dw/2-1, -dh-1, arrowBoxSize, arrowBoxSize);

	// center the coordinate system in the box
	diagram.translate(-dw/2 + arrowBoxSize/2, -dh + arrowBoxSize/2);
	// rotate the coordinate system
	diagram.rotate(-refAngle*deg2rad);

	// Draw a vertical arrow
	if (displayCurves) { diagram.strokeStyle = "hsl(0, 100%, 80%)"; }
	diagram.beginPath();
	diagram.moveTo( 0,-arrowBoxSize/3);
	diagram.lineTo( 0, arrowBoxSize/3);
	diagram.lineTo(-3, arrowBoxSize/3 - 7);
	diagram.moveTo( 0, arrowBoxSize/3);
	diagram.lineTo( 3, arrowBoxSize/3 - 7);
	diagram.stroke();

	diagram.restore();
}

// Draw the object points
// and their corresponding circular waves' wavefronts
// in the diagram canvas
function drawCircularWaves() {

	diagram.save();

	for (var pt = 0; pt < points.length; pt++) {
		var x = points[pt].x,
		    y = points[pt].y;
		// Assuming phase of incoming planar wave (incident light) is zero at (0,0),
		// calculate the distance of each point to (0,0), along the propagation direction
		// since the propagation direction is "up" (in the rotated reference frame of the planar wave),
		// we can rotate the points by the same angle in the reverse direction.
		// The new y coordinate of the rotated point is the distance
		// along the rotated Y axis of the plane wave reference system.
		// For this, we use the rotation formula y' = x*sin(θ) + y*cos(θ).
		// Note that the angle isn't inverted because the other transformation
		// already uses the inverted angle.
		var dist = x*Math.sin(refAngle*deg2rad) + y*Math.cos(refAngle*deg2rad);
		// Of course, if we *don't* assume the planar (reference) wave's phase
		// is zero at (0,0), the distance to the zero phase will have to take into
		// account the phase of the reference wave at (0,0).
		// TODO: perhaps the diagrams I made to reason about this will help
		// explain this better.
		dist -= wavLen;
		// Now get the phase. Normally this would be simply dist % wavLen,
		// but the % operator essentially "caps" the dist / wavLen line
		// (which is the pure 45º line of dist, scaled down by 1/wavLen)
		// to the -wavLen --> +wavLen range. This means the left side of the graph
		// is below the x axis, capped at -wavLen, and the right side is above,
		// capped at +wavLen. We want to do the following:
		/*
			           ^                               ^
			           |                               |
			           | /| /| /|               /| /| /| /| /| /|
			___________|/_|/_|/_|_   ---->    _/_|/_|/_|/_|/_|/_|_
			 /| /| /| /|                               |
			/ |/ |/ |/ |                               |
			           |                               |
		*/
		// to convert from the left image to the right one,
		// we first add wavLen, to put the whole graph above 0,
		// and then we use % again to bring the wavLen --> 2*wavLen part
		// (in the right-hand side) down to the 0 --> wavLen range.
		// Finally, we subtract that from wavLen, to get the growing with the
		// planar wave's propagation direction (+Y')
		points[pt].phase = wavLen - ( wavLen + dist % wavLen ) % wavLen;

		// Spread the colors around the hue circle according to the number of
		// points we have. The ref. wave keeps the 0º (red)
		if (displayCurves) {
			diagram.fillStyle = "hsl(" + 360*((pt+1)/numWaves) + ", 100%, 50%)";
			diagram.strokeStyle = "hsl(" + 360*((pt+1)/numWaves) + ", 100%, 50%)";
		}

		// Draw the point itself
		diagram.beginPath();
		diagram.arc(x, y, 5, 0, tau, false);
		diagram.fill();

		// Draw the circular waves emanating from it:
		// 1. Calculate the max radius we would need to draw
		//    so we don't attempt to draw outside the canvas
		var maxRad = Math.sqrt( Math.pow(dw/2+Math.abs(x),      2) +
		                        Math.pow(dh/2+Math.abs(y+dh/2), 2));
		// 2. Loop through each radius level
		//    and draw the wavefronts for the current point
		for (var rad=0; rad<maxRad; rad+=wavLen) {
			diagram.beginPath();
			diagram.arc(x, y, rad + points[pt].phase, 0, tau, false);
			diagram.stroke();
		}
	}
	diagram.restore();
}

// Calculate the intensity values for each wave (including the reference wave),
// obtain the interference (sum) values for each hologram pixel
// and paint them
function paintHologram() {
	// Scan each pixel-wide column of the hologram
	for (var holo_x = -hw/2; holo_x < hw/2; holo_x++) {
		// Create array to hold individual wave values
		// so we can graph them individually if desired
		var perWaveIntensity = [],
		    totalIntensity = 0;

		// Calculate the intensity of the reference wave.
		//   We know — because we define it that way in drawPlanarWave() —
		//   that the the reference wave has zero phase at x=0
		//   (since we draw a horizontal line at y=0 and the others growing
		//   from there, while the coordinate system is rotated around (0,0))
		//   See (handmade for now) diagram for explanation of the derivation
		//   of the formula below. TODO: describe it textually as well.
		totalIntensity = Math.cos( tau * ( holo_x / horizCycleLength ) );
		// Draw the intensity profile curve for the reference wave
		if (displayCurves) {
			drawIntensityCurve(points.length, holo_x, totalIntensity);
		}

		// Calculate the intensity of the current point's object wave
		for (var pt = 0; pt < points.length; pt++) {
			var radius = distanceToOrigin(holo_x-points[pt].x, points[pt].y);
			perWaveIntensity[pt] = Math.cos((radius - points[pt].phase) * tau/wavLen);
			totalIntensity += perWaveIntensity[pt];
			// Draw the intensity profile curve for the current wave
			if (displayCurves) {
				// Normalize intensity values from cosine's [-1;1] range to [0;1]
				drawIntensityCurve(pt, holo_x, perWaveIntensity[pt] );
			}
		}

		// Divide by number of points (plus ref wave)
		// to allow summing intensity contributions of all waves
		// and still have the final intensity values range from 0 to 1
		// Also, take the absolute value, since what we care about is
		// whether there is wave activity at this point, and by how much
		var normalizedIntensity = Math.abs(totalIntensity/numWaves);

		// Paint the calculated intensity into the current (instantaneous) hologram pixel
		hologram.fillStyle = unitFractionToHexColor(normalizedIntensity);
		hologram.fillRect(holo_x, 0, 1, hh/2);

		// Calculate values for cumulative (final) hologram
//		...
		// Paint the calculated intensity into the current (cumulative) hologram pixel
//		hologram.fillStyle = unitFractionToHexColor(normalizedIntensity);
		hologram.fillRect(holo_x, hh/2, 1, hh);

		// Draw cumulative version of main intensity curve
		// Two versions are drawn to account for its axial symmetry
		drawIntensityCurve(-2, holo_x, normalizedIntensity, "#ccc");
		drawIntensityCurve(-2, holo_x,-normalizedIntensity, "#ccc");
		// Draw instantaneous version of main intensity curve
		drawIntensityCurve(-1, holo_x, totalIntensity/numWaves, "gray");
	}
}

// Draw a point (or rectangle) in the "curves" canvas,
// corresponding to a given wave's intensity at that point.
// As the hologram is scanned by the hologram drawing code,
// this gets called for each hologram pixel,
// and the points end up forming a intensity curve,
// while the rectangles form an area (i.e a filled curve).
function drawIntensityCurve(waveIndex, xCoord, intensity, color) {
	if( waveIndex < 0 ) {
		// Draw a filled area for the combined intensity curve and the cumulative one.
		// The values are divided by two to convert the range from [-1;1] to [-0.5;0.5]
		// This allows them to stem from the middle of the canvas up or downwards
		// without overflowing. The inversion is to match the one in the else clause.
		intensity = -intensity/2;
		curves.fillStyle = color || "black";
		curves.fillRect(xCoord, ch/2, 1, ch*intensity);
	} else {
		// Spread the colors around the hue circle according to the number of
		// points we have. The reference wave keeps the 360º (red)
		curves.fillStyle = "hsl(" + 360*((waveIndex+1)/numWaves) + ", 100%, 50%)";
		// Normalize intensity values from cosine's [-1;1] range to [0;1]
		// Also invert it for display, to make the crests of the curves canvas
		// visually touch the crests as seen from top-down in the diagram canvas
		intensity = 1-(intensity+1)/2;
		curves.beginPath();
		curves.arc(xCoord, ch*intensity, 0.75, 0, tau, true);
		curves.fill();
	}
}

/*============================================================================*/
/*                           AUXILIARY FUNCTIONS                              */
/*============================================================================*/

// Create a new randomly positioned object point
function generateNewPoint() {
	return {
		x: Math.random()*(dw-arrowBoxSize) - (dw-arrowBoxSize)/2,
		y: Math.random()*(dh-arrowBoxSize) - (dh-arrowBoxSize/2),
		phase: 0
	}
}

// Add a new point to the object
function addPoint() {
	document.getElementById("lessPts").disabled = false;
	points.push( generateNewPoint() );
	numWaves++;
	refresh();
}

// Remove the last point of the object
function removePoint() {
	points.pop();
	document.getElementById("lessPts").disabled = (points.length == 0);
	numWaves--;
	refresh();
}

// Update angle of reference wave
function setRefAngle(){
	// Get the current angle
	refAngle = document.getElementById("angle-slider").value;
	// Update the angle label with the current slider value
	document.getElementById("angle-text").textContent = ' ' + Math.round(refAngle*10)/10 + 'º';
	// Calculate length of a cycle of the reference wave
	// in the direction the hologram is set up (horizontal)
	horizCycleLength = wavLen / Math.sin( refAngle * deg2rad );
	// Update the canvases
	refresh();
}

// Convert a value bewtween 0 and 1 to a grayscale color code
function unitFractionToHexColor(val) {
	// Convert range 0-1 to an integer in the range 0-255 and then to the hex format
	var greyHexValue = Math.round(val * 255).toString(16);
	// pad with zero if it has only one digit (#333 != #030303)
	if (greyHexValue.length==1) greyHexValue = '0' + greyHexValue;
	// prefix with number sign and repeat the hex string 3 times (for RGB)
	return "#" + Array(4).join(greyHexValue);
}

// Calculate a distance using the Euclidean distance formula
function distanceToOrigin(x, y) {
	return Math.sqrt( Math.pow(x,2) + Math.pow(y,2) );
}

// Attention: only works for positive indexes!
Array.prototype.max = function () {
  return this.reduce(function (p, v) {
    return ( p > v ? p : v );
  });
}

