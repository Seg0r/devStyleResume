// Three js adaptation of:
// Noise animation - Lava by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/lslXRS
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options
const shader = `
uniform float iTime;
uniform sampler2D iChannel0;
uniform vec2 iResolution;

#define time iTime*0.1

varying vec2 vUv;
varying vec3 eyeVector;
varying vec3 vNormal;

float hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float noise( in vec2 x ){return texture(iChannel0, x*.01).x;}

vec2 gradn(vec2 p)
{
	float ep = .09;
	float gradx = noise(vec2(p.x+ep,p.y))-noise(vec2(p.x-ep,p.y));
	float grady = noise(vec2(p.x,p.y+ep))-noise(vec2(p.x,p.y-ep));
	return vec2(gradx,grady);
}

float flow(in vec2 p)
{
	float z=2.;
	float rz = 0.;
	vec2 bp = p;
	for (float i= 1.;i < 7.;i++ )
	{
		//primary flow speed
		p += time*.1;
		
		//secondary flow speed (speed of the perceived flow)
		bp += time*1.9;
		
		//displacement field (try changing time multiplier)
		vec2 gr = gradn(i*p*.34+time*1.);
		
		//rotation of the displacement field
		gr*=makem2(time*6.-(0.05*p.x+0.03*p.y)*40.);
		
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
	return pow(( 1.0 - -min(dot(eyeVector, normalize(vNormal) ), 0.0) ), 3.);
}



void main()
{	
    vec2 p = -1.0 + 2.0 *vUv;
	p.x *= iResolution.x/iResolution.y;
	p*= 3.;
	float rz = flow(p);

	//Fresnel
	float fres = Fresnel(eyeVector, vNormal);
	
	vec3 col = vec3(.13,0.07,0.01)/rz;
	
	col=pow(col,vec3(1.4));
	gl_FragColor = vec4(col,1.0);
	gl_FragColor.rgb += col*fres*15.0;
	// gl_FragColor = vec4(fres);
	
}
`

export default shader;