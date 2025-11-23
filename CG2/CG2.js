//Diego de la Vega Saishio - A01420632
//Este archivo utiliza 3 funciones principales y una para hacer el input:
//loadObj: Genera una figura con lados, altura, radio de abajo y radio de arriba
    //Esta función solo se utiliza si ingreso como primer argumento: 1 (generar una figura), o si no doy argumentos (genera figura predeterminada)
//loadObjInternal: Esta función recibe un arreglo con todos los argumentos generados por loadMultipleObjects, para generarlos como una sola figura
//loadMultipleObjects: Esta función genera un arreglo con todas las figuras solicitadas por el usuario y se lo manda a loadObjInternal

//Instrucciones de uso:
// 1. Ejecutar archivo: node CG2.js
// 2. Ingresar argumentos: #figuras, lados, altura, radio de abajo, radio de arriba (Estos últimos 4 argumentos se deben de ingresar por la cantidad de figuras solicitadas)
// 3. Dar clic en ENTER

//NOTAS Importantes:
//1. Si se pone 1 figura nada más (5 argumentos), genera la figura en el archivo "building.obj"
//2. Si se generan más de una figura, el resultado se ve en el archivo "multiple_building.obj"
//3. Si el usuario no manda argumentos o no se brindan los argumentos necesarios, éstos se completan con los predeterminados: 8, 6.0, 1.0, 0.8

'use strict';

//Esta función únicamente sirve para generar una figura, más adelante hay dos más que me sirven para hacer múltiples figuras
function loadObj(sides, height, lowRadius, highRadius) {
    const coordsF=[];

    //Calculo de vertices
    coordsF.push("# OBJ file buildin.obj");

    if(sides>=3 && sides<=36){
        const vertices= 360/sides;
        const coordsX= [];
        const coordsZ= [];
        const coordsY= new Array(sides).fill(0);

        const incremento= vertices*Math.PI/180;
        let ang= 0;
        for(let i=0; i<sides; i++){
            coordsX.push(lowRadius*Math.cos(ang));
            coordsZ.push(lowRadius*Math.sin(ang));
            ang+=incremento;
        }

        const coordsUpX=[];
        const coordsUpZ=[];
        const coordsUpY= new Array(sides).fill(height);

        let ang2= 0;
        for(let i=0; i<sides; i++){
            coordsUpX.push(highRadius*Math.cos(ang2));
            coordsUpZ.push(highRadius*Math.sin(ang2));
            ang2+=incremento;
        }

        //Despues de encontrar todas las coordenadas, voy a juntarlas en arrays para formatearlas
        const coordsLow=[];
        const coordsUp=[];
        for(let i=0; i<sides; i++){
            coordsLow.push("v " + coordsX[i] + " " + coordsY[i] + " " + coordsZ[i]);
            coordsUp.push("v " + coordsUpX[i] + " " + coordsUpY[i] + " " + coordsUpZ[i]);
        }

        coordsF.push("#" + " " + sides + " " + "vertices");
        coordsF.push("v " + 0.0000 + " " + 0.0000 + " " + 0.0000);
        coordsF.push("v " + 0.0000 + " " + height + " " + 0.0000);
        coordsF.push(...coordsLow);
        coordsF.push(...coordsUp);


        //Calculo de normales
        coordsF.push("#" + " " + (sides+2) + " " + "normales");
        coordsF.push("vn" + " " + 0 + " " + -1 + " " + 0);
        coordsF.push("vn" + " " + 0 + " " + 1 + " " + 0);

        for(let i=0; i<sides; i++){
            const sig= (i+1)%sides;

            //Base
            const x1= coordsX[i];
            const z1= coordsX[i];
            const x2= coordsX[sig];
            const z2= coordsX[sig];

            //Cima
            const x3= coordsUpX[i];
            const z3= coordsUpZ[i];

            //V1
            const v1x = x3 - x1;
            const v1y = height - 0;
            const v1z = z3 - z1;

            //V2
            const v2x = x2 - x1;
            const v2y = 0;
            const v2z = z2 - z1;

            // Producto cruzado
            let Nx = v1y * v2z - v1z * v2y;
            let Ny = v1z * v2x - v1x * v2z;
            let Nz = v1x * v2y - v1y * v2x;

            // Normalizar
            const length = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz);
            Nx /= length;
            Ny /= length;
            Nz /= length;

            //Agregar la normal al archivo
            coordsF.push(`vn ${Nx.toFixed(4)} ${Ny.toFixed(4)} ${Nz.toFixed(4)}`);
        }

        //Calculo de caras
        coordsF.push("#" + " " + (4 * sides) + " " + "caras");

        //Tapa de arriba
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides; //Con esta pequeña variable puedo hacer que termine con la ultima cara
            coordsF.push("f" + " " + 1 + "//" + 1 + " " + (i + 3) + "//" + 1 + " " + (next + 3) + "//" + 1);
        }

        //Tapa de abajo
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            coordsF.push("f" + " " + 2 + "//" + 2 + " " + (next + 3 + sides) + "//" + 2 + " " + (i + 3 + sides) + "//" + 2);
        }

        //Caras
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            const base1 = i + 3; //Vértice de la primera base
            const base2 = next + 3; //Vértice de la siguiente base
            const top1 = i + 3 + sides; //Primer vértice de arriba
            const top2 = next + 3 + sides; //Siguiente vértice de arriba

            //Primer triángulo
            coordsF.push("f" + " " + base1 + "//" + (i + 3) + " " + base2 + "//" + (i + 3) + " " + top2 + "//" + (i + 3));
            //Segundo triángulo
            coordsF.push("f" + " " + base1 + "//" + (i + 3) + " " + top2 + "//" + (i + 3) + " " + top1 + "//" + (i + 3));
        }

    }
    else{
        console.log("Sides must be between 3 and 36")
    }


    const fs= require('fs');
    const objContent= coordsF.join('\n');

    fs.writeFileSync('building.obj', objContent, 'utf8');

}

//Con esta otra función, puedo generar varias figuras encimadas, como una sola, recibiendo el arreglo de coordsF
function loadObjInternal(sides, height, lowRadius, highRadius, currentHeight, vertexOffset, normalOffset, coordsF, isFirst, isLast, figureNumber) {
    coordsF.push("# Figura " + figureNumber + " con " + sides + " lados");

    const vertices = 360 / sides;
    const coordsX = [];
    const coordsZ = [];

    const incremento = vertices * Math.PI / 180;
    let ang = 0;
    for (let i = 0; i < sides; i++) {
        coordsX.push(lowRadius * Math.cos(ang));
        coordsZ.push(lowRadius * Math.sin(ang));
        ang += incremento;
    }

    const coordsUpX = [];
    const coordsUpZ = [];

    let ang2 = 0;
    for (let i = 0; i < sides; i++) {
        coordsUpX.push(highRadius * Math.cos(ang2));
        coordsUpZ.push(highRadius * Math.sin(ang2));
        ang2 += incremento;
    }

    //Agrego los vértices: Primero agrego los centros y luego los vértices alternados de abajo y de arriba
    coordsF.push("v " + 0 + " " + currentHeight + " " + 0); //Centro de la base
    coordsF.push("v " + 0 + " " + (currentHeight + height) + " " + 0); //Centro de la cima
    
    for (let i = 0; i < sides; i++) {
        coordsF.push("v " + coordsX[i] + " " + currentHeight + " " + coordsZ[i]);
        coordsF.push("v " + coordsUpX[i] + " " + (currentHeight + height) + " " + coordsUpZ[i]);
    }

    //Agrego las normales
    coordsF.push("vn " + 0 + " " + -1 + " " + 0); //Normal base
    coordsF.push("vn " + 0 + " " + 1 + " " + 0);  //Normal cima
    
    for (let i = 0; i < sides; i++) {
        const sig = (i + 1) % sides;

        const x1 = coordsX[i];
        const z1 = coordsZ[i];
        const x2 = coordsX[sig];
        const z2 = coordsZ[sig];

        const x3 = coordsUpX[i];
        const z3 = coordsUpZ[i];

        const v1x = x3 - x1;
        const v1y = height;
        const v1z = z3 - z1;

        const v2x = x2 - x1;
        const v2y = 0;
        const v2z = z2 - z1;

        let Nx = v1y * v2z - v1z * v2y;
        let Ny = v1z * v2x - v1x * v2z;
        let Nz = v1x * v2y - v1y * v2x;

        const length = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz);
        Nx /= length;
        Ny /= length;
        Nz /= length;

        coordsF.push("vn " + Nx.toFixed(4) + " " + Ny.toFixed(4) + " " + Nz.toFixed(4));
    }

    //Agrego caras
    //Tapa inferior de la primera sección
    if (isFirst) {
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            const v1 = vertexOffset + 1; //Centro base
            const v2 = vertexOffset + 3 + i * 2; //Vértice de la base actual
            const v3 = vertexOffset + 3 + next * 2; //Vértice de la base siguiente
            const n = normalOffset + 1; //Normal de la base
            coordsF.push("f " + v1 + "//" + n + " " + v2 + "//" + n + " " + v3 + "//" + n);
        }
    }

    //Tapa superior en la última sección
    if (isLast) {
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            const v1 = vertexOffset + 2; //Centro de la cima
            const v2 = vertexOffset + 4 + next * 2; //Vértice de la cima siguiente
            const v3 = vertexOffset + 4 + i * 2; //Vértice de la cima actual
            const n = normalOffset + 2; //Normal de la cima
            coordsF.push("f " + v1 + "//" + n + " " + v2 + "//" + n + " " + v3 + "//" + n);
        }
    }

    //Caras laterales
    for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        const base1 = vertexOffset + 3 + i * 2; //Vértice base actual
        const base2 = vertexOffset + 3 + next * 2; //Vértice base siguiente
        const top1 = vertexOffset + 4 + i * 2; //Vértice cima actual
        const top2 = vertexOffset + 4 + next * 2; //Vértice cima siguiente
        const n = normalOffset + 3 + i; //Normal lateral correspondiente

        //Primer triángulo
        coordsF.push("f " + base1 + "//" + n + " " + base2 + "//" + n + " " + top2 + "//" + n);
        //Segundo triángulo
        coordsF.push("f " + base1 + "//" + n + " " + top2 + "//" + n + " " + top1 + "//" + n);
    }
}

//En esta función, recibo el objeto creado por la función interna loadObjInternal
//Después, simplemente voy iterando en cada una de las secciones del objeto para generar el archivo OBJ
function loadMultipleObjs(figures) {
    const coordsF = [];
    coordsF.push("# OBJ file multiple_building.obj");

    let currentHeight = 0; //Altura acumulada: Me sirve para que pueda encimar las figuras
    let vertexOffset = 0;
    let normalOffset = 0;

    for (let i = 0; i < figures.length; i++) {
        const { sides, height, lowRadius, highRadius } = figures[i];
        const isFirst = (i === 0);
        const isLast = (i === figures.length - 1);

        //Llamo a la función original para generar una figura
        const tempCoordsF = [];
        //Le agregué el i+1 para que pueda imprimir como comentario el número de figura en el OBJ
        loadObjInternal(sides, height, lowRadius, highRadius, currentHeight, vertexOffset, normalOffset, tempCoordsF, isFirst, isLast, i + 1);

        //Combina los resultados
        coordsF.push(...tempCoordsF);

        //Actualizo offsets y altura acumulada para poder hacer la siguiente figura
        vertexOffset += sides * 2 + 2;
        normalOffset += sides + 2;
        currentHeight += height;
    }

    const fs = require('fs');
    const objContent = coordsF.join('\n');
    fs.writeFileSync('multiple_building.obj', objContent, 'utf8');
}


//Utilicé IA para generar esta función que reciba los archivos porque no entendía que era necesario el slice ni el offset
//Recibe primero el número de figuras a generar, y después los argumentos de cada figura
//Lo que hace simplemente es guardarlo en el arreglo figures y devolvérselo a la función principal loadMultipleObjects
function getFiguresFromArgs() {
    const args = process.argv.slice(2);
    
    //Si no hay argumentos, utiliza los valores predeterminados
    if (args.length === 0) {
        console.log("Valores predeterminados: sides=8, height=6.0, lowRadius=1.0, highRadius=0.8");
        return [{ sides: 8, height: 6.0, lowRadius: 1.0, highRadius: 0.8 }];
    }
    
    const numFiguras = parseInt(args[0]);
    const figures = [];
    
    for (let i = 0; i < numFiguras; i++) {
        const offset = 1 + i * 4; //4 parámetros por figura
        const sides = parseInt(args[offset]) || 8;
        const height = parseFloat(args[offset + 1]) || 6.0;
        const lowRadius = parseFloat(args[offset + 2]) || 1.0;
        const highRadius = parseFloat(args[offset + 3]) || 0.8;
        
        figures.push({ sides, height, lowRadius, highRadius });
    }
    
    return figures;
}

//Llamo a la función para el input
const figures = getFiguresFromArgs();

//Si es una sola figura, uso loadObj; si son varias, uso loadMultipleObjs
if (figures.length === 1) {
    const { sides, height, lowRadius, highRadius } = figures[0];
    loadObj(sides, height, lowRadius, highRadius);
    console.log("Resultado en archivo building.obj")
} else {
    loadMultipleObjs(figures);
    console.log("Resultado en archivo multiple_building.obj")
}
