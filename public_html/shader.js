/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const vertexShader = `#version 300 es

    in  vec4 aPosition;
    in  vec3 aNormal;
    in  vec2 vTexCoord;

    //out vec4 vColor;
    out vec2 fTexCoord;
    out vec3 v_normal;
    out vec3 v_surfaceToLight;
    out vec3 v_surfaceToView;
    out float u_shininess;
    out vec3 lightDir;
    out float limit;


    uniform vec4 uAmbientProduct, uDiffuseProduct, uSpecularProduct;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec3 uLightPosition;        // 3
    uniform float u_limit;
    uniform float uShininess;
    
    uniform vec4 u_viewWorldPosition;       // yeni
    //uniform mat4 u_worldInverseTranspose;
    uniform vec3 u_lightDirection;

    void main() {
        
        
        mat4 u_worldInverseTranspose = transpose(inverse(uModelViewMatrix));
        v_normal = mat3(u_worldInverseTranspose) * aNormal;
        vec3 surfaceWorldPosition = (uModelViewMatrix * aPosition).xyz;
        v_surfaceToLight = uLightPosition - surfaceWorldPosition;
        v_surfaceToView = u_viewWorldPosition.xyz - surfaceWorldPosition;
        




        lightDir = u_lightDirection;
        u_shininess = uShininess;
        limit = u_limit;
        fTexCoord = vTexCoord;
        gl_Position = uProjectionMatrix * uModelViewMatrix *aPosition;
    }
`;

const fragmentShader = `#version 300 es

    precision mediump float;
    
    //in vec4 vColor;
    in vec2 fTexCoord;
    in vec3 v_normal;
    in vec3 v_surfaceToLight;
    in vec3 v_surfaceToView;
    in vec3 lightDir;
    in float u_shininess;
    in float limit;

    uniform sampler2D texture2d;

    out vec4 fColor;

    void main() {
        
        vec3 normal = normalize(v_normal);
        vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
        vec3 surfaceToViewDirection = normalize(v_surfaceToView);
        vec3 halfVector = normalize(surfaceToLightDirection);

        float light = 0.0;
        float specular = 0.0;
        float dotFromDirection = dot(surfaceToLightDirection, -lightDir);
        //light = 1.0;
        //light = dotFromDirection;
        if (dotFromDirection >= limit) {
            light = dot(normal, -surfaceToLightDirection);
            //light = 1.0;
            if (light > 0.0) {
                //specular = 1.0;
                specular = pow(dot(normal, halfVector), u_shininess);
            }
        }

        //fColor = u_color;

        // Lets multiply just the color portion (not the alpha)
        // by the light
        fColor = vec4(1.0, 1.0, 1.0, 1.0);
        fColor.rgb *= light;

        // Just add in the specular
        fColor.rgb += specular;
        fColor.a = 1.0;
        
        
        fColor = fColor * texture(texture2d, fTexCoord);
    }
`;

