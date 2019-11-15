import {FontLoader} from './vendor/threejs/build/three.module.js';
import {FBXLoader} from './vendor/threejs/examples/jsm/loaders/FBXLoader.js';
import * as Three from "./vendor/threejs/build/three.module.js";

let fbx_loader = new FBXLoader();
var font_loader = new FontLoader();

function loadFBX(path, destination) {
    return new Promise(function (resolve, reject) {
        fbx_loader.load(path, function (object) {
            object.traverse(function (child) {
                if (child instanceof Three.Mesh) {
                    child.castShadow = true;
                }
            });

            eval("Models." + destination + " = object;");
            resolve();
        }, null, (err) => {
            reject(err);
        });
    });
}

function loadFont(path, destination) {
    return new Promise(function (resolve, reject) {
        font_loader.load(path, function (object) {
            eval("Models." + destination + " = object;");
            resolve();
        }, null, (err) => {
            reject(err);
        });
    });
}

export var Models = {
    statue: undefined,
    leftPedestal: undefined,
    rightPedestal: undefined,
    tag: undefined,
    logo: undefined,
    font: undefined,
};

export var Loader = new Promise((resolve, reject) => {
    if (Models.statue !== undefined && Models.leftPedestal !== undefined && Models.rightPedestal !== undefined &&
        Models.tag !== undefined && Models.logo !== undefined) {
        resolve();
    } else {
        loadFBX('./assets/statuette.fbx', 'statue').then(() => {
            loadFBX('./assets/socle_gauche.fbx', 'leftPedestal').then(() => {
                loadFBX('./assets/socle_droite.fbx', 'rightPedestal').then(() => {
                    loadFBX('./assets/plaquette.fbx', 'tag').then(() => {
                        loadFBX('./assets/logo_feelity.fbx', 'logo').then(() => {
                            loadFont('./assets/helvetiker.typeface.json', 'font').then(() => {
                                resolve();
                            }).catch((e) => {
                                reject(e);
                            });
                        }).catch((e) => {
                            reject(e);
                        });
                    }).catch((e) => {
                        reject(e);
                    });
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        }).catch((e) => {
            reject(e);
        });
    }
});

