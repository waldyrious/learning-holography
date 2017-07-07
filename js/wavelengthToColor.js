// Convert wavelength (in nanometers) to a color (as an RBG array)
// Code from http://academo.org/demos/wavelength-to-colour-relationship/animation.js,
// which in turn was adapted from http://www.efg2.com/Lab/ScienceAndEngineering/Spectra.htm
function nmToRGB( Wavelength, grayscale = false ) {
	var Gamma = 0.80;
	var IntensityMax = 255;
	var intensityFactor = 1.0;

	// Spectral sensitivity curves for each component,
	// approximated as six linear segments
	if( ( Wavelength >= 380 ) && ( Wavelength < 440 ) ) {
		Red = -( Wavelength - 440 ) / ( 440 - 380 );
		Green = 0.0;
		Blue = 1.0;
	} else if( ( Wavelength >= 440 ) && ( Wavelength < 490 ) ) {
		Red = 0.0;
		Green = ( Wavelength - 440 ) / ( 490 - 440 );
		Blue = 1.0;
	} else if( ( Wavelength >= 490 ) && ( Wavelength < 510 ) ) {
		Red = 0.0;
		Green = 1.0;
		Blue = -( Wavelength - 510 ) / ( 510 - 490 );
	} else if( ( Wavelength >= 510 ) && ( Wavelength < 580 ) ) {
		Red = ( Wavelength - 510 ) / ( 580 - 510 );
		Green = 1.0;
		Blue = 0.0;
	} else if( ( Wavelength >= 580 ) && ( Wavelength < 645 ) ) {
		Red = 1.0;
		Green = -( Wavelength - 645 ) / ( 645 - 580 );
		Blue = 0.0;
	} else if( ( Wavelength >= 645 ) && ( Wavelength < 781 ) ) {
		Red = 1.0;
		Green = 0.0;
		Blue = 0.0;
	} else {
		Red = 0.0;
		Green = 0.0;
		Blue = 0.0;
	};

	// Let the intensity fall off near the vision limits
	smoothLow = ( 1 - Math.tanh( ( 420 - Wavelength ) / 20 ) ) / 2;
	smoothHigh = ( 1 + Math.tanh( ( 740 - Wavelength ) / 20 ) ) / 2;
	intensityFactor = Math.min( smoothLow, smoothHigh );

	// Don't want 0^x = 1 for x <> 0
	if( Red == 0 ) { Red = 0 } else Red = Math.round( IntensityMax * Math.pow( Red * intensityFactor, Gamma ) );
	if( Green == 0 ) { Green = 0 } else Green = Math.round( IntensityMax * Math.pow( Green * intensityFactor, Gamma ) );
	if( Blue == 0 ) { Blue = 0 } else Blue = Math.round( IntensityMax * Math.pow( Blue * intensityFactor, Gamma ) );

	// Simple grayscale calculation (if we converted from RGB we would get intensity dips in the middle)
	if( grayscale ) Red = Green = Blue = Math.round( IntensityMax * Math.pow( 1.0 * intensityFactor, Gamma ) );

	rgb = new Array( Red, Green, Blue );
	return rgb;
}
