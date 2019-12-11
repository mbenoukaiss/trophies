import * as Three from "./vendor/threejs/build/three.module.js";
import {OrbitControls} from "./vendor/threejs/examples/jsm/controls/OrbitControls.js";
import {Loader, Models} from "./loader.js";

const obj = {};

const scene = {
    init: () => {
        obj.container = document.createElement("div");
        obj.container.classList.add("fullscreen");
        document.body.appendChild(obj.container);

        obj.scene = new Three.Scene();
        obj.scene.background = new Three.Color(0xA0A0A0);

        obj.renderer = new Three.WebGLRenderer({antialias: true});
        obj.renderer.setPixelRatio(window.devicePixelRatio);
        obj.renderer.setSize(window.innerWidth, window.innerHeight);
        obj.renderer.shadowMap.enabled = true;
        obj.renderer.shadowMap.soft = true;
        obj.renderer.shadowMap.type = Three.PCFSoftShadowMap;
        obj.container.appendChild(obj.renderer.domElement);

        obj.camera = new Three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
        obj.camera.position.set(60, 20, 60);

        obj.sun = new Three.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
        obj.sun.position.set(100, 10, 100);
        obj.scene.add(obj.sun);

        obj.tl = new Three.PointLight(0xFFFFFF, 1);
        obj.container = new Three.Mesh(new Three.SphereGeometry(100, 100, 100), new Three.MeshPhongMaterial({
            color: new Three.Color(0x444444),
            side: Three.DoubleSide
        }));
        obj.container.receiveShadow = true;
        obj.container.add(obj.tl);
        obj.scene.add(obj.container);

        obj.plateau = new Three.Mesh(new Three.PlaneBufferGeometry(1000, 1000, 10), new Three.MeshBasicMaterial({color: 0xFFFFFF}));
        obj.plateau.receiveShadow = false;
        obj.plateau.rotation.x = -Math.PI / 2;
        obj.scene.add(obj.plateau);

        obj.shadowplane = new Three.Mesh(new Three.PlaneBufferGeometry(1000, 1000, 10), new Three.ShadowMaterial({opacity: 0.07}));
        obj.shadowplane.receiveShadow = true;
        obj.shadowplane.rotation.x = -Math.PI / 2;
        obj.scene.add(obj.shadowplane);

        Loader.then(() => {
            obj.gold_trophy = Statue.create(0xFFDF00)
                .place(10, 1, 10)
                .rotate(0, Math.PI / 4, 0)
                .show(obj.scene);

            Statue.create(0xD3D3D3)
                .place(0, 1, 30)
                .rotate(0, Math.PI / 2, 0)
                .show(obj.scene);

            Statue.create(0xCD7F32)
                .place(30, 1, 0)
                .rotate(0, 0, 0)
                .show(obj.scene);
        });

        scene.placeLights();

        //let axesHelper = new Three.AxesHelper(50);
        //obj.scene.add(axesHelper);

        obj.controls = new OrbitControls(obj.camera, obj.renderer.domElement);
        obj.controls.minDistance = 10;
        obj.controls.maxDistance = 1000;
        obj.controls.minPolarAngle = Math.PI / 4;
        obj.controls.maxPolarAngle = Math.PI / 2 - Math.PI / 12;
        obj.controls.minAzimuthAngle = Math.PI / 4 - Math.PI / 12;
        obj.controls.maxAzimuthAngle = Math.PI / 4 + Math.PI / 12;
        obj.controls.target.set(obj.scene.position.x, obj.scene.position.y, obj.scene.position.z);
        obj.controls.update();

        obj.raycaster = new Three.Raycaster();
        obj.mouse = new Three.Vector2(1, 1);
    },
    placeLights: () => {
        obj.lights = {};

        obj.lights.left = new Three.DirectionalLight(0xffffff, 1);
        obj.lights.left.castShadow = true;
        obj.lights.left.shadow.camera.top = 50;
        obj.lights.left.shadow.camera.bottom = -50;
        obj.lights.left.shadow.camera.left = -50;
        obj.lights.left.shadow.camera.right = 50;
        obj.lights.left.shadow.mapSize.width = 1024;
        obj.lights.left.shadow.mapSize.height = 1024;
        obj.lights.left.position.set(0, 50, 75);
        obj.scene.add(obj.lights.left);

        obj.lights.right = new Three.DirectionalLight(0xffffff, 1);
        obj.lights.right.castShadow = true;
        obj.lights.right.shadow.camera.top = 50;
        obj.lights.right.shadow.camera.bottom = -50;
        obj.lights.right.shadow.camera.left = -50;
        obj.lights.right.shadow.camera.right = 50;
        obj.lights.right.shadow.mapSize.width = 1024;
        obj.lights.right.shadow.mapSize.height = 1024;
        obj.lights.right.position.set(75, 50, 0);
        obj.scene.add(obj.lights.right);

        //obj.scene.add(new Three.CameraHelper(obj.lights.left.shadow.camera));
        //obj.scene.add(new Three.CameraHelper(obj.lights.right.shadow.camera));
    },
    animate: () => {
        scene.render();
        requestAnimationFrame(scene.animate);
    },
    render: () => {
        if(obj.gold_trophy !== undefined) {
            obj.raycaster.setFromCamera(obj.mouse, obj.camera);
            let intersects = obj.raycaster.intersectObjects(obj.gold_trophy.meshes());

            if(intersects.length !== 0) {
                obj.gold_trophy.disassemble();
            } else {
                obj.gold_trophy.assemble();
            }

            obj.gold_trophy.animate();
        }

        obj.renderer.render(obj.scene, obj.camera);
    },
    onWindowResize: () => {
        obj.camera.aspect = window.innerWidth / window.innerHeight;
        obj.camera.updateProjectionMatrix();
        obj.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    onMouseMove: (e) => {
        obj.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        obj.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
};

class Statue {
    trophy;

    statue;
    pedestal;
    tag;
    logos;
    text;

    position;
    rotation;

    explode = null;
    step = 0;

    constructor(color) {
        this.statue = Models.statue.clone();
        this.pedestal = {
            left: Models.leftPedestal.clone(),
            right: Models.rightPedestal.clone()
        };
        this.tag = Models.tag.clone();
        this.logos = {
            left: Models.logo.clone(),
            right: Models.logo.clone()
        };

        this.statue.traverse(function (child) {
            if (child instanceof Three.Mesh) {
                child.castShadow = true;
                child.material = new Three.MeshStandardMaterial({
                    color: color,
                    roughness: 0.6,
                    metalness: 0.9,
                    envMapIntensity: 1
                });
            }
        });

        Object.values(this.pedestal).forEach(function (pedestal) {
            pedestal.traverse(function (child) {
                if (child instanceof Three.Mesh) {
                    child.material = new Three.MeshStandardMaterial({
                        color: 0x222222,
                        roughness: 0.6,
                        metalness: 0.9,
                        envMapIntensity: 1
                    });
                }
            });
        });

        this.tag.position.y = 0.44;
        this.tag.position.z = 4.55;

        let texture = new Three.TextureLoader().load("assets/marbre.jpg");

        this.tag.traverse(function (child) {
            if (child instanceof Three.Mesh) {
                child.material = new Three.MeshBasicMaterial({map: texture});
            }
        });

        this.logos.left.position.x = -4.52;
        this.logos.left.position.y = 2.22;
        this.logos.left.position.z = 0;
        this.logos.left.rotation.z = Math.PI;

        this.logos.right.position.x = 4.52;
        this.logos.right.position.y = 2.22;
        this.logos.right.position.z = 0;

        let textGeometry = new Three.TextGeometry(Statue.getDisplayedText(), {
            font: Models.font,
            size: 1,
            height: 1,

        });

        this.text = new Three.Mesh(textGeometry, new Three.MeshLambertMaterial({color: 0x222222}));
        this.text.geometry.center();
        this.text.position.y = 2.2;
        this.text.position.z = 4.3;
    }

    static create(color) {
        return new Statue(color);
    }

    place(x, y, z) {
        this.position = {
            x: x,
            y: y,
            z: z
        };

        return this;
    }

    rotate(x, y, z) {
        this.rotation = {
            x: x,
            y: y,
            z: z
        };

        return this;
    }

    disassemble() {
        this.explode = true;
    }

    assemble() {
        this.explode = false;
    }

    animate() {
        if(this.explode !== null) {
            if (this.explode && this.step < 25) {
                if (this.step >= 0 && this.step < 20) {
                    this.tag.position.z += 0.3;
                    this.text.position.z += 0.5;
                }

                if (this.step >= 15 && this.step < 25) {
                    this.pedestal.left.position.x += 0.3;
                    this.pedestal.right.position.x -= 0.3;
                    this.logos.left.position.x -= 0.6;
                    this.logos.right.position.x += 0.6;
                }

                if (this.step >= 17 && this.step < 25) {
                    this.statue.position.y += 0.7;
                }

                this.step += 1;
            } else if(!this.explode && this.step > 0) {
                if (this.step > 0 && this.step <= 20) {
                    this.tag.position.z -= 0.3;
                    this.text.position.z -= 0.5;
                }

                if (this.step > 15 && this.step <= 25) {
                    this.pedestal.left.position.x -= 0.3;
                    this.pedestal.right.position.x += 0.3;
                    this.logos.left.position.x += 0.6;
                    this.logos.right.position.x -= 0.6;
                }

                if (this.step > 17 && this.step <= 25) {
                    this.statue.position.y -= 0.7;
                }

                this.step -= 1;
            }

            if(this.step <= 0 || this.step >= 25) {
                this.explode = null;
            }
        }
    }

    show(scene) {
        this.trophy = new Three.Group();
        this.trophy.add(this.statue);
        this.trophy.add(this.pedestal.left);
        this.trophy.add(this.pedestal.right);
        this.trophy.add(this.tag);
        this.trophy.add(this.logos.left);
        this.trophy.add(this.logos.right);
        this.trophy.add(this.text);

        this.trophy.castShadow = true;

        this.trophy.position.x = this.position.x;
        this.trophy.position.y = this.position.y;
        this.trophy.position.z = this.position.z;

        this.trophy.rotation.x = this.rotation.x;
        this.trophy.rotation.y = this.rotation.y;
        this.trophy.rotation.z = this.rotation.z;

        scene.add(this.trophy);

        return this;
    }

    meshes() {
        let meshes = [];

        for(let child of this.trophy.children) {
            if(child.children.length !== 0) {
                meshes.push(child.children[0]);
            }
        }

        return meshes;
    }

    static getDisplayedText() {
        let text = window.location.href.split("#")[1];
        return text === undefined ? "DAWIN" : text;
    }
}

window.addEventListener("resize", scene.onWindowResize, false);
window.addEventListener("mousemove", scene.onMouseMove, false);

scene.init();
scene.animate();
