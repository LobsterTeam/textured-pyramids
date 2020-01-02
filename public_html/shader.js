/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const vertexShader = `#version 300 es

    in  vec4 aPosition;
    in  vec3 aNormal;
    in  vec2 vTexCoord;

    out vec4 vColor;
    out vec2 fTexCoord;

    uniform vec4 uAmbientProduct, uDiffuseProduct, uSpecularProduct;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uLightPosition;
    uniform float u_limit;
    uniform float uShininess;

    void main() {

        vec3 pos = (uModelViewMatrix * aPosition).xyz;

        //fixed light postion

        vec3 light = uLightPosition.xyz;
        vec3 L = normalize(light - pos);


        vec3 V = -pos;
        vec3 H = normalize(L + V);

        vec4 NN = vec4(aNormal,1.0);

        // Transform vertex normal into eye coordinates

        mat3 normalMatrix = mat3(transpose(inverse(uModelViewMatrix)));
        vec3 N = normalize(normalMatrix * aNormal).xyz;

        float specular = 0.0;
        float fLight = 0.0;


        float dotFromDirection = dot(L, V);
        if(dotFromDirection >= u_limit){
            fLight = dot(normalize(aNormal), L);
            if( fLight > 0.0 ) {
                //specular = vec4(0.0, 0.0, 0.0, 1.0);
                specular = pow(dot(normalize(aNormal),H),uShininess);
            }
        } 



        gl_Position = uProjectionMatrix * uModelViewMatrix *aPosition;
        vColor.rgb *= fLight;
        vColor.rgb += specular;

        vColor.a = 1.0;
        fTexCoord = vTexCoord;
    }
`;

const fragmentShader = `#version 300 es

    precision mediump float;
    
    in vec4 vColor;
    in vec2 fTexCoord;

    uniform sampler2D texture2d;

    out vec4 fColor;

    void main() {
        fColor = vColor * texture(texture2d, fTexCoord);
    }
`;

