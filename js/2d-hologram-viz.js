"use strict"

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
    refAngle = document.getElementById("angle-slider").value,
    refPhase = document.getElementById("phase-slider").value,
    points = [
    	{ x:-dw/3, y: -dh/2, phase: 0 },
    	{ x: dw/3, y: -3*dh/4, phase: 0 }
    ],
    hologramValues = Array(hw);
// Variables to control the appearance and behavior of the visualization
var displayCurves = false,
    animate = false;
// Auxiliary variables
var numWaves = points.length + 1, // one wave per point source, plus the reference wave
    animateTimeoutID = 0,
    phaseSteps = 1/document.getElementById("phase-slider").step,
    phaseSweep = Array(phaseSteps),
	maxIntensity = 0;

// Center coordinate origin horizontally for both canvases
diagram.translate(dw/2, 0);
hologram.translate(dw/2, hh);
curves.translate(cw/2, ch);
// Make the y axis grow upwards
diagram.scale(1,-1);
hologram.scale(1,-1);
curves.scale(1,-1);

// Update all canvases with content based on the new values of the various parameters
function refresh() {
	// Reset canvases
	diagram.clearRect(-dw/2, 0, dw, -dh);
	hologram.clearRect(-hw/2, 0, hw, hh);
	curves.clearRect(-cw/2, 0, cw, ch);
	// Get updated values from interactive controls
	refAngle = document.getElementById("angle-slider").value;
	displayCurves = document.getElementById("show-curves").checked;
	animate = document.getElementById("animate").checked;
	if(animate) {
		// Automatically step the phase if animation is running
		refPhase = (refPhase + 0.01) % 1;
		// Update phase label in interface with the new value
		document.getElementById("phase-slider").value = refPhase;
	} else {
		// Get phase from slider. Needs to be explicitly converted to a number,
		// otherwise it is considered a string
		refPhase = Number(document.getElementById("phase-slider").value);
		// Timeout has to be cleared when ceasing animation,
		// otherwise there's an extra iteration after the last step (I don't know why)
		if(animateTimeoutID) {
			window.clearTimeout(animateTimeoutID);
			animateTimeoutID = 0;
		}
	}
	// Update the diagram canvas with the updated content
	drawPlanarWave();
	drawCircularWaves();
	drawPlanarWaveDirectionBox();
	// Update the hologram and the curves canvases.
	paintHologram();
	// Update the interface labels with the current slider values
	document.getElementById("angle-text").textContent = ' ' + Math.round(refAngle*10)/10 + 'º';
	document.getElementById("phase-text").textContent = ' +' + Math.round(100*refPhase) +'%';
	// Schedule next call of refresh()
	if(animate) {
		animateTimeoutID = window.setTimeout(refresh, 10);
	}
}

// Draw the planar (reference) wave's wavefronts in the diagram canvas
function drawPlanarWave() {

	diagram.save();

	// If user chooses to show the amplitude profiles
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
		diagram.moveTo(-diagramRadius*2, i+refPhase*wavLen);
		diagram.lineTo( diagramRadius*2, i+refPhase*wavLen);
		// Don't draw the central line twice
		if (i == 0) { continue; }
		// Draw horizontal lines downwards from the center of the coordinate system
		diagram.moveTo(-diagramRadius*2,-i+refPhase*wavLen);
		diagram.lineTo( diagramRadius*2,-i+refPhase*wavLen);
	}

	diagram.stroke();

	diagram.restore();
}

// Show a small box with an arrow showing the propagation direction of the reference wave
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
		dist -= refPhase*wavLen;
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

