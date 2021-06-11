import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/GLTFLoader.js';

var mixer;
var clock = new THREE.Clock();
var firstBomb = true;
var modelX = [0, 10, 30, -30];
var modelZ = [0, 0, 10, 10];
var tankModel, buildingModel, bunkerModel, cartoonTankModel;
var bunkerRemoved,tankRemoved, buildingRemoved, cartoonTankRemoved = false;
var explode = false;
var scoreSet = false;
var scoreValue, energyBar;
var energy = 100;
var status;
var _startEngine = false;
class BasicCharacterControls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this._scene = params.scene;
    this._dropBomb = false;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._bombObject;
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._move.forward = true;
        break;
      case 65: // a
        this._move.left = true;
        break;
      case 83: // s
        this._move.backward = true;
        break;
      case 68: // d
        this._move.right = true;
        break;
      case 32:
        this._dropBomb = true;
        break;
      case 82:  //r
        this._reload = true;
        break;
      case 90:
        _startEngine = true;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 87: // w
        this._move.forward = false;
        break;
      case 65: // a
        this._move.left = false;
        break;
      case 83: // s
        this._move.backward = false;
        break;
      case 68: // d
        this._move.right = false;
        break;
      case 32:  // space
        this._dropBomb = false;
        break;
      case 82:  //r
        this._reload = false;
        break;
      case 90:
        _startEngine = true;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }
  
  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }
  _AddDebris (positionX, positionY, positionZ) {
    const loader = new GLTFLoader();
    loader.load('../resources/stone_debris/scene.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
        });
        gltf.scene.scale.set(0.01,0.01,0.01)
        gltf.scene.position.set(positionX, positionY, positionZ);
        this._scene.add(gltf.scene);
    })
  }
  _DropBomb (position) {
    const loader = new GLTFLoader();
    loader.load('../resources/bomb/scene.gltf', (gltf) => {
        gltf.scene.traverse(c => {
            c.castShadow = true;
        });
        // let position = new THREE.Vector3(0, 30, 0)
        console.log(position.x);
        // gltf.scene.scale.set(2,2,2)
        gltf.scene.position.set(position.x, position.y, position.z);
        this._scene.add(gltf.scene);
        this._bombObject = gltf.scene;
    })
  }
  _reloadBomb () {
    firstBomb = true;
  }
  UpdateBomb(timeInSeconds) {
    const bombDropVelocity = new THREE.Vector3(0, -0.5, 0);
    // const bombObject = this._bombObject;
    // bombObject.position = new THREE.Vector3();
    // bombObject.position.add(bombDropVelocity);
    this._bombObject.position.add(bombDropVelocity)
    for (let index = 0; index < 4; index++) {
      if(explode != true && this._bombObject.position.x <  modelX[index] + 5 && this._bombObject.position.x > modelX[index] - 5 && this._bombObject.position.z < modelZ[index] + 5 && this._bombObject.position.z > modelZ[index] - 5 && this._bombObject.position.y < 0) {
        console.log("hit");
        explode = true;
        this._AddDebris(modelX[index], 0, modelZ[index])
        if(index == 0 && !bunkerRemoved){
          this._scene.remove(bunkerModel)
          bunkerRemoved = true
        } 
        if(index == 1 && !tankRemoved){
          this._scene.remove(tankModel)
          tankRemoved = true
        } 
        if(index == 2 && !buildingRemoved){
          this._scene.remove(buildingModel)
          buildingRemoved = true
        } 
        if(index == 3 && !cartoonTankRemoved){
          this._scene.remove(cartoonTankModel)
          cartoonTankRemoved = true
        } 
      }
      
    }
    if(explode == true && this._bombObject.position.y > -2 && this._bombObject.position.y < 2 ) {
      scoreValue.innerHTML = parseInt(scoreValue.innerHTML) + 10;
    }
    if(this._bombObject.position.y < -10) {
      this._scene.remove(this._bombObject);
    }
  }
  Update(timeInSeconds) {
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._params.target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    if (this._move.forward) {
      velocity.z += this._acceleration.z * timeInSeconds;
    }
    if (this._move.backward) {
      velocity.z -= this._acceleration.z * timeInSeconds;
    }
    if (this._move.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._move.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    
    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);
    
    if (this._dropBomb) {
      console.log("boom!");
      explode = false;
      if (firstBomb) {
        this._DropBomb(oldPosition);
        firstBomb = false;
      }
    }
    if (this._reload) {
      this._reloadBomb();
    }
    if (_startEngine) {
      this._velocity = new THREE.Vector3(5, 0, 0);
    }
    // console.log("old position: ",oldPosition);
    const forward = new THREE.Vector3(1, 0, 0);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);
  }
}
function updateEnergy(){
  energy -= 0.01;
  energy = Math.max(0, energy);
  energyBar.style.right = (100-energy)+"%";
  energyBar.style.backgroundColor = (energy<50)? "#f25346" : "#68c3c0";

  if (energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (energy <1){
    status = "gameover";
  }
}
class BasicWorldDemo {
    constructor() {
      this._Initialize();
      scoreValue = document.getElementById("scoreValue");
      energyBar = document.getElementById("energyBar");
    }
  
    _Initialize() {
      this._threejs = new THREE.WebGLRenderer({
        antialias: true,
      });
      this._threejs.shadowMap.enabled = true;
      this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
      this._threejs.setPixelRatio(window.devicePixelRatio);
      this._threejs.setSize(window.innerWidth, window.innerHeight);
      this._threejs.setClearColor(0xff9043, 1);
      document.body.appendChild(this._threejs.domElement);
  
      window.addEventListener('resize', () => {
        this._OnWindowResize();
      }, false);
  
      const fov = 60;
      const aspect = 1920 / 1080;
      const near = 1.0;
      const far = 2000.0;
      this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this._camera.position.set(-5, 40, 0);
      //25 10 25
      // this._thirdPersonCamera = new ThirdPersonCamera({
      //   camera: this._camera,
      // })
      
      this._scene = new THREE.Scene();
      this._scene.background = new THREE.Color( "rgb(255,144,67)");
      // this._scene.fog = new THREE.Fog( "rgb(255,144,67)", 0, 100 );
      
      let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
      light.position.set(20, 100, 10);
      light.target.position.set(0, 0, 0);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 2048;
      light.shadow.mapSize.height = 2048;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 500.0;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500.0;
      light.shadow.camera.left = 100;
      light.shadow.camera.right = -100;
      light.shadow.camera.top = 100;
      light.shadow.camera.bottom = -100;
      this._scene.add(light);
  
      light = new THREE.AmbientLight(0x101010);
      this._scene.add(light);
  
      const controls = new OrbitControls(
        this._camera, this._threejs.domElement);
      controls.target.set(30, 0, 0);
      controls.update();
  
      // const loader = new THREE.CubeTextureLoader();
      // const texture = loader.load([
      //     '../resources/posx.jpg',
      //     '../resources/negx.jpg',
      //     '../resources/posy.jpg',
      //     '../resources/negy.jpg',
      //     '../resources/posz.jpg',
      //     '../resources/negz.jpg',
      // ]);
      // this._scene.background = texture;
      // this._scene.background = new THREE.Color().setHSL( 1, 0, 1 );
			// this._scene.fog = new THREE.Fog( this._scene.background, 1, 100 );
        
      var geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
      geometry.computeBoundingBox();
      var material = new THREE.ShaderMaterial({
        uniforms: {
          color1: {
            value: new THREE.Color("rgb(247,179,142)")
          },
          color2: {
            value: new THREE.Color("rgb(252,207,146)")
          },
          bboxMin: {
            value: geometry.boundingBox.min
          },
          bboxMax: {
            value: geometry.boundingBox.max
          }
        },
        vertexShader: `
          uniform vec3 bboxMin;
          uniform vec3 bboxMax;
        
          varying vec2 vUv;
      
          void main() {
            vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
        
          varying vec2 vUv;
          
          void main() {
            
            gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
          }
        `,
        wireframe: false,
      });
      const plane = new THREE.Mesh(geometry , material);
      plane.castShadow = false;
      plane.receiveShadow = true;
      plane.rotation.x = -Math.PI / 2;
      this._scene.add(plane);
      
    //   const box = new THREE.Mesh(
    //     new THREE.BoxGeometry(2, 2, 2),
    //     new THREE.MeshStandardMaterial({
    //         color: 0xFFFFFF,
    //     }));
    //   box.position.set(0, 1, 0);
    //   box.castShadow = true;
    //   box.receiveShadow = true;
    //   this._scene.add(box);
  
      // for (let x = -8; x < 8; x++) {
      //   for (let y = -8; y < 8; y++) {
      //     const box = new THREE.Mesh(
      //       new THREE.BoxGeometry(2, 2, 2),
      //       new THREE.MeshStandardMaterial({
      //           color: 0x808080,
      //       }));
      //     box.position.set(Math.random() + x * 5, Math.random() * 4.0 + 2.0, Math.random() + y * 5);
      //     box.castShadow = true;
      //     box.receiveShadow = true;
      //     this._scene.add(box);
      //   }
      // }
  
      // const box = new THREE.Mesh(
      //   new THREE.SphereGeometry(2, 32, 32),
      //   new THREE.MeshStandardMaterial({
      //       color: 0xFFFFFF,
      //       wireframe: true,
      //       wireframeLinewidth: 4,
      //   }));
      // box.position.set(0, 0, 0);
      // box.castShadow = true;
      // box.receiveShadow = true;
      // this._scene.add(box);

      this._LoadBunker();
      this._LoadTank();
      this._LoadBuilding();
      this._LoadCartoonTank();
      // this._LoadExplosion();
      // this._LoadBomb();
      this._LoadForest(30,5,-10);
      this._LoadForest(10,5,-20);
      this._LoadForest(10,5, 30);
      this._LoadForest(30,5, 30);
      this._LoadForest(-30,5,-10);
      this._LoadForest(-10,5,-20);
      this._LoadForest(-10,5, 30);
      this._LoadForest(-30,5, 30);
      this._LoadModel();
      this._RAF();
    }
    _LoadForest (positionX, positionY, positionZ) {
      const loader = new GLTFLoader();
      loader.load('../resources/trees/PUSHILIN_forest.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
          });
          const params = {
            target: gltf.scene,
            camera: this._camera,
          }
          // this._controls = new BasicCharacterControls(params);
          gltf.scene.scale.set(13,13,13)
          gltf.scene.position.set(positionX, positionY, positionZ);
          this._scene.add(gltf.scene);
      })
      
    }
    _LoadModel () {
        const loader = new GLTFLoader();
        loader.load('../resources/PUSHILIN_Plane.gltf', (gltf) => {
            gltf.scene.traverse(c => {
                c.castShadow = true;
            });
            const params = {
              target: gltf.scene,
              camera: this._camera,
              scene: this._scene,
            }
            this._controls = new BasicCharacterControls(params);
            gltf.scene.scale.set(2,2,2)
            gltf.scene.position.set(20, 30, 0);
            this._scene.add(gltf.scene);
        })
    }

    _LoadBunker () {
      const loader = new GLTFLoader();
      loader.load('../resources/bunker/bunker.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
          });
          const params = {
            target: gltf.scene,
            camera: this._camera,
          }
          // this._controls = new BasicCharacterControls(params);
          gltf.scene.scale.set(0.15,0.15,0.15)
          gltf.scene.position.set(0, 0, 0);
          bunkerModel = gltf.scene;
          this._scene.add(gltf.scene);
      })
    }

    _LoadTank () {
      const loader = new GLTFLoader();
      loader.load('../resources/tank/model.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
          });
          const params = {
            target: gltf.scene,
            camera: this._camera,
          }
          // this._controls = new BasicCharacterControls(params);
          gltf.scene.scale.set(15,15,15)
          gltf.scene.position.set(10, -15, 0);
          tankModel = gltf.scene;
          this._scene.add(gltf.scene);
      })
    }

    _LoadBuilding () {
      const loader = new GLTFLoader();
      loader.load('../resources/hut/scene.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
          });
          const params = {
            target: gltf.scene,
            camera: this._camera,
          }
          // this._controls = new BasicCharacterControls(params);
          gltf.scene.scale.set(5,5,5)
          gltf.scene.position.set(30, 5, 10);
          buildingModel = gltf.scene;
          this._scene.add(gltf.scene);
      })
    }

    _LoadCartoonTank () {
      const loader = new GLTFLoader();
      loader.load('../resources/cartoon_tank/scene.gltf', (gltf) => {
          gltf.scene.traverse(c => {
              c.castShadow = true;
          });
          const params = {
            target: gltf.scene,
            camera: this._camera,
          }
          // this._controls = new BasicCharacterControls(params);
          gltf.scene.scale.set(0.3,0.3,0.3)
          gltf.scene.position.set(-30, 10, 10);
          cartoonTankModel = gltf.scene;
          this._scene.add(gltf.scene);
      })
    }

    _LoadExplosion () {
      const loader = new GLTFLoader();
      loader.load('../resources/Fireball.glb', (gltf) => {
        var model = gltf.scene;
        mixer = new THREE.AnimationMixer(model);
        var clip1 = gltf.animations[0];
        var action1 = mixer.clipAction(clip1);
        // action1.setLoop( THREE.LoopOnce )
        action1.clampWhenFinished = true
        action1.enable = true
        action1.play();
        gltf.scene.position.set(33, 5, 10);
        this._scene.add(gltf.scene); 
      });
    }
    _OnWindowResize() {
      this._camera.aspect = window.innerWidth / window.innerHeight;
      this._camera.updateProjectionMatrix();
      this._threejs.setSize(window.innerWidth, window.innerHeight);
    }
  
    // _RAF() {
    //   requestAnimationFrame(() => {
    //     this._threejs.render(this._scene, this._camera);
    //     this._RAF();
    //   });
    // }
    _RAF() {
      requestAnimationFrame((t) => {
        if (this._previousRAF === null) {
          this._previousRAF = t;
        }
  
        this._RAF();
  
        this._threejs.render(this._scene, this._camera);
        this._Step(t - this._previousRAF);
        this._previousRAF = t;
      });
    }
  
    _Step(timeElapsed) {
      const timeElapsedS = timeElapsed * 0.001;
      const timeElapsedB = timeElapsed * 0.001;
      if (this._mixers) {
        this._mixers.map(m => m.update(timeElapsedS));
      }
  
      if (this._controls) {
        this._controls.Update(timeElapsedS);
        this._controls.UpdateBomb();
      }
      updateEnergy();
      //Explosion animation
      // var dt = clock.getDelta()
      // mixer.update(dt);
      // this._thirdPersonCamera.Update(timeElapsedS);
    }
  }
  
  
  let _APP = null;
  
  window.addEventListener('DOMContentLoaded', () => {
    _APP = new BasicWorldDemo();
  });
