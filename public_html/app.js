"use strict";

// FIDAN SAMET 21727666
// OGUZ BAKIR 21627007

var gl;
var pyramidsPositions = [];
var pyramidsNormals = [];
var texCoordsArray = [];
var planeNormals = [];
var planePositions = [vec4(0.0, 0.0, 100.0, 1.0), vec4(0.0, 0.0, 0.0, 1.0), vec4(100.0, 0.0, 0.0, 1.0),
                    vec4(100.0, 0.0, 0.0, 1.0), vec4(100.0, 0.0, 100.0, 1.0), vec4(0.0, 0.0, 100.0, 1.0)];
var texCoord = [vec2(0, 0), vec2(0.5, 1), vec2(1, 1), vec2(1, 0)];
var vertices = [vec4(-0.5, 0.0, 0.5, 1.0), vec4(0.0, 1.0, 0.0, 1.0), vec4(0.5,  0.0, 0.5, 1.0),
                    vec4(0.5,  0.0,  -0.5, 1.0), vec4(-0.5,  0.0, -0.5, 1.0)];
                
var shininess = 100.0;
var texture;
var modelViewMatrix, projectionMatrix, normalMatrix;

var phi = -9.5, theta = -2.0, radius = 5.0;
var fovy = 70.0, aspect = 1.0, near = 0.3, far = 500.0;
var eye;
var cameraTranslation = vec3(0.0, 15.0, 0.0);
var at = vec3(10.0, 0.0, 10.0);
var up = vec3(0.0, 1.0, 0.0);
var innerLimit = 10 * Math.PI/180.0;
var outerLimit = 20 * Math.PI/180.0;
var perVertexShading = 0.0;
var spotlightOn = 1.0;
var lightPosition, lightDirection, locationMat;


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
    var v1 = subtract(planePositions[2], planePositions[1]);
    var v2 = subtract(planePositions[0], planePositions[1]);
    var normal = cross(v1, v2);
    normal = vec3(normal);
    
    planeNormals.push(normal);
    planeNormals.push(normal);
    planeNormals.push(normal);
    
    v1 = subtract(planePositions[5], planePositions[4]);
    v2 = subtract(planePositions[3], planePositions[4]);
    normal = cross(v1, v2);
    normal = vec3(normal);
    
    planeNormals.push(normal);
    planeNormals.push(normal);
    planeNormals.push(normal);
}

function pyramidTriangle(a, b, c, i, j) {
    
    var v1 = subtract(getPyramidVertex(c, i, j),getPyramidVertex(b, i, j));
    var v2 = subtract(getPyramidVertex(a, i, j), getPyramidVertex(b, i, j));
    var normal = cross(v1, v2);
    normal = vec3(normal);

    pyramidsPositions.push(getPyramidVertex(a, i, j));
    texCoordsArray.push(texCoord[0]);
    pyramidsNormals.push(normal);

    pyramidsPositions.push(getPyramidVertex(b, i, j));
    texCoordsArray.push(texCoord[1]);
    pyramidsNormals.push(normal);

    pyramidsPositions.push(getPyramidVertex(c, i, j));
    texCoordsArray.push(texCoord[2]);
    pyramidsNormals.push(normal);
}

function calculatePyramidsPositions() {
    for (var i = 0; i < 25; i++) {
        for (var j = 0; j < 25; j++) {
            pyramidTriangle(1, 0, 2, i, j);
            pyramidTriangle(1, 2, 3, i, j);
            pyramidTriangle(1, 3, 4, i, j);
            pyramidTriangle(1, 4, 0, i, j);
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
    var canvas = document.getElementById("glCanvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    calculatePyramidsPositions();
    calculatePlaneNormals();

    var brickImage = document.getElementById("brickTex");
    var sandImage = document.getElementById("sandTex");

    var program = initShaderProgram(gl, vertexShader, fragmentShader);
    var normalBuffer = gl.createBuffer();
    var positionLoc = gl.getAttribLocation(program, "i_position");
    var texBuffer = gl.createBuffer();
    var normalLoc = gl.getAttribLocation(program, "i_normal");
    var vertexBuffer = gl.createBuffer();
    var texLoc = gl.getAttribLocation(program, "v_tex_coord");
    
    // UNIFORMS
    var MVLoc = gl.getUniformLocation(program, "u_model_view_matrix");
    var projectionLoc = gl.getUniformLocation(program, "u_projection_matrix");
    var normalMatrixLoc = gl.getUniformLocation(program, "u_normal_matrix");
    var viewWorldPos = gl.getUniformLocation(program, "u_view_world_position");
    var lightDirectionLoc = gl.getUniformLocation(program, "v_light_direction");
    var lightPosLoc = gl.getUniformLocation(program, "u_light_position");
    var shinLoc = gl.getUniformLocation(program, "v_shininess");
    var innerLimitLocation = gl.getUniformLocation(program, "v_inner_limit");
    var outerLimitLocation = gl.getUniformLocation(program, "v_outer_limit");
    var perVertexShadingLoc = gl.getUniformLocation(program, "v_per_vertex_shading");
    var spotlightOnLoc = gl.getUniformLocation(program, "v_spotlight_on");

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
        lightPosition = eye;
        eye = add(eye, cameraTranslation);
        modelViewMatrix = lookAt(eye, at, up);
        projectionMatrix = perspective(fovy, aspect, near, far);
        normalMatrix = transpose(inverse(modelViewMatrix));
        
        locationMat = lookAt(lightPosition, at, up);
        // get the zAxis from the matrix
        // negate it because lookAt looks down the -Z axis
        lightDirection = vec3(locationMat[2][0], locationMat[2][1], locationMat[2][2]);      // TODO eksi??
        
        // UNIFORMS
        gl.uniformMatrix4fv(MVLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
        gl.uniform4fv(viewWorldPos, vec4(cameraTranslation, 1.0) );        // TODO camera or eye?
        gl.uniform3fv(lightDirectionLoc, lightDirection);
        gl.uniform3fv(lightPosLoc, lightPosition);
        gl.uniform1f(shinLoc, shininess);
        gl.uniform1f(innerLimitLocation, Math.cos(innerLimit));
        gl.uniform1f(outerLimitLocation, Math.cos(outerLimit));
        gl.uniform1f(perVertexShadingLoc, perVertexShading);
        gl.uniform1f(spotlightOnLoc, spotlightOn);
        
        // PYRAMID POSITIONS
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramidsPositions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        // PYRAMID NORMALS
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramidsNormals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);

        // PYRAMID TEXTURES
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray(texLoc);
        configureTexture(program, brickImage);

        // DRAW PYRAMIDS
        gl.drawArrays(gl.TRIANGLES, 0, pyramidsPositions.length);
        
        // PLANE POSITIONS
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(planePositions), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);
        
        // PLANE NORMALS
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(planeNormals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);

        // PLANE TEXTURES
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray(texLoc);
        configureTexture(program, sandImage);

        // DRAW PLANE
        gl.drawArrays(gl.TRIANGLES, 0, planePositions.length);

        requestAnimationFrame(render);
    }

    document.addEventListener('keydown', function(event) {
    
        switch(event.keyCode) {
            // O key
            case 79:
                if (spotlightOn == 1.0) {
                    spotlightOn = 0.0
                } else {
                    spotlightOn = 1.0;
                }
                break;
            // P key
            case 80:
                if (perVertexShading == 1.0) {
                    perVertexShading = 0.0
                } else {
                    perVertexShading = 1.0;
                }
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
                at[0] += 0.1;
                cameraTranslation[0] += 0.1;
                break;
            // down arrow
            case 40:
                console.log("down arrow");
                at[0] -= 0.1;
                cameraTranslation[0] -= 0.1;
                break;
            // right arrow
            case 39:
                console.log("right arrow");
                at[2] += 0.1;
                cameraTranslation[2] += 0.1;
                break;
            // left arrow
            case 37:
                console.log("left arrow");
                at[2] -= 0.1;
                cameraTranslation[2] -= 0.1;
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

