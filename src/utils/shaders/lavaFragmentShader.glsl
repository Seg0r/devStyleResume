// Three js adaptation of:
// Noise animation - Lava by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/lslXRS
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options
const shader = `
uniform float time;
uniform sampler2D iNoise;
uniform vec2 iResolution;

#define myTime time*0.1

varying vec2 vUv;
varying vec3 eyeVector;
varying vec3 vNormal2;

float hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float noise( in vec2 x ){return texture(iNoise, x*.01).x;}

vec2 gradn(vec2 p)
{
	float ep = .09;
	float gradx = noise(vec2(p.x+ep,p.y))-noise(vec2(p.x-ep,p.y));
	float grady = noise(vec2(p.x,p.y+ep))-noise(vec2(p.x,p.y-ep));
	return vec2(gradx,grady);
}

float flow(in vec2 p)
{
	float z=3.;
	float rz = 0.;
	vec2 bp = p;
	for (float i= 1.;i < 7.;i++ )
	{
		//primary flow speed
		p += myTime*.1;
		
		//secondary flow speed (speed of the perceived flow)
		bp += myTime*1.9;
		
		//displacement field (try changing time multiplier)
		vec2 gr = gradn(i*p*.34+myTime*1.);
		
		//rotation of the displacement field
		gr*=makem2(myTime*6.-(0.05*p.x+0.03*p.y)*40.);
		
		//displace the system
		p += gr*.8;
		
		//add noise octave
		rz+= (sin(noise(p)*7.)*0.5+0.5)/z;
		
		//blend factor (blending displaced system with base system)
		//you could call this advection factor (.5 being low, .95 being high)
		p = mix(bp,p,.77);
		
		//intensity scaling
		z *= 1.7;
		//octave scaling
		p *= 2.;
		bp *= 1.9;
	}
	return rz;	
}

float Fresnel(vec3 eyeVector, vec3 worldNormal){
    // return pow(1.0-dot(eyeVector,worldNormal),2.0);
	return pow(( 1.0 - -min(dot(eyeVector, normalize(worldNormal) ), 0.0) ), 3.);
}



vec4 lavaColor()
{	
    vec2 p = -1.0 + 2.0 *vUv;
	// p.x *= iResolution.x/iResolution.y;
	p*= 3.;
	float rz = flow(p);

	//Fresnel
	float fres = Fresnel(eyeVector, vNormal2);
	
	vec3 col = 1.5*vec3(.13,0.07,0.01)/rz;
	
	col=pow(col,vec3(1.4));
	vec4 color = vec4(col,1.0);
	color.rgb += col*fres*5.0;
	
	return color;
}
`

export default shader;