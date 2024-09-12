import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import GUI from 'lil-gui'


/**
 * Texture
 */
const loadingManager = new THREE.LoadingManager()

loadingManager.onStart = () =>
{
    console.log('loading started')
}

loadingManager.onLoad = () =>   
{
    console.log('loading finished')
}

loadingManager.onProgress = () =>
{   
    console.log('loading progressing')
}

loadingManager.onError = () =>
{
    console.log('loading error')
}

const textureLoader = new THREE.TextureLoader(loadingManager)
const texture = textureLoader.load('./color.jpg')
texture.colorSpace = THREE.SRGBColorSpace

texture.generateMipmaps = false
texture.minFilter = THREE.NearestFilter
texture.magFilter = THREE.NearestFilter

/**
 * Debug
 */
const gui = new GUI({
    width: 300,
    title: 'Debug',
    closeFolders: true,

})

gui.hide()
window.addEventListener('keydown', (event) =>
{
    if (event.key === 'd')
    {
        gui.show(gui._hidden)
    }
})

const debugObject = {}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Object
 */
debugObject.color = 0xff0000

const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2)
// const material = new THREE.MeshBasicMaterial({color: debugObject.color, wireframe: true})
// const geometry = new THREE.SphereGeometry(0.5, 32, 32)
// const geometry = new THREE.ConeGeometry(1, 1, 32)
// const geometry = new THREE.TorusGeometry(0.3, 0.2, 32, 64)
const material = new THREE.MeshBasicMaterial({ map: texture })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const cubeTweaks = gui.addFolder('Awesome Cube')

cubeTweaks.add(mesh.position, 'y', -3, 3, 0.01).min(-3).max(3).step(0.01).name('elevation')
cubeTweaks.add(mesh.position, 'x', -3, 3, 0.01).min(-3).max(3).step(0.01).name('longitude')
cubeTweaks.add(mesh.position, 'z', -3, 3, 0.01).min(-3).max(3).step(0.01).name('latitude')

cubeTweaks.add(mesh, 'visible')
cubeTweaks.add(material, 'wireframe')

cubeTweaks
    .addColor(debugObject, 'color')
    .onChange((value) =>
    {
        material.color.set(debugObject.color)
    })
debugObject.subdivisions = 2

cubeTweaks
    .add(debugObject, 'subdivisions')
    .min(1)
    .max(5)
    .step(1)
    .onChange(() =>
    {
        mesh.geometry.dispose()
        mesh.geometry = new THREE.BoxGeometry(
        1, 1, 1, 
        debugObject.subdivisions, debugObject.subdivisions, debugObject.subdivisions
    )
    })

debugObject.spin = () =>
{
    gsap.to(mesh.rotation, { duration: 1, y: mesh.rotation.y + Math.PI * 2 })
}
cubeTweaks.add(debugObject, 'spin')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('dblclick', () =>
{
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
    if (!fullscreenElement)
    {
        if (canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
        else if (canvas.webkitRequestFullscreen)
        {
            canvas.webkitRequestFullscreen()
        }
    }
    else
    {
        if (document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        else if (document.webkitExitFullscreen)
        {
            document.webkitExitFullscreen()
        }
    }
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()