/*
 * Script to draw a complex shape in 2D
 *
 * Gilberto Echeverria
 * 2024-07-12
 */


'use strict';

import * as twgl from 'twgl-base.js';
import { M3 } from '../libs/2d-lib.js';
import GUI from 'lil-gui';

// Define the shader code, using GLSL 3.00

const vsGLSL = `#version 300 es
in vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_transforms;

void main() {
    // Multiply the matrix by the vector, adding 1 to the vector to make
    // it the correct size. Then keep only the two first components
    vec2 position = (u_transforms * vec3(a_position, 1)).xy;

    // Convert the position from pixels to 0.0 - 1.0
    vec2 zeroToOne = position / u_resolution;

    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // Convert from 0->2 to -1->1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    // Invert Y axis
    //gl_Position = vec4(clipSpace[0], clipSpace[1] * -1.0, 0, 1);
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const fsGLSL = `#version 300 es
precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
    outColor = u_color;
}
`;


//Funcion que usare para dibujar los circulos
function createCircle(sides, radius) {
    let arrays =
    {
        // Two components for each position in 2D
        a_position: { numComponents: 2, data: [] },
        // Four components for a color (RGBA)
        a_color:    { numComponents: 4, data: [] },
        // Three components for each triangle, the 3 vertices
        indices:  { numComponents: 3, data: [] }
    };

    // Initialize the center vertex, at the origin and with white color
    arrays.a_position.data.push(0);
    arrays.a_position.data.push(0);
    arrays.a_color.data.push(1);
    arrays.a_color.data.push(1);
    arrays.a_color.data.push(1);
    arrays.a_color.data.push(1);

    let angleStep = 2 * Math.PI / sides;
    // Loop over the sides to create the rest of the vertices
    for (let s=0; s<sides; s++) {
        let angle = angleStep * s;
        // Generate the coordinates of the vertex
        let x = Math.cos(angle)*radius;
        let y = Math.sin(angle)*radius;
        arrays.a_position.data.push(x);
        arrays.a_position.data.push(y);

        // Define the triangles, in counter clockwise order
        arrays.indices.data.push(0);
        arrays.indices.data.push(s + 1);
        arrays.indices.data.push(((s + 2) <= sides) ? (s + 2) : 1);
        }
        console.log(arrays);

        return arrays;
}

function caraCompleta(radiusFace, radiusEyes, radiusSmile){
    let arrays =
    {
        // Two components for each position in 2D
        a_position: { numComponents: 2, data: [] },
        // Four components for a color (RGBA)
        a_color:    { numComponents: 4, data: [] },
        // Three components for each triangle, the 3 vertices
        indices:  { numComponents: 3, data: [] }
    };
    
    let indexOffset = 0;
    
    // Cara amarilla
    let cara= createCircle(360, radiusFace);
    for(let i=0; i<cara.a_color.data.length; i+=4){
        cara.a_color.data[i]= 1;
        cara.a_color.data[i+1]= 1;
        cara.a_color.data[i+2]= 0;
        cara.a_color.data[i+3]= 1;
    }
    arrays.a_position.data.push(...cara.a_position.data);
    arrays.a_color.data.push(...cara.a_color.data);
    arrays.indices.data.push(...cara.indices.data);
    indexOffset+= (cara.a_position.data.length/2);

    // Ojo izquierdo negro
    let ojoIzq= createCircle(360, radiusEyes);
    for(let i=0; i<ojoIzq.a_color.data.length; i+=4){
        ojoIzq.a_color.data[i]= 0;
        ojoIzq.a_color.data[i+1]= 0;
        ojoIzq.a_color.data[i+2]= 0;
        ojoIzq.a_color.data[i+3]= 1;
    }
    // Posicionar ojo izquierdo
    for(let i=0; i<ojoIzq.a_position.data.length; i+=2){
        ojoIzq.a_position.data[i] += -30;
        ojoIzq.a_position.data[i+1] += -30;
    }
    // Ajustar índices
    for(let i=0; i<ojoIzq.indices.data.length; i++){
        ojoIzq.indices.data[i] += indexOffset;
    }
    arrays.a_position.data.push(...ojoIzq.a_position.data);
    arrays.a_color.data.push(...ojoIzq.a_color.data);
    arrays.indices.data.push(...ojoIzq.indices.data);
    indexOffset+= (ojoIzq.a_position.data.length/2);

    // Ojo derecho negro
    let ojoDer= createCircle(360, radiusEyes);
    for(let i=0; i<ojoDer.a_color.data.length; i+=4){
        ojoDer.a_color.data[i]= 0;
        ojoDer.a_color.data[i+1]= 0;
        ojoDer.a_color.data[i+2]= 0;
        ojoDer.a_color.data[i+3]= 1;
    }
    // Posicionar ojo derecho
    for(let i=0; i<ojoDer.a_position.data.length; i+=2){
        ojoDer.a_position.data[i] += 30;
        ojoDer.a_position.data[i+1] += -30;
    }
    // Ajustar índices
    for(let i=0; i<ojoDer.indices.data.length; i++){
        ojoDer.indices.data[i] += indexOffset;
    }
    arrays.a_position.data.push(...ojoDer.a_position.data);
    arrays.a_color.data.push(...ojoDer.a_color.data);
    arrays.indices.data.push(...ojoDer.indices.data);
    indexOffset+= (ojoDer.a_position.data.length/2);

    // Sonrisa negra
    let sonrisa= createCircle(360, radiusSmile);
    for(let i=0; i<sonrisa.a_color.data.length; i+=4){
        sonrisa.a_color.data[i]= 0;
        sonrisa.a_color.data[i+1]= 0;
        sonrisa.a_color.data[i+2]= 0;
        sonrisa.a_color.data[i+3]= 1;
    }
    // Posicionar sonrisa
    for(let i=0; i<sonrisa.a_position.data.length; i+=2){
        sonrisa.a_position.data[i] += 0;
        sonrisa.a_position.data[i+1] += 40;
    }
    // Ajustar índices
    for(let i=0; i<sonrisa.indices.data.length; i++){
        sonrisa.indices.data[i] += indexOffset;
    }
    arrays.a_position.data.push(...sonrisa.a_position.data);
    arrays.a_color.data.push(...sonrisa.a_color.data);
    arrays.indices.data.push(...sonrisa.indices.data);
    //console.log(size(arrays.indices));
    return arrays;
}

// Structure for the global data of all objects
// This data will be modified by the UI and used by the renderer
const objects = {
    model: {
        transforms: {
            t: {
                x: 0,
                y: 0,
                z: 0,
            },
            rr: {
                x: 0,
                y: 0,
                z: 0,
            },
            s: {
                x: 1,
                y: 1,
                z: 1,
            }
        },
        colors: {
            cara: [1, 1, 0, 1],
            ojoIzq: [0, 0, 0, 1],
            ojoDer: [0, 0, 0, 1],
            sonrisa: [0, 0, 0, 1],
        }
    }
}

const obj2={
    model2: {
        transforms2: {
            t: {
                x: 0,
                y: 0,
                z: 0,
            },
            r: {
                x: 0,
                y: 0,
                z: 0,
            },
            s: {
                x: 1,
                y: 1,
                z: 1,
            },
            colors: {
                pivote: [1, 0, 0, 1],
            }
        }
    }
}

// Initialize the WebGL environmnet
function main() {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    objects.model.transforms.t.x = 1000;
    objects.model.transforms.t.y = 350;

    obj2.model2.transforms2.t.x= gl.canvas.width/2;
    obj2.model2.transforms2.t.y= gl.canvas.height/2;

    const programInfo = twgl.createProgramInfo(gl, [vsGLSL, fsGLSL]);

    const arrays = caraCompleta(100, 20, 30);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);

    const arrays2= createCircle(360,15);
    const bufferInfo2= twgl.createBufferInfoFromArrays(gl, arrays2);
    const vao2= twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo2);

    objects.model.vao= vao;
    objects.model.bufferInfo= bufferInfo;

    obj2.model2.vao= vao2;
    obj2.model2.bufferInfo= bufferInfo2;

    setupUI(gl);
    drawScene(gl, programInfo);
}

// Function to do the actual display of the objects
function drawScene(gl, programInfo) {
    gl.useProgram(programInfo.program);
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let translate = [objects.model.transforms.t.x, objects.model.transforms.t.y];
    let angle_radians = objects.model.transforms.rr.z;
    let scale = [objects.model.transforms.s.x, objects.model.transforms.s.y];
    
    // Posición del pivote
    let pivotPos = [obj2.model2.transforms2.t.x, obj2.model2.transforms2.t.y];

    // Create transform matrices
    const scaMat = M3.scale(scale);
    const rotMat = M3.rotation(angle_radians);
    const traMat = M3.translation(translate);
    
    // Movimiento alrededor del pivote
    const toPivot = M3.translation([-pivotPos[0], -pivotPos[1]]);
    const fromPivot = M3.translation([pivotPos[0], pivotPos[1]]);

    // Create a composite matrix
    let transforms = M3.identity();
    transforms = M3.multiply(scaMat, transforms);
    transforms = M3.multiply(traMat, transforms);
    transforms = M3.multiply(toPivot, transforms);
    transforms = M3.multiply(rotMat, transforms);
    transforms = M3.multiply(fromPivot, transforms);

    let uniforms =
    {
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_transforms: transforms,
        u_color: objects.model.colors.cara,
    }

    gl.bindVertexArray(objects.model.vao);

    const indCir= 360*3;

    uniforms.u_color= objects.model.colors.cara;
    twgl.setUniforms(programInfo, uniforms);
    gl.drawElements(gl.TRIANGLES, indCir, gl.UNSIGNED_SHORT, 0)

    uniforms.u_color= objects.model.colors.ojoIzq;
    twgl.setUniforms(programInfo, uniforms);
    gl.drawElements(gl.TRIANGLES, indCir, gl.UNSIGNED_SHORT, indCir*2);

    uniforms.u_color= objects.model.colors.ojoDer;
    twgl.setUniforms(programInfo, uniforms);
    gl.drawElements(gl.TRIANGLES, indCir, gl.UNSIGNED_SHORT, indCir*4);
    
    uniforms.u_color= objects.model.colors.sonrisa;
    twgl.setUniforms(programInfo, uniforms);
    gl.drawElements(gl.TRIANGLES, indCir, gl.UNSIGNED_SHORT, (indCir*6));

    let translate2 = [obj2.model2.transforms2.t.x, obj2.model2.transforms2.t.y];
    let transforms2 = M3.translation(translate2);
    
    uniforms.u_transforms = transforms2;
    uniforms.u_color = obj2.model2.transforms2.colors.pivote;
    twgl.setUniforms(programInfo, uniforms);
    gl.bindVertexArray(obj2.model2.vao);
    gl.drawElements(gl.TRIANGLES, indCir, gl.UNSIGNED_SHORT, 0);
    
    requestAnimationFrame(() => drawScene(gl, programInfo));
}

function setupUI(gl)
{
    const gui = new GUI();

    const traFolder = gui.addFolder('Translation');
    traFolder.add(objects.model.transforms.t, 'x', 0, gl.canvas.width);
    traFolder.add(objects.model.transforms.t, 'y', 0, gl.canvas.height);

    const rotFolder = gui.addFolder('Rotation');
    rotFolder.add(objects.model.transforms.rr, 'z', 0, Math.PI * 2);

    const scaFolder = gui.addFolder('Scale');
    scaFolder.add(objects.model.transforms.s, 'x', -5, 5);
    scaFolder.add(objects.model.transforms.s, 'y', -5, 5);

    // Controles para el pivote
    const pivotFolder = gui.addFolder('Pivot Position');
    pivotFolder.add(obj2.model2.transforms2.t, 'x', 0, gl.canvas.width).name('Pivot X');
    pivotFolder.add(obj2.model2.transforms2.t, 'y', 0, gl.canvas.height).name('Pivot Y');
}

main()
