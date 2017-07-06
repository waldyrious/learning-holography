// Convert wavelength (in nanometers) to a color (as an RBG array)
// Code from http://academo.org/demos/wavelength-to-colour-relationship/animation.js,
// which in turn was adapted from http://www.efg2.com/Lab/ScienceAndEngineering/Spectra.htm
function nmToRGB( Wavelength ) {
	var Gamma = 0.80;
	var IntensityMax = 255;
	var factor;

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

	if( ( Wavelength >= 380 ) && ( Wavelength < 420 ) ) {
		factor = 0.3 + 0.7 * ( Wavelength - 380 ) / ( 420 - 380 );
	} else if( ( Wavelength >= 420 ) && ( Wavelength < 701 ) ) {
		factor = 1.0;
	} else if( ( Wavelength >= 701 ) && ( Wavelength < 781 ) ) {
		factor = 0.3 + 0.7 * ( 780 - Wavelength ) / ( 780 - 700 );
	} else {
		factor = 0.0;
	};

	// Don't want 0^x = 1 for x <> 0
	if( Red == 0 ) { Red = 0 } else Red = Math.round( IntensityMax * Math.pow( Red * factor, Gamma ) );
	if( Green == 0 ) { Green = 0 } else Green = Math.round( IntensityMax * Math.pow( Green * factor, Gamma ) );
	if( Blue == 0 ) { Blue = 0 } else Blue = Math.round( IntensityMax * Math.pow( Blue * factor, Gamma ) );

	rgb = new Array( Red, Green, Blue );
	return rgb;
}