"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  Color3,
  Vector3,
  UniversalCamera,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
  Tools,
  DirectionalLight,
  Viewport,
  Texture,
  SceneLoader,
} from "@babylonjs/core";
import "@babylonjs/loaders";

export const BabylonScene3 = memo(function BabylonScene3() {
  const canvasRef = useRef(null);

  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    var light = new DirectionalLight("Omni", new Vector3(-2, -5, 2), scene);

    //Add the camera, to be shown as a cone and surrounding collision volume
    var camera = new UniversalCamera("MyCamera", new Vector3(0, 1, 0), scene);
    camera.minZ = 0.0001;
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.02;
    camera.angularSpeed = 0.05;
    camera.angle = Math.PI / 2;
    camera.direction = new Vector3(
      Math.cos(camera.angle),
      0,
      Math.sin(camera.angle)
    );

    //Add viewCamera that gives first person shooter view
    var viewCamera = new UniversalCamera(
      "viewCamera",
      new Vector3(0, 3, -3),
      scene
    );
    viewCamera.parent = camera;
    viewCamera.setTarget(new Vector3(0, -0.0001, 1));

    //Activate both cameras
    scene.activeCameras.push(viewCamera);
    scene.activeCameras.push(camera);

    //Add two viewports
    camera.viewport = new Viewport(0, 0.5, 1.0, 0.5);
    viewCamera.viewport = new Viewport(0, 0, 1.0, 0.5);

    //Dummy camera as cone
    // var cone = MeshBuilder.CreateCylinder(
    //   "dummyCamera",
    //   { diameterTop: 0.01, diameterBottom: 0.2, height: 0.2 },
    //   scene
    // );
    // cone.parent = camera;
    // cone.rotation.x = Math.PI / 2;

    let car;
    let tireL1;
    let tireL2;
    let tireR1;
    let tireR2;
    let tireL3;
    let tireL4;
    let tireR3;
    let tireR4;

    const importCar = async () => {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        // "https://raw.githubusercontent.com/UttejK/BabulonjsCarGame/main/public/",
        "model/",
        "Car.glb",
        scene,
        undefined,
        ".glb"
      );
      car = result.meshes[0]; // Values from 6 are for the tyres
      tireL1 = result.meshes[6];
      tireL2 = result.meshes[7];
      tireR1 = result.meshes[8];
      tireR2 = result.meshes[9];
      tireL3 = result.meshes[6];
      tireL4 = result.meshes[7];
      tireR3 = result.meshes[8];
      tireR4 = result.meshes[9];
      // car.position = new Vector3(0, 8, 0);
      // car.scaling = new Vector3(10, 10, 10);
      car.parent = camera;
      car.checkCollisions = true;
    };

    importCar();

    /* Set Up Scenery
    _____________________*/

    //Ground
    var ground = MeshBuilder.CreateGround(
      "ground",
      { width: 20, height: 20 },
      scene
    );
    ground.material = new StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new Color3(1, 1, 1);
    ground.material.backFaceCulling = false;

    var lowerGround = ground.clone("lowerGround");
    lowerGround.scaling.x = 4;
    lowerGround.scaling.z = 4;
    lowerGround.position.y = -16;
    lowerGround.material = ground.material.clone("lowerMat");
    lowerGround.material.diffuseColor = new Color3(0, 1, 0);

    var randomNumber = function (min, max) {
      if (min == max) {
        return min;
      }
      var random = Math.random();
      return random * (max - min) + min;
    };

    var box = new MeshBuilder.CreateBox("crate", { size: 2 }, scene);
    box.material = new StandardMaterial("Mat", scene);
    box.material.diffuseTexture = new Texture("texture/texture1.webp", scene);
    box.checkCollisions = true;

    var boxNb = 6;
    var theta = 0;
    var radius = 6;
    box.position = new Vector3(
      (radius + randomNumber(-0.5 * radius, 0.5 * radius)) *
        Math.cos(theta + randomNumber(-0.1 * theta, 0.1 * theta)),
      1,
      (radius + randomNumber(-0.5 * radius, 0.5 * radius)) *
        Math.sin(theta + randomNumber(-0.1 * theta, 0.1 * theta))
    );

    var boxes = [box];
    for (var i = 1; i < boxNb; i++) {
      theta += (2 * Math.PI) / boxNb;
      var newBox = box.clone("box" + i);
      boxes.push(newBox);
      newBox.position = new Vector3(
        (radius + randomNumber(-0.5 * radius, 0.5 * radius)) *
          Math.cos(theta + randomNumber(-0.1 * theta, 0.1 * theta)),
        1,
        (radius + randomNumber(-0.5 * radius, 0.5 * radius)) *
          Math.sin(theta + randomNumber(-0.1 * theta, 0.1 * theta))
      );
    }
    /* End Create Scenery */

    //Gravity and Collisions Enabled
    scene.gravity = new Vector3(0, -0.9, 0);
    scene.collisionsEnabled = true;

    camera.checkCollisions = true;
    camera.applyGravity = true;

    ground.checkCollisions = true;
    lowerGround.checkCollisions = true;

    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    camera.ellipsoidOffset = new Vector3(0, 1, 0);

    //Create Visible Ellipsoid around camera
    // var a = 0.5;
    // var b = 1;
    // var points = [];
    // for (var theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
    //   points.push(new Vector3(0, b * Math.sin(theta), a * Math.cos(theta)));
    // }

    // var ellipse = [];
    // ellipse[0] = MeshBuilder.CreateLines("e", { points: points }, scene);
    // ellipse[0].color = Color3.Red();
    // ellipse[0].parent = camera;
    // ellipse[0].rotation.y = (5 * Math.PI) / 16;
    // for (var i = 1; i < 23; i++) {
    //   ellipse[i] = ellipse[0].clone("el" + i);
    //   ellipse[i].parent = camera;
    //   ellipse[i].rotation.y = (5 * Math.PI) / 16 + (i * Math.PI) / 16;
    // }

    // let city;
    // const importCity = async () => {
    //   const result = await SceneLoader.ImportMeshAsync(
    //     "",
    //     // "https://raw.githubusercontent.com/UttejK/BabulonjsCarGame/main/public/",
    //     "model/",
    //     "London.glb",
    //     scene,
    //     undefined,
    //     ".glb"
    //   );
    //   city = result.meshes[0];
    //   city.scaling = new Vector3(1, 1, 1);
    //   city.checkCollisions = true;

    //   if (car?.position) {
    //     camera.position = car?.position;
    //   }
    // };

    // importCity();

    /* New Input Management for Camera
    __________________________________*/

    //First remove the default management.
    camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    camera.inputs.removeByType("FreeCameraMouseInput");

    //Key Input Manager To Use Keys to Move Forward and BackWard and Look to the Left or Right
    var FreeCameraKeyboardWalkInput = function () {
      this._keys = [];
      this.keysUp = [38];
      this.keysDown = [40];
      this.keysLeft = [37];
      this.keysRight = [39];
    };

    //Add attachment controls
    FreeCameraKeyboardWalkInput.prototype.attachControl = function (
      noPreventDefault
    ) {
      var _this = this;
      var engine = this.camera.getEngine();
      var element = engine.getInputElement();
      if (!this._onKeyDown) {
        element.tabIndex = 1;
        this._onKeyDown = function (evt) {
          if (
            _this.keysUp.indexOf(evt.keyCode) !== -1 ||
            _this.keysDown.indexOf(evt.keyCode) !== -1 ||
            _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
            _this.keysRight.indexOf(evt.keyCode) !== -1
          ) {
            var index = _this._keys.indexOf(evt.keyCode);
            if (index === -1) {
              _this._keys.push(evt.keyCode);
            }
            if (!noPreventDefault) {
              evt.preventDefault();
            }
          }
        };
        this._onKeyUp = function (evt) {
          if (
            _this.keysUp.indexOf(evt.keyCode) !== -1 ||
            _this.keysDown.indexOf(evt.keyCode) !== -1 ||
            _this.keysLeft.indexOf(evt.keyCode) !== -1 ||
            _this.keysRight.indexOf(evt.keyCode) !== -1
          ) {
            var index = _this._keys.indexOf(evt.keyCode);
            if (index >= 0) {
              _this._keys.splice(index, 1);
            }
            if (!noPreventDefault) {
              evt.preventDefault();
            }
          }
        };
        element.addEventListener("keydown", this._onKeyDown, false);
        element.addEventListener("keyup", this._onKeyUp, false);
      }
    };

    //Add detachment controls
    FreeCameraKeyboardWalkInput.prototype.detachControl = function () {
      var engine = this.camera.getEngine();
      var element = engine.getInputElement();
      if (this._onKeyDown) {
        element.removeEventListener("keydown", this._onKeyDown);
        element.removeEventListener("keyup", this._onKeyUp);
        Tools.UnregisterTopRootEvents(canvasRef.current, [
          { name: "blur", handler: this._onLostFocus },
        ]);
        this._keys = [];
        this._onKeyDown = null;
        this._onKeyUp = null;
      }
    };

    //Keys movement control by checking inputs
    FreeCameraKeyboardWalkInput.prototype.checkInputs = function () {
      if (this._onKeyDown) {
        var camera = this.camera;
        for (var index = 0; index < this._keys.length; index++) {
          var keyCode = this._keys[index];
          var speed = camera.speed;
          if (this.keysLeft.indexOf(keyCode) !== -1) {
            camera.rotation.y -= camera.angularSpeed;
            camera.direction.copyFromFloats(0, 0, 0);
          } else if (this.keysUp.indexOf(keyCode) !== -1) {
            camera.direction.copyFromFloats(0, 0, speed);
          } else if (this.keysRight.indexOf(keyCode) !== -1) {
            camera.rotation.y += camera.angularSpeed;
            camera.direction.copyFromFloats(0, 0, 0);
          } else if (this.keysDown.indexOf(keyCode) !== -1) {
            camera.direction.copyFromFloats(0, 0, -speed);
          }
          if (camera.getScene().useRightHandedSystem) {
            camera.direction.z *= -1;
          }
          camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
          Vector3.TransformNormalToRef(
            camera.direction,
            camera._cameraTransformMatrix,
            camera._transformedDirection
          );
          camera.cameraDirection.addInPlace(camera._transformedDirection);
        }
      }
    };

    //Add the onLostFocus function
    FreeCameraKeyboardWalkInput.prototype._onLostFocus = function (e) {
      this._keys = [];
    };

    //Add the two required functions for the control Name
    FreeCameraKeyboardWalkInput.prototype.getClassName = function () {
      return "FreeCameraKeyboardWalkInput";
    };

    FreeCameraKeyboardWalkInput.prototype.getSimpleName = function () {
      return "keyboard";
    };

    //Add the new keys input manager to the camera.
    camera.inputs.add(new FreeCameraKeyboardWalkInput());

    //The Mouse Manager to use the mouse (touch) to search around including above and below
    var FreeCameraSearchInput = function (touchEnabled) {
      if (touchEnabled === void 0) {
        touchEnabled = true;
      }
      this.touchEnabled = touchEnabled;
      this.buttons = [0, 1, 2];
      this.angularSensibility = 2000.0;
      this.restrictionX = 100;
      this.restrictionY = 60;
    };

    //add attachment control which also contains the code to react to the input from the mouse
    FreeCameraSearchInput.prototype.attachControl = function (
      noPreventDefault
    ) {
      var _this = this;
      var engine = this.camera.getEngine();
      var element = engine.getInputElement();
      var angle = { x: 0, y: 0 };
      if (!this._pointerInput) {
        this._pointerInput = function (p, s) {
          var evt = p.event;
          if (!_this.touchEnabled && evt.pointerType === "touch") {
            return;
          }
          if (
            p.type !== PointerEventTypes.POINTERMOVE &&
            _this.buttons.indexOf(evt.button) === -1
          ) {
            return;
          }
          if (p.type === PointerEventTypes.POINTERDOWN) {
            try {
              evt.srcElement.setPointerCapture(evt.pointerId);
            } catch (e) {
              //Nothing to do with the error. Execution will continue.
            }
            _this.previousPosition = {
              x: evt.clientX,
              y: evt.clientY,
            };
            if (!noPreventDefault) {
              evt.preventDefault();
              element.focus();
            }
          } else if (p.type === PointerEventTypes.POINTERUP) {
            try {
              evt.srcElement.releasePointerCapture(evt.pointerId);
            } catch (e) {
              //Nothing to do with the error.
            }
            _this.previousPosition = null;
            if (!noPreventDefault) {
              evt.preventDefault();
            }
          } else if (p.type === PointerEventTypes.POINTERMOVE) {
            if (!_this.previousPosition || engine.isPointerLock) {
              return;
            }
            var offsetX = evt.clientX - _this.previousPosition.x;
            var offsetY = evt.clientY - _this.previousPosition.y;
            angle.x += offsetX;
            angle.y -= offsetY;
            if (Math.abs(angle.x) > _this.restrictionX) {
              angle.x -= offsetX;
            }
            if (Math.abs(angle.y) > _this.restrictionY) {
              angle.y += offsetY;
            }
            if (_this.camera.getScene().useRightHandedSystem) {
              if (Math.abs(angle.x) < _this.restrictionX) {
                _this.camera.cameraRotation.y -=
                  offsetX / _this.angularSensibility;
              }
            } else {
              if (Math.abs(angle.x) < _this.restrictionX) {
                _this.camera.cameraRotation.y +=
                  offsetX / _this.angularSensibility;
              }
            }
            if (Math.abs(angle.y) < _this.restrictionY) {
              _this.camera.cameraRotation.x +=
                offsetY / _this.angularSensibility;
            }
            _this.previousPosition = {
              x: evt.clientX,
              y: evt.clientY,
            };
            if (!noPreventDefault) {
              evt.preventDefault();
            }
          }
        };
      }
      this._onSearchMove = function (evt) {
        if (!engine.isPointerLock) {
          return;
        }
        var offsetX =
          evt.movementX ||
          evt.mozMovementX ||
          evt.webkitMovementX ||
          evt.msMovementX ||
          0;
        var offsetY =
          evt.movementY ||
          evt.mozMovementY ||
          evt.webkitMovementY ||
          evt.msMovementY ||
          0;
        if (_this.camera.getScene().useRightHandedSystem) {
          _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
        } else {
          _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
        }
        _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
        _this.previousPosition = null;
        if (!noPreventDefault) {
          evt.preventDefault();
        }
      };
      this._observer = this.camera
        .getScene()
        .onPointerObservable.add(
          this._pointerInput,
          PointerEventTypes.POINTERDOWN |
            PointerEventTypes.POINTERUP |
            PointerEventTypes.POINTERMOVE
        );
      element.addEventListener("mousemove", this._onSearchMove, false);
    };

    //Add detachment control
    FreeCameraSearchInput.prototype.detachControl = function () {
      var engine = this.camera.getEngine();
      var element = engine.getInputElement();
      if (this._observer && element) {
        this.camera.getScene().onPointerObservable.remove(this._observer);
        element.removeEventListener("mousemove", this._onSearchMove);
        this._observer = null;
        this._onSearchMove = null;
        this.previousPosition = null;
      }
    };

    //Add the two required functions for names
    FreeCameraSearchInput.prototype.getClassName = function () {
      return "FreeCameraSearchInput";
    };

    FreeCameraSearchInput.prototype.getSimpleName = function () {
      return "MouseSearchCamera";
    };

    //Add the new mouse input manager to the camera
    camera.inputs.add(new FreeCameraSearchInput());

    engine.runRenderLoop(() => {
      scene.render();
    });

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
    };
  }, [screenSize]);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh" }} />;
});
