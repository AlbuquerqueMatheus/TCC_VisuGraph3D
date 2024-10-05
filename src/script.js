import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'

// Função utilitária para carregar texturas de forma assíncrona
const loadTextureAsync = (url) => {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader(loadingManager);
        loader.load(url, resolve, undefined, reject);
    });
};

// Gerenciamento de Carregamento de Textura
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = () => console.log('loading started');
loadingManager.onLoad = () => console.log('loading finished');
loadingManager.onProgress = () => console.log('loading progressing');
loadingManager.onError = () => console.log('loading error');

// Debug
const gui = new GUI({ width: 300, title: 'Debug', closeFolders: true });
gui.hide();
window.addEventListener('keydown', (event) => {
    if (event.key === 'd') gui._hidden ? gui.show() : gui.hide();
});

// Base - Canvas, Cena e Luzes
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Material e Geometria
const material = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.5 });
let geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
const mesh = new THREE.Mesh(geometry, material);
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

// Salvando os vértices originais do cubo para restaurar o tamanho quando necessário
const originalVertices = geometry.attributes.position.array.slice();

// Plano reutilizável
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true;
scene.add(plane);

// Luzes
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 3, 0);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Função para carregar textura de forma assíncrona e aplicar ao material
let texture = null; // Variável para armazenar a textura
const initTextures = async () => {
    try {
        texture = await loadTextureAsync('./color.jpg');
        material.map = texture;
        material.needsUpdate = true;
    } catch (error) {
        console.error('Erro ao carregar a textura', error);
    }
};
initTextures();

// Debug Object
const debugObject = {};
debugObject.subdivisions = 2;
debugObject.extrudeAmount = 0; // Valor inicial da extrusão
debugObject.color = 0xff0000;
debugObject.textureEnabled = true;
debugObject.opacity = 1;
debugObject.renderStyle = 'normal';
debugObject.shadows = true;
debugObject.cameraPositionZ = 3;

// **Correção aqui**: Definindo a função `spin` corretamente
debugObject.spin = () => {
    gsap.to(mesh.rotation, { duration: 1, x: mesh.rotation.x + Math.PI * 2, y: mesh.rotation.y + Math.PI * 2 });
};

// Organizando a interface em grupos
const cubePositionFolder = gui.addFolder('Cube Position');
const cubeAppearanceFolder = gui.addFolder('Cube Appearance');
const lightsFolder = gui.addFolder('Lights');
const shadowsFolder = gui.addFolder('Shadows');
const cameraFolder = gui.addFolder('Camera');
const animationsFolder = gui.addFolder('Animations');

// Grupo: Cube Position (Posicionamento do Cubo)
cubePositionFolder.add(mesh.position, 'y', -3, 3, 0.01).name('Elevation');
cubePositionFolder.add(mesh.position, 'x', -3, 3, 0.01).name('Longitude');
cubePositionFolder.add(mesh.position, 'z', -3, 3, 0.01).name('Latitude');
cubePositionFolder.add(mesh, 'visible').name('Visible');

// Grupo: Cube Appearance (Aparência do Cubo)
cubeAppearanceFolder.addColor(debugObject, 'color').name('Color').onChange(() => {
    material.color.set(debugObject.color);
    material.needsUpdate = true;
});
cubeAppearanceFolder.add(debugObject, 'opacity').min(0).max(1).step(0.01).name('Opacity').onChange(() => {
    material.opacity = debugObject.opacity;
    material.transparent = debugObject.opacity < 1;
    material.needsUpdate = true;
});
cubeAppearanceFolder.add(debugObject, 'renderStyle', ['normal', 'wireframe', 'flat']).name('Render Style').onChange(() => {
    material.wireframe = debugObject.renderStyle === 'wireframe';
    material.flatShading = debugObject.renderStyle === 'flat';
    material.needsUpdate = true;
});
cubeAppearanceFolder.add(debugObject, 'textureEnabled').name('Enable Texture').onChange(() => {
    if (debugObject.textureEnabled) {
        material.map = texture;
    } else {
        material.map = null;
    }
    material.needsUpdate = true;
});

// Grupo: Lights (Luzes)
lightsFolder.add(ambientLight, 'intensity').min(0).max(2).step(0.01).name('Ambient Light Intensity');
lightsFolder.add(directionalLight, 'intensity').min(0).max(2).step(0.01).name('Directional Light Intensity');
lightsFolder.add(directionalLight.position, 'x', -10, 10, 0.1).name('Directional Light X');
lightsFolder.add(directionalLight.position, 'y', -10, 10, 0.1).name('Directional Light Y');
lightsFolder.add(directionalLight.position, 'z', -10, 10, 0.1).name('Directional Light Z');

// Grupo: Shadows (Sombras)
shadowsFolder.add(debugObject, 'shadows').name('Enable Shadows').onChange(() => {
    mesh.castShadow = debugObject.shadows;
    plane.receiveShadow = debugObject.shadows;
});

// Grupo: Camera (Câmera)
cameraFolder.add(debugObject, 'cameraPositionZ', 1, 10, 0.1).name('Camera Position Z').onChange(() => {
    camera.position.z = debugObject.cameraPositionZ;
});

// Grupo: Animations (Animações)
animationsFolder.add(debugObject, 'spin').name('Spin');
animationsFolder.add(debugObject, 'subdivisions').min(1).max(5).step(1).name('Subdivisions').onChange(() => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(1, 1, 1, debugObject.subdivisions, debugObject.subdivisions, debugObject.subdivisions);
});
animationsFolder.add(debugObject, 'extrudeAmount').min(0).max(1).step(0.01).name('Extrude').onChange(() => {
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const originalX = originalVertices[i];
        const originalY = originalVertices[i + 1];
        const originalZ = originalVertices[i + 2];

        vertices[i] = originalX + Math.sign(originalX) * debugObject.extrudeAmount;
        vertices[i + 1] = originalY + Math.sign(originalY) * debugObject.extrudeAmount;
        vertices[i + 2] = originalZ + Math.sign(originalZ) * debugObject.extrudeAmount;
    }
    geometry.attributes.position.needsUpdate = true;
});

// Camera e Controles
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.maxPolarAngle = Math.PI / 2;

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Ajustes na tela cheia
const toggleFullScreen = () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fullscreenElement) {
        if (canvas.requestFullscreen) canvas.requestFullscreen();
        else if (canvas.webkitRequestFullscreen) canvas.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
};
window.addEventListener('dblclick', toggleFullScreen);

// Ajustes para redimensionamento da tela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Loop de animação
const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};
tick();
