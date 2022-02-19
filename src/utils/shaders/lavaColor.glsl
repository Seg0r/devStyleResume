// Three js adaptation of:
// Noise animation - Lava by nimitz (twitter: @stormoid)
// https://www.shadertoy.com/view/lslXRS
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// Contact the author for other licensing options
import classicNoise3D from './classicnoise3d.glsl';

const shader = classicNoise3D+`

mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
float noise( in vec2 x , sampler2D iNoise){return texture(iNoise, x*.01).x;}

vec2 gradn(vec2 p, sampler2D iNoise)
{
	float ep = .09;
	float gradx = noise(vec2(p.x+ep,p.y),iNoise)-noise(vec2(p.x-ep,p.y),iNoise);
	float grady = noise(vec2(p.x,p.y+ep),iNoise)-noise(vec2(p.x,p.y-ep),iNoise);
	return vec2(gradx,grady);
}

float flow(in vec2 p, float myTime, sampler2D iNoise)
{
	float pi = 3.14159265359;
	//traingle function to get rid of edge
	p.x = 2.*(1. - abs(p.x));
	float z=3.;
	float rz = 0.;
	vec2 bp = p;

	for (float i= 1.;i < 7.;i++ )
	{
		//primary flow speed
		p += myTime*.1;

		//secondary flow speed (speed of the perceived flow)
		bp += myTime*0.9;
		
		//displacement field (try changing time multiplier)
		vec2 gr = gradn(i*p*.34+myTime*1.,iNoise);
		
		//rotation of the displacement field
		gr*=makem2(myTime*6.-(0.05*p.x+0.03*p.y)*40.);
		
		//displace the system
		p += gr*.8;
		
		//add noise octave
		rz+= (sin(noise(p,iNoise)*7.)*0.5+0.5)/z;
		
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

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}


vec4 lavaColor(vec2 vUv, vec3 vNormal2, vec3 eyeVector, float myTime, sampler2D iNoise, float iBrightness, float iSaturation, float iHSV)
{	
    vec2 p = -1.0 + 2.0 *vUv;
	p *= 2.0;
	float rz = flow(p,myTime,iNoise);

	//Fresnel
	float fres = Fresnel(eyeVector, vNormal2);

	if(iSaturation < 0.0){
		iSaturation = 1.0;
	}
	
	vec3 col = 1.5*vec3(.13,0.07,0.01)/(rz*iSaturation);
	
	col=pow(col,vec3(1.4));
	vec4 color = vec4(col,1.0);
	// color = texture2D(iNoise, p);
	color.rgb += col*fres*10.0;
	vec3 hsv = rgb2hsv(color.rgb);
	hsv.z *= iBrightness;

	if(iSaturation < 1.0){
		hsv.y = iSaturation;
	}
	
	if(iHSV > 0.0 && iHSV < 360.0){
		hsv.y = iSaturation;
		hsv.x = iHSV/360.;
	}
	
	color.rgb = hsv2rgb(hsv);

	
	return color;
}
`

export default shader;