"use strict";

// FIDAN SAMET 21727666
// OGUZ BAKIR 21627007

var canvas;
var gl;

var numPositions = 36;

var positionsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelViewMatrix, projectionMatrix;
var viewerPos;
var program;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var r = 0.0 , g = 0.0, b = 0.0;
var rotateTheta = vec3(0, 0, 0);
var thetaLoc;
var flag = false;
var texture;
var ambientProduct;

// Camera stuff
var phi = -9.5;
var theta = -2.0;
var eye;
var near = 0.3;
var far = 500.0;
var radius = 5.0;
var fovy = 45.0;
var cameraTranslation = vec3(0.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var aspect = 1.0;


var i, j;


var texCoord = [
    vec2(0, 0),
    vec2(0.5, 1),
    vec2(1, 1),
    vec2(1, 0)
];
                
var vertices = [
    vec4(-0.5, 0.0, 0.5, 1.0),
    vec4(0.0, 1.0, 0.0, 1.0),
    vec4(0.5,  0.0, 0.5, 1.0),
    vec4(0.5,  0.0,  -0.5, 1.0),
    vec4(-0.5,  0.0, -0.5, 1.0)
];

function getPyramidVertex (index, i, j) {
    switch (index) {
        case 0:
            return vec4((i*4) + 1, 0.0, (j*4) + 3, 1.0);
            
            break;
        case 1:
            return vec4((i*4) + 2, 1.0, (j*4) + 2, 1.0);
            break;
        case 2:
            return vec4((i*4) + 1, 0.0, (j*4) + 1, 1.0);
            
            
            break;        
        case 3:
            return vec4((i*4) + 3, 0.0, (j*4) + 1, 1.0);
            
            break;
        case 4:
            return vec4((i*4) + 3, 0.0, (j*4) + 3, 1.0);
            break;
    }
}

function triangle(a, b, c, i, j) {
    
    var t1 = subtract(getPyramidVertex(b, i, j),getPyramidVertex(a, i, j));
    var t2 = subtract(getPyramidVertex(c, i, j), getPyramidVertex(b, i, j));
    var normal = cross(t1, t2);
    normal = vec3(normal);

    positionsArray.push(getPyramidVertex(a, i, j));
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);

    positionsArray.push(getPyramidVertex(b, i, j));
    texCoordsArray.push(texCoord[1]);
    normalsArray.push(normal);

    positionsArray.push(getPyramidVertex(c, i, j));
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);
}

function pyramid() {
    for (i = 0; i < 25; i++) {
        for (j = 0; j < 25; j++) {
            triangle(1, 0, 2, i, j);
            triangle(1, 2, 3, i, j);
            triangle(1, 3, 4, i, j);
            triangle(1, 4, 0, i, j);
        }
    }
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.uniform1i(gl.getUniformLocation(program, "texture2d"), 0);
}


window.onload = function init() {
    canvas = document.getElementById("glCanvas");
    aspect = canvas.width / canvas.height;
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //  Load shaders and initialize attribute buffers
    program = initShaderProgram(gl, vertexShader, teapotFragmentShader);
    gl.useProgram(program);

    pyramid();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0);

    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);
    

    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
       lightPosition );

    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"), materialShininess);

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),
       false, flatten(projectionMatrix));
       
    var image = document.getElementById("brickTex");
    configureTexture( image );
    render();
    
     document.addEventListener('keydown', function(event) {
    
        switch(event.keyCode) {
            // O key
            case 79:
                break;
            // P key
            case 80:
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

function render(){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(flag) rotateTheta[axis] += 2.0;

    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotate(rotateTheta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(rotateTheta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(rotateTheta[zAxis], vec3(0, 0, 1)));
    ambientProduct = mult(lightAmbient, materialAmbient);
    
    eye = vec3(radius * Math.sin(theta) * Math.cos(phi), 
            radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));
    eye = add(eye, cameraTranslation);
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uModelViewMatrix"), false, flatten(modelViewMatrix));
            
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);

       console.log(positionsArray.length);
    gl.drawArrays(gl.TRIANGLES, 0, positionsArray.length);

    requestAnimationFrame(render);
}