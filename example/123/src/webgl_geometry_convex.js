import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexBufferGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import forEachTriangle from "./temp";

let group, camera, scene, renderer;


function init() {

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // camera

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 15, 20, 30 );
    scene.add( camera );

    // controls

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 20;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    scene.add( new THREE.AmbientLight( 0x222222 ) );

    // light

    const light = new THREE.PointLight( 0xffffff, 1 );
    camera.add( light );

    // helper

    scene.add( new THREE.AxesHelper( 20 ) );

    // textures

    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'https://threejs.org/examples/textures/sprites/disc.png' );

    group = new THREE.Group();
    scene.add( group );

    // points

    const vertices = new THREE.DodecahedronGeometry( 10 ).vertices;

    for ( let i = 0; i < vertices.length; i ++ ) {

        //vertices[ i ].add( randomPoint().multiplyScalar( 2 ) ); // wiggle the points

    }

    const pointsMaterial = new THREE.PointsMaterial( {

        color: 0x0080ff,
        map: texture,
        size: 1,
        alphaTest: 0.5

    } );

    const pointsGeometry = new THREE.BufferGeometry().setFromPoints( vertices );

    const points = new THREE.Points( pointsGeometry, pointsMaterial );
    group.add( points );

    // convex hull

    const meshMaterial = new THREE.MeshLambertMaterial( {
        color: 0xffffff,
        opacity: 0.5,
        transparent: true
    } );

    const meshGeometry = new ConvexBufferGeometry( vertices );

    const mesh1 = new THREE.Mesh( meshGeometry, meshMaterial );
    mesh1.material.side = THREE.BackSide; // back faces
    mesh1.renderOrder = 0;
    group.add( mesh1 );

    const mesh2 = new THREE.Mesh( meshGeometry, meshMaterial.clone() );
    mesh2.material.side = THREE.FrontSide; // front faces
    mesh2.renderOrder = 1;
    group.add( mesh2 );

    //
    forEachTriangle(pointsGeometry,(triangle)=>{
        triangle.forEach((vertex) => {

            console.log(vertex)
        })

    })
    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    group.rotation.y += 0.005;

    render();

}

function render() {

    renderer.render( scene, camera );

}
export {init,animate};