// Calculate the amplitude values for each wave (including the reference wave),
// obtain the interference values (sum of amplitudes) for each hologram pixel,
// square it to get the intensity, and paint them
function paintHologram() {
	var horizCycleLength = wavLen / Math.sin( refAngle * deg2rad ),
	    // Count how many phase states we have already calculated hologram values for
	    // adapted from http://stackoverflow.com/q/6265940/
	    filledPhases = phaseSweep.filter(Number).length,
	    maxHologramValue = (filledPhases == phaseSteps) ? hologramValues.max() : 1,
	    // Ratio we need to multiply the hologram to have the max increase be 1/phaseStep.
	    // the max value will correspond to the greatest increase, so we use it as a limit.
	    growthRatio = (maxHologramValue+(1/phaseSteps)) / maxHologramValue;
	for (var holo_x = -hw/2; holo_x < hw/2; holo_x++) {
		var perWaveAmplitude = [],
		    totalAmplitude = 0,
		    // holo_index is used for the hologramValues array.			
		    // Its value is calculated to make it go from 0 to hw
		    // rather than from -hw/2 to hw/2
		    // Otherwise calculating its maximum would be cumbersome.
		    holo_index = holo_x+hw/2;

		// Calculate the amplitude of the reference wave.
		//   We know — because we define it that way in drawPlanarWave() —
		//   that the the reference wave has zero phase at x=0
		//   (since we draw a horizontal line at y=0 and the others growing
		//   from there, while the coordinate system is rotated around (0,0))
		//
		//   |<-- horizCycleLength -->|            The amplitude at holo_x==0
		// ============================= hologram  will be cos(refPhase) = cos(0).
		//   `-. ) refAngle          /   plane     As holo_x progresses within
		//      `-.                 /              horizCycleLength, the amplitude
		//         `-.             /               will gradually make the cosine curve
		// wavefront  `-.         / wavLen         until it reaches cos(tau) == cos(0).
		// of reference  `-.     /             So we calculate the currently covered
		//           wave   `-. /              fraction of horizCycleLength,
		//                     `               then multiply the cycle number by tau
		//                                     to get the result in radians, for cosine.
		totalAmplitude = Math.cos( tau * ( holo_x / horizCycleLength - refPhase ) );
		// Draw the amplitude profile curve for the reference wave
		if (displayCurves) {
			drawCurve(points.length, holo_x, totalAmplitude);
		}

		// Calculate the intensity of the current point's object wave
		for (var pt = 0; pt < points.length; pt++) {
			var radius = distanceToOrigin(holo_x-points[pt].x, points[pt].y);
			perWaveAmplitude[pt] = Math.cos((radius - points[pt].phase) * tau/wavLen);
			totalAmplitude += perWaveAmplitude[pt];
			// Draw the intensity profile curve for the current wave
			if (displayCurves) {
				// Normalize intensity values from cosine's [-1;1] range to [0;1]
				drawCurve(pt, holo_x, perWaveAmplitude[pt]);
			}
		}

		// Divide by number of points (plus ref wave)
		// to allow summing intensity contributions of all waves
		// and still have the final intensity values range from 0 to 1
		// Also, take the absolute value, since what we care about is
		// whether there is wave activity at this point, and by how much
		var intensity = Math.pow(totalAmplitude/numWaves,2);
		maxIntensity = Math.max(maxIntensity, intensity);

		// Paint the calculated intensity into the current (instantaneous) hologram pixel
		hologram.fillStyle = unitFractionToHexColor(intensity);
		hologram.fillRect(holo_x, 0, 1, hh/2);

		// Calculate values for cumulative (final) hologram
		if( !phaseSweep[ Math.round(refPhase*phaseSteps) ] ) {
			hologramValues[holo_index] = (hologramValues[holo_index]||0) + intensity/phaseSteps;
		}
		// Gradually normalize intensity of cumulative hologram
		// We make it grow at a pace of 1/phaseSteps,
		// which is the maximum pace it could grow in the previous stage
		// (i.e. when each phase value was being accumulated,
		// assuming totalAmplitude would total 1 for any given pixel)
		else if(filledPhases == phaseSteps && maxHologramValue < maxIntensity-1/phaseSteps) {
			hologramValues[holo_index] *= growthRatio;
		}
		// Paint the calculated intensity into the current (cumulative) hologram pixel
		hologram.fillStyle = unitFractionToHexColor(hologramValues[holo_index]);
		hologram.fillRect(holo_x, hh/2, 1, hh);

		// Draw cumulative version of main intensity curve
		// Two versions are drawn to account for its axial symmetry
		drawCurve(-2, holo_x, hologramValues[holo_index], "#ccc");
		drawCurve(-2, holo_x,-hologramValues[holo_index], "#ccc");
		// Draw instantaneous version of main intensity curve
		drawCurve(-1, holo_x, intensity, "gray");
	}
	// Mark this phase value as done, so it isn't calculated again
	phaseSweep[ Math.round(refPhase*phaseSteps) ] = true;
}

// ## AUXILIARY FUNCTIONS ##

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
	newHologram();
}

// Remove the last point of the object
function removePoint() {
	points.pop();
	document.getElementById("lessPts").disabled = (points.length == 0);
	numWaves--;
	newHologram();
}

// Only call refresh() if it isn't already scheduled
function update() {
	if(!animate) refresh();
}

// Reset cumulative hologram because conditions have changed
function newHologram() {
	phaseSweep = Array(50);
	hologramValues = Array(hw);
	maxIntensity = 0;
	update();
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

// Draw a point (or rectangle) in the "curves" canvas,
// corresponding to a given wave's amplitude at that point.
// As the hologram is scanned by the hologram drawing code,
// this gets called for each hologram pixel,
// and the points end up forming an amplitude curve,
// while the rectangles form an area (i.e a filled curve).
function drawCurve(waveIndex, xCoord, value, color) {
	if( waveIndex < 0 ) {
		// Draw a filled area if dealing with intensity values
		// (both instantaneous and cumulative).
		curves.fillStyle = color || "black";
		curves.fillRect(xCoord, 0, 1, ch*value);
	} else {
		// Spread the colors around the hue circle according to the number of
		// points we have. The reference wave keeps the 360º (red)
		curves.fillStyle = "hsl(" + 360*((waveIndex+1)/numWaves) + ", 100%, 50%)";
		// Normalize values from cosine's [-1;1] range to [0;1]
		// Also invert it for display, to make the crests of the curves canvas
		// visually touch the crests as seen from top-down in the diagram canvas
		value = 1-(value+1)/2;
		curves.beginPath();
		curves.arc(xCoord, ch*value, 0.75, 0, tau, true);
		curves.fill();
	}
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
