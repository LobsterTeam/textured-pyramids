"use strict";

// FIDAN SAMET 21727666
// OGUZ BAKIR 21627007

var canvas;
var gl;

var positionsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var lightPosition = vec4(10.0, 10.0, 10.0, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(10.0, 10.0, 10.0, 1.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelViewMatrix, projectionMatrix;
var viewerPos;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var r = 0.0 , g = 0.0, b = 0.0;
var rotateTheta = vec3(0, 0, 0);
var thetaLoc;
var flag = false;
var texture;

// Camera stuff
var phi = -9.5;
var theta = -2.0;
var eye;
var near = 0.3;
var far = 500.0;
var radius = 5.0;
var fovy = 70.0;
var cameraTranslation = vec3(10.0, 10.0, 10.0);
var at = vec3(25.0, 0.0, 15.0);
var up = vec3(0.0, 1.0, 0.0);
var aspect = 1.0;

// Camera control parameters
var pitchAngle = 0;
var minPitchAngle = -90;
var maxPitchAngle = 90;

var yawAngle = 0;
var minYawAngle = -90;
var maxYawAngle = 90;

var rollCamera = false;

var rollAngle = 0;
var minRollAngle = -180;
var maxRollAngle = 180; 

var trackLeftRight = 0;
var pushInPullOut = 0;
var craneUpDown = 0;

var step = 0.5;

var fov = 30;
var fovMin = 10;
var fovMax = 160;

var u_limit = 20 * Math.PI/180.0;


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

var planeCoord = [vec4(0.0, 0.0, 100.0, 1.0), vec4(0.0, 0.0, 0.0, 1.0), vec4(100.0, 0.0, 0.0, 1.0),
                    vec4(100.0, 0.0, 0.0, 1.0), vec4(100.0, 0.0, 100.0, 1.0), vec4(0.0, 0.0, 100.0, 1.0)];
                
var planeNormals = [];

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

function calculatePlaneNormals () {
    
    var t1 = subtract(planeCoord[0], planeCoord[1]);
    var t2 = subtract(planeCoord[2], planeCoord[1]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
    
    planeNormals.push(normal);
    
    var t1 = subtract(planeCoord[5], planeCoord[4]);
    var t2 = subtract(planeCoord[3], planeCoord[4]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
    
    planeNormals.push(normal);
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
    for (var i = 0; i < 25; i++) {
        for (var j = 0; j < 25; j++) {
            triangle(1, 0, 2, i, j);
            triangle(1, 2, 3, i, j);
            triangle(1, 3, 4, i, j);
            triangle(1, 4, 0, i, j);
        }
    }
}

function configureTexture(program, image) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.uniform1i(gl.getUniformLocation(program, "texture2d"), 0);
}

window.onload = function init() {
    canvas = document.getElementById("glCanvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    pyramid();
    calculatePlaneNormals();
    
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    viewerPos = vec3(0.0, 0.0, -20.0);
    //projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var brickImage = document.getElementById("brickTex");
    var sandImage = document.getElementById("sandTex");

    // PYRAMID
    var pyramidProgram = initShaderProgram(gl, vertexShader, fragmentShader);
    var pyramidNormalBuffer = gl.createBuffer();
    var pyramidNormalLoc = gl.getAttribLocation(pyramidProgram, "aNormal");
    var pyramidVertexBuffer = gl.createBuffer();
    var pyramidPositionLoc = gl.getAttribLocation(pyramidProgram, "aPosition");
    var pyramidTexBuffer = gl.createBuffer();
    var pyramidTexLoc = gl.getAttribLocation(pyramidProgram, "vTexCoord");
    
    var pyramidDiffuse = gl.getUniformLocation(pyramidProgram, "uDiffuseProduct");
    var pyramidSpecular = gl.getUniformLocation(pyramidProgram, "uSpecularProduct");
    var pyramidLightPos = gl.getUniformLocation(pyramidProgram, "uLightPosition");
    var pyramidShin = gl.getUniformLocation(pyramidProgram, "uShininess");
    var pyramidProjection = gl.getUniformLocation(pyramidProgram, "uProjectionMatrix");
    var pyramidAmbient = gl.getUniformLocation(pyramidProgram, "uAmbientProduct");
    var pyramidMV = gl.getUniformLocation(pyramidProgram, "uModelViewMatrix");
    var limitLocation = gl.getUniformLocation(pyramidProgram, "u_limit");

    render();
    
    function render(){
        // resize fonksiyonuna alinabilirler belki
        canvas.height = $(window).height();
        canvas.width = $(window).width();
        gl.viewport(0, 0, canvas.width, canvas.height);
        aspect = canvas.width / canvas.height;
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        eye = vec3(radius * Math.sin(theta) * Math.cos(phi), 
                radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));
        eye = add(eye, cameraTranslation);
        modelViewMatrix = lookAt(eye, at, up);
        projectionMatrix = perspective(fovy, aspect, near, far);

        //projectionMatrix.rotate(phi, 1, 0, 0);
        //projectionMatrix.rotate(theta, 0, 1, 0);
        
        // PYRAMID NORMALS
        gl.useProgram(pyramidProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
        gl.vertexAttribPointer(pyramidNormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pyramidNormalLoc);

        // PYRAMID POSITIONS
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);
        gl.vertexAttribPointer(pyramidPositionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pyramidPositionLoc);

        // PYRAMID TEXTURES
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
        gl.vertexAttribPointer(pyramidTexLoc, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray(pyramidTexLoc);

        // PYRAMID UNIFORMS
        gl.uniform4fv(pyramidDiffuse, diffuseProduct );
        gl.uniform4fv(pyramidSpecular, specularProduct );
        gl.uniform4fv(pyramidLightPos, lightPosition );
        gl.uniform1f(pyramidShin, materialShininess);
        gl.uniformMatrix4fv(pyramidProjection, false, flatten(projectionMatrix));
        gl.uniform4fv(pyramidAmbient, ambientProduct);
        gl.uniformMatrix4fv(pyramidMV, false, flatten(modelViewMatrix));
        configureTexture(pyramidProgram, brickImage);
        
        gl.uniform1f(limitLocation, Math.cos(u_limit));

        // DRAW PYRAMIDS
        gl.drawArrays(gl.TRIANGLES, 0, positionsArray.length);
        
        
        
        // PYRAMID NORMALS
        gl.useProgram(pyramidProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(planeNormals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(pyramidNormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pyramidNormalLoc);

        // PYRAMID POSITIONS
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(planeCoord), gl.STATIC_DRAW);
        gl.vertexAttribPointer(pyramidPositionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pyramidPositionLoc);

        // PYRAMID TEXTURES
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidTexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
        gl.vertexAttribPointer(pyramidTexLoc, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray(pyramidTexLoc);

        // PYRAMID UNIFORMS
        gl.uniform4fv(pyramidDiffuse, diffuseProduct );
        gl.uniform4fv(pyramidSpecular, specularProduct );
        gl.uniform4fv(pyramidLightPos, lightPosition );
        gl.uniform1f(pyramidShin, materialShininess);
        gl.uniformMatrix4fv(pyramidProjection, false, flatten(projectionMatrix));
        gl.uniform4fv(pyramidAmbient, ambientProduct);
        gl.uniformMatrix4fv(pyramidMV, false, flatten(modelViewMatrix));
        configureTexture(pyramidProgram, sandImage);
        
        gl.uniform1f(limitLocation, Math.cos(u_limit));

        // DRAW PYRAMIDS
        gl.drawArrays(gl.TRIANGLES, 0, planeCoord.length);

        requestAnimationFrame(render);
    }

    document.addEventListener('keydown', function(event) {
    
        switch(event.keyCode) {
            // O key
            case 79:
                break;
            // P key
            case 80:
                break;
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
            // up arrow
            case 38:
                console.log("up arrow");
                lightPosition[0] += 0.1;
                at[0] += 0.1;
                cameraTranslation[0] += 0.1;
                break;
            // down arrow
            case 40:
                console.log("down arrow");
                lightPosition[0] -= 0.1;
                at[0] -= 0.1;
                cameraTranslation[0] -= 0.1;
                break;
            // right arrow
            case 39:
                console.log("right arrow");
                at[2] += 0.1;
                cameraTranslation[2] += 0.1;
                lightPosition[2] += 0.1;
                break;
            // left arrow
            case 37:
                console.log("left arrow");
                at[2] -= 0.1;
                cameraTranslation[2] -= 0.1;
                lightPosition[2] -= 0.1;
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

