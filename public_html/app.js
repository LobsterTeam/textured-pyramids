"use strict";
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// FIDAN SAMET 21727666
// OGUZ BAKIR 21627007


var positionsArray = [];
var texCoordsArray = [];
var numOfComponents = 3;        // x, y and z (3d)
var offset = 0;
var normalize = false;
var stride = 0;
var rotateTheta = 0.0;
var rotate = true;
var rotateStep = 1.0;
var at = vec3(0.0,0.0,0.0);
var up = vec3(0.0,1.0,0.0);
var eye;
var phi = 0.0;
var theta = 0.0;
var projectionMatrix;
var modelViewMatrix;
var near = 0.3;
var far = 100.0;     // ne kadar far o kadar view volume un icinde
var radius = 5.0;   // ne kadar radius o kadar uzak
var fovy = 45.0;    // ne kadar fovy o kadar uzak
var surfaceVertex = [vec3(-10.0, 0.0, 10.0), vec3(-10.0, 0.0, -10.0), vec3(10.0, 0.0, -10.0), 
                    vec3(10.0, 0.0, -10.0), vec3(10.0, 0.0, 10.0), vec3(-10.0, 0.0, 10.0)];
                
var gl, teapotShader, texture;
                
var texCoord = [
    vec2(0, 0),
    vec2(0.5, 1),
    vec2(1, 1),
    vec2(1, 0)
];
                
var vertices = [
        vec3(-0.5, 0.0, 0.5),
        vec3(0.0, 1.0, 0.0),
        vec3(0.5,  0.0, 0.5),
        vec3(0.5,  0.0,  -0.5),
        vec3(-0.5,  0.0, -0.5)
    ];
var aspect = 1.0;

var cameraTranslation = vec3(5.0, 3.0, 5.0);

function pyramid(a, b, c) {

     positionsArray.push(vertices[a]);
     texCoordsArray.push(texCoord[0]);
     
     positionsArray.push(vertices[b]);
     texCoordsArray.push(texCoord[1]);
     
     positionsArray.push(vertices[c]);
     texCoordsArray.push(texCoord[2]);
     
}

function texturedPyramid()
{
    pyramid(1, 0, 2);
    pyramid(1, 2, 3);
    pyramid(1, 3, 4);
    pyramid(1, 4, 0);
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    console.log(image);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    //gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    console.log(teapotShader);
    gl.uniform1i(gl.getUniformLocation(teapotShader, "texture2d"), 0);
}

function rafAsync() {
    return new Promise(resolve => {
        requestAnimationFrame(resolve); //faster than set time out
    });
}

async function getImageFromHtml(id) {
    const element = document.getElementById(id);
    while (element === null) {
        await rafAsync();
    }
    return element;
}


function main() {
    const canvas = document.querySelector("#glCanvas");
    canvas.height = $(window).height();
    canvas.width = $(window).width();
    gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    
    

    
    texturedPyramid();
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;
    
    gl.clearColor(255 / 255.0, 255 / 255.0, 255 / 255.0, 1.0);       // white
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var type = gl.FLOAT;
    

    teapotShader = initShaderProgram(gl, vertexShader, teapotFragmentShader);
    gl.useProgram(teapotShader);
    const teapotBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(gl.getAttribLocation(teapotShader, 'i_position'));
    var shaderRotateTheta = gl.getUniformLocation(teapotShader, 'u_rotate_theta');
    var shaderModelView = gl.getUniformLocation(teapotShader, 'u_model_view');
    var shaderProjection = gl.getUniformLocation(teapotShader, 'u_projection');
    
    const planeShader = initShaderProgram(gl, vertexShader, planeFragmentShader);
    const planeBuffer = gl.createBuffer();
    gl.enableVertexAttribArray(gl.getAttribLocation(planeShader, 'i_position'));
    var planeTheta = gl.getUniformLocation(planeShader, 'u_rotate_theta');
    var planeModelView = gl.getUniformLocation(planeShader, 'u_model_view');
    var planeProjection = gl.getUniformLocation(planeShader, 'u_projection');

    function render () {
        
        if (rotate) {
            rotateTheta += rotateStep;
        }
        
        canvas.height = $(window).height();
        canvas.width = $(window).width();

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // assign matrices
        eye = vec3(radius * Math.sin(theta) * Math.cos(phi), 
                    radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));
        eye = add(eye, cameraTranslation);
        modelViewMatrix = lookAt(eye, at, up);
        projectionMatrix = perspective(fovy, aspect, near, far);
        
        // TEAPOT
        gl.bindBuffer(gl.ARRAY_BUFFER, teapotBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
    
        // TEAPOT POSITIONS
        gl.vertexAttribPointer(gl.getAttribLocation(teapotShader, 'i_position'),
            numOfComponents, type, normalize, stride, offset);
        gl.useProgram(teapotShader);
        
        // TEAPOT UNIFORMS
        gl.uniform1f(shaderRotateTheta, rotateTheta);
        gl.uniformMatrix4fv(shaderModelView, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(shaderProjection, false, flatten(projectionMatrix));
        
        var tBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
        
        var vTexCoord = gl.getAttribLocation( teapotShader, "vTexCoord" );
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vTexCoord );
        
        // DRAW TEAPOT
        console.log(positionsArray.length);
        gl.drawArrays(gl.TRIANGLES, offset, positionsArray.length);
 
        // PLANE
        //gl.bindBuffer(gl.ARRAY_BUFFER, planeBuffer);
        //gl.bufferData(gl.ARRAY_BUFFER, flatten(surfaceVertex), gl.STATIC_DRAW);
        
        // PLANE POSITIONS
        //gl.vertexAttribPointer(gl.getAttribLocation(planeShader, 'i_position'),
                //numOfComponents, type, normalize, stride, offset);
        //gl.useProgram(planeShader);

        // PLANE UNIFORMS
       //gl.uniform1f(planeTheta, 0.0);
       // gl.uniformMatrix4fv(planeModelView, false, flatten(modelViewMatrix));
        //gl.uniformMatrix4fv(planeProjection, false, flatten(projectionMatrix));

        // DRAW PLANE
       // gl.drawArrays(gl.TRIANGLES, 0, surfaceVertex.length);
        
        //if (rotate){
            requestAnimationFrame(render);
        //}
    }
    
    //getImageFromHtml("brickTex").then((image) => {
    //    console.log(image);
    //    configureTexture(image);
        
    //});
    
    var image = document.getElementById("brickTex");
     render();

    configureTexture( image );
    

    document.addEventListener('keydown', function(event) {
    
        switch(event.keyCode) {
            // + key
            case 107:
                rotateStep += 1.0;
                //if (rotate == false) {
                 //   rotate = true;
                //    render();
                //}
                break;
            // - key
            case 109:
                rotateStep -= 1.0;
                //if (rotate == false) {
                //    rotate = true;
                //    render();
                //}
                break;
            // up arrow
            case 38:
                console.log("up arrow");
                at[2] -= 0.1;
                cameraTranslation[2] -= 0.1;
                break;
            // down arrow
            case 40:
                console.log("down arrow");
                at[2] += 0.1;
                cameraTranslation[2] += 0.1;
                break;
            // right arrow
            case 39:
                console.log("right arrow");
                at[0] += 0.1;
                cameraTranslation[0] += 0.1;
                break;
            // left arrow
            case 37:
                console.log("left arrow");
                at[0] -= 0.1;
                cameraTranslation[0] -= 0.1;
                break;
            // page up key
            case 33:
                console.log("page up");
                at[1] += 0.1;
                cameraTranslation[1] += 0.1;
                break;
            // page down key
            case 34:
                console.log("page down");
                at[1] -= 0.1;
                cameraTranslation[1] -= 0.1;
                break;
            // e key
            case 69: 
               if(document.pointerLockElement === canvas ||
                       document.mozPointerLockElement === canvas) {
                   // unlock it
                   console.log("unlocked");
                   document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;
                   document.exitPointerLock();
                   document.removeEventListener("mousemove", updatePosition, false);
               } else {
                   // lock it
                   console.log("locked");
                   canvas.requestPointerLock = canvas.requestPointerLock ||
                           canvas.mozRequestPointerLock;
                   canvas.requestPointerLock();
                   document.addEventListener("mousemove", updatePosition, false);
               }
               break;
            default:
                break;
        }
    });
    
    function updatePosition(e) {
        phi += e.movementX * Math.PI/180.0;
        theta += e.movementY * Math.PI/180.0;
    }
}


main();