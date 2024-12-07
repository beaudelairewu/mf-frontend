// src/utils/sceneSetup.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class SceneSetup {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationId = null;
  }

  init() {
    if (!this.container) return null;

    // Clear existing content
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1d21);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45, // Reduced FOV for better perspective
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(5, 5, 5); // Better initial camera position

    // Renderer with physically correct lighting
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      physicallyCorrectLights: true // Enable physically correct lighting
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.setupLights();
    this.setupEnvironment();
    this.setupHelpers();
    this.startAnimation();

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));

    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls
    };
  }

  setupLights() {
    // Ambient light for basic illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    // Key light (main directional light)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 100;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 3, 0);
    this.scene.add(fillLight);

    // Rim light for highlighting edges
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -2, -5);
    this.scene.add(rimLight);

    // Ground bounce light
    const bounceLight = new THREE.DirectionalLight(0xffffff, 0.2);
    bounceLight.position.set(0, -5, 0);
    this.scene.add(bounceLight);
  }

  setupEnvironment() {
    // Create a simple environment map
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a basic environment
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x444444);
    const envLight = new THREE.DirectionalLight(0xffffff, 1);
    envLight.position.set(1, 1, 1);
    envScene.add(envLight);

    // Generate environment map
    const envMap = pmremGenerator.fromScene(envScene).texture;
    this.scene.environment = envMap;
    
    pmremGenerator.dispose();
  }

  setupHelpers() {
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    this.scene.add(gridHelper);
  }

  startAnimation() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  handleResize() {
    if (!this.container || !this.camera || !this.renderer) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }

    window.removeEventListener('resize', this.handleResize.bind(this));

    // Dispose of all meshes and materials in the scene
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  }
}