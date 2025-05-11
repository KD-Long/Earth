uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;

uniform vec3 uRegionAPAC;
uniform vec3 uRegionAMER;
uniform vec3 uRegionEMEA;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;


// Helper function to draw circle around region
float regionHighlight(vec3 regionCenter, float size) {
  float d = distance(normalize(vNormal), normalize(regionCenter));
  return smoothstep(size, size * 0.5, d); // feathered circle
}


void main()
{
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = vec3(0.0);

    // sun direction
    // vec3 uSunDirection = vec3(0.0,0.0,1.0);
    float sunOrientation = dot(uSunDirection, normal);
    color = vec3(sunOrientation);
    // think of this as an interpolation of a flat plane of the normal coming from the surface

    // Day night color
    float dayMix =smoothstep(-0.25,0.5,sunOrientation);
    vec3 dayColor = texture(uDayTexture, vUv).rgb;
    vec3 nightColor = texture(uNightTexture, vUv).rgb;
    color = mix(nightColor,dayColor,dayMix);

    // Highlight Regions — draw red circles on the globe
    float apacHighlight = regionHighlight(uRegionAPAC, 0.35);
    float amerHighlight = regionHighlight(uRegionAMER, 0.35);
    float emeaHighlight = regionHighlight(uRegionEMEA, 0.35);

    float highlightMask = max(max(apacHighlight, amerHighlight), emeaHighlight);
    vec3 highlightColor = vec3(1.0, 0.0, 0.0); // red

    //this blends my globe with my highlighted regions
    color = mix(color, highlightColor, highlightMask); // blend red glow in


    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}

