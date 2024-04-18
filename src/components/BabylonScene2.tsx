"use client";

import { RefObject, memo, useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  HemisphericLight,
  Color3,
  Color4,
  Vector3,
  ArcRotateCamera,
  UniversalCamera,
  FollowCamera,
  SceneLoader,
  MeshBuilder,
  AbstractMesh,
  ActionManager,
  ExecuteCodeAction,
  StandardMaterial,
  PointerEventTypes,
  FreeCamera,
  Tools,
} from "@babylonjs/core";
import "@babylonjs/loaders";

type Keyboard = {
  _keys: number[];
  keysUp: number[];
  keysDown: number[];
  keysLeft: number[];
  keysRight: number[];
};

export const BabylonScene2 = memo(function BabylonScene2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [screenSize, setScreenSize] = useState<{
    width: number;
    height: number;
  }>({
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
    if (canvasRef.current) {
      const engine = new Engine(canvasRef.current, true);
      const scene = new Scene(engine);

      scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);

      const light = new HemisphericLight(
        "light",
        new Vector3(0, 100, 0),
        scene
      );
      light.intensity = 0.9;

      const camera = new UniversalCamera("camera", new Vector3(0, 1, 0), scene);
      camera.minZ = 0.0001;
      camera.attachControl(canvasRef.current, true);
      camera.speed = 0.02;
      camera.angularSensibility = 5000;

      const viewcamera = new UniversalCamera(
        "viewcamera",
        new Vector3(0, 3, -3)
      );
      viewcamera.parent = camera;
      viewcamera.setTarget(new Vector3(0, -0.0001, 0));

      scene.activeCameras?.push(viewcamera);
      scene.activeCameras?.push(camera);

      const cone = MeshBuilder.CreateCylinder(
        "dummycamera",
        { diameterTop: 0.01, diameterBottom: 0.2, height: 0.2 },
        scene
      );
      cone.parent = camera;
      cone.rotation.x = Math.PI / 2;

      const ground = MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
      );
      ground.material = new StandardMaterial("groundMat", scene);
      ground.material.backFaceCulling = false;

      const lowerGround = ground.clone("lowerGround");
      lowerGround.scaling.x = 4;
      lowerGround.scaling.y = -16;
      lowerGround.scaling.z = 4;
      lowerGround.material = ground.material.clone("lowerMat");

      const randomNumber = function (min: number, max: number) {
        if (min === max) {
          return min;
        }
        const random = Math.random();
        return random * (max - min) + max;
      };

      const box = MeshBuilder.CreateBox("crate", { size: 2 }, scene);
      box.material = new StandardMaterial("Mat", scene);
      box.checkCollisions = true;

      const boxNb = 6;
      let theta = 0;
      const radius = 6;
      box.position = new Vector3(
        (radius + randomNumber(-0.5 * radius, 0.5 * radius)) *
          Math.cos(theta + randomNumber(-0.1 * theta, 0.1 * theta)),
        1,
        (radius + randomNumber(-0.5 * radius, 0.5 * radius)) *
          Math.sin(theta + randomNumber(-0.1 * theta, 0.1 * theta))
      );

      const boxes = [box];
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

      scene.gravity = new Vector3(0, -0.9, 0);
      scene.collisionsEnabled = true;

      camera.checkCollisions = true;
      camera.applyGravity = true;

      ground.checkCollisions = true;
      lowerGround.checkCollisions = true;

      camera.ellipsoid = new Vector3(0.5, 1, 0.5);
      camera.ellipsoidOffset = new Vector3(0, 1, 0);

      const a = 0.5;
      const b = 1;
      let points = [];
      for (theta = -Math.PI / 2; theta < Math.PI / 2; theta += Math.PI / 36) {
        points.push(new Vector3(0, b * Math.sin(theta), a * Math.cos(theta)));
      }

      let ellipse = [];
      ellipse[0] = MeshBuilder.CreateLines("e", { points: points }, scene);
      ellipse[0].color = Color3.Red();
      ellipse[0].parent = camera;
      ellipse[0].rotation.y = (5 * Math.PI) / 16;
      for (var i = 1; i < 23; i++) {
        ellipse[i] = ellipse[0].clone("el" + i);
        ellipse[i].parent = camera;
        ellipse[i].rotation.y = (5 * Math.PI) / 16 + (i * Math.PI) / 16;
      }

      camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
      camera.inputs.removeByType("FreeCameraMouseInput");

      const FreeCameraKeyboardWalkInput = function (this: Keyboard) {
        this._keys = [];
        this.keysUp = [38];
        this.keysDown = [40];
        this.keysLeft = [37];
        this.keysRight = [39];
      };

      FreeCameraKeyboardWalkInput.prototype.attachControl = function (
        noPreventDefault: any
      ) {
        var _this = this;
        var engine = this.camera.getEngine();
        var element = engine.getInputElement();
        if (!this._onKeyDown) {
          element.tabIndex = 1;
          this._onKeyDown = function (evt: {
            keyCode: string;
            preventDefault: () => void;
          }) {
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
          this._onKeyUp = function (evt: {
            keyCode: string;
            preventDefault: () => void;
          }) {
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
      // FreeCameraKeyboardWalkInput.prototype.detachControl = function () {
      //   var engine = this.camera.getEngine();
      //   var element = engine.getInputElement();
      //   if (this._onKeyDown) {
      //     element.removeEventListener("keydown", this._onKeyDown);
      //     element.removeEventListener("keyup", this._onKeyUp);
      //     Tools.UnregisterTopRootEvents(canvas, [
      //       { name: "blur", handler: this._onLostFocus },
      //     ]);
      //     this._keys = [];
      //     this._onKeyDown = null;
      //     this._onKeyUp = null;
      //   }
      // };

      // //Keys movement control by checking inputs
      // FreeCameraKeyboardWalkInput.prototype.checkInputs = function () {
      //   if (this._onKeyDown) {
      //     var camera = this.camera;
      //     for (var index = 0; index < this._keys.length; index++) {
      //       var keyCode = this._keys[index];
      //       var speed = camera.speed;
      //       if (this.keysLeft.indexOf(keyCode) !== -1) {
      //         camera.rotation.y -= camera.angularSpeed;
      //         camera.direction.copyFromFloats(0, 0, 0);
      //       } else if (this.keysUp.indexOf(keyCode) !== -1) {
      //         camera.direction.copyFromFloats(0, 0, speed);
      //       } else if (this.keysRight.indexOf(keyCode) !== -1) {
      //         camera.rotation.y += camera.angularSpeed;
      //         camera.direction.copyFromFloats(0, 0, 0);
      //       } else if (this.keysDown.indexOf(keyCode) !== -1) {
      //         camera.direction.copyFromFloats(0, 0, -speed);
      //       }
      //       if (camera.getScene().useRightHandedSystem) {
      //         camera.direction.z *= -1;
      //       }
      //       camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
      //       Vector3.TransformNormalToRef(
      //         camera.direction,
      //         camera._cameraTransformMatrix,
      //         camera._transformedDirection
      //       );
      //       camera.cameraDirection.addInPlace(camera._transformedDirection);
      //     }
      //   }
      // };

      // //Add the onLostFocus function
      // FreeCameraKeyboardWalkInput.prototype._onLostFocus = function (e) {
      //   this._keys = [];
      // };

      // //Add the two required functions for the control Name
      // FreeCameraKeyboardWalkInput.prototype.getClassName = function () {
      //   return "FreeCameraKeyboardWalkInput";
      // };

      // FreeCameraKeyboardWalkInput.prototype.getSimpleName = function () {
      //   return "keyboard";
      // };

      // //Add the new keys input manager to the camera.
      // camera.inputs.add(new FreeCameraKeyboardWalkInput());

      // //The Mouse Manager to use the mouse (touch) to search around including above and below
      // var FreeCameraSearchInput = function (touchEnabled) {
      //   if (touchEnabled === void 0) {
      //     touchEnabled = true;
      //   }
      //   this.touchEnabled = touchEnabled;
      //   this.buttons = [0, 1, 2];
      //   this.angularSensibility = 2000.0;
      //   this.restrictionX = 100;
      //   this.restrictionY = 60;
      // };

      // //add attachment control which also contains the code to react to the input from the mouse
      // FreeCameraSearchInput.prototype.attachControl = function (
      //   noPreventDefault
      // ) {
      //   var _this = this;
      //   var engine = this.camera.getEngine();
      //   var element = engine.getInputElement();
      //   var angle = { x: 0, y: 0 };
      //   if (!this._pointerInput) {
      //     this._pointerInput = function (p, s) {
      //       var evt = p.event;
      //       if (!_this.touchEnabled && evt.pointerType === "touch") {
      //         return;
      //       }
      //       if (
      //         p.type !== PointerEventTypes.POINTERMOVE &&
      //         _this.buttons.indexOf(evt.button) === -1
      //       ) {
      //         return;
      //       }
      //       if (p.type === PointerEventTypes.POINTERDOWN) {
      //         try {
      //           evt.srcElement.setPointerCapture(evt.pointerId);
      //         } catch (e) {
      //           //Nothing to do with the error. Execution will continue.
      //         }
      //         _this.previousPosition = {
      //           x: evt.clientX,
      //           y: evt.clientY,
      //         };
      //         if (!noPreventDefault) {
      //           evt.preventDefault();
      //           element.focus();
      //         }
      //       } else if (p.type === PointerEventTypes.POINTERUP) {
      //         try {
      //           evt.srcElement.releasePointerCapture(evt.pointerId);
      //         } catch (e) {
      //           //Nothing to do with the error.
      //         }
      //         _this.previousPosition = null;
      //         if (!noPreventDefault) {
      //           evt.preventDefault();
      //         }
      //       } else if (p.type === PointerEventTypes.POINTERMOVE) {
      //         if (!_this.previousPosition || engine.isPointerLock) {
      //           return;
      //         }
      //         var offsetX = evt.clientX - _this.previousPosition.x;
      //         var offsetY = evt.clientY - _this.previousPosition.y;
      //         angle.x += offsetX;
      //         angle.y -= offsetY;
      //         if (Math.abs(angle.x) > _this.restrictionX) {
      //           angle.x -= offsetX;
      //         }
      //         if (Math.abs(angle.y) > _this.restrictionY) {
      //           angle.y += offsetY;
      //         }
      //         if (_this.camera.getScene().useRightHandedSystem) {
      //           if (Math.abs(angle.x) < _this.restrictionX) {
      //             _this.camera.cameraRotation.y -=
      //               offsetX / _this.angularSensibility;
      //           }
      //         } else {
      //           if (Math.abs(angle.x) < _this.restrictionX) {
      //             _this.camera.cameraRotation.y +=
      //               offsetX / _this.angularSensibility;
      //           }
      //         }
      //         if (Math.abs(angle.y) < _this.restrictionY) {
      //           _this.camera.cameraRotation.x +=
      //             offsetY / _this.angularSensibility;
      //         }
      //         _this.previousPosition = {
      //           x: evt.clientX,
      //           y: evt.clientY,
      //         };
      //         if (!noPreventDefault) {
      //           evt.preventDefault();
      //         }
      //       }
      //     };
      //   }
      //   this._onSearchMove = function (evt) {
      //     if (!engine.isPointerLock) {
      //       return;
      //     }
      //     var offsetX =
      //       evt.movementX ||
      //       evt.mozMovementX ||
      //       evt.webkitMovementX ||
      //       evt.msMovementX ||
      //       0;
      //     var offsetY =
      //       evt.movementY ||
      //       evt.mozMovementY ||
      //       evt.webkitMovementY ||
      //       evt.msMovementY ||
      //       0;
      //     if (_this.camera.getScene().useRightHandedSystem) {
      //       _this.camera.cameraRotation.y -= offsetX / _this.angularSensibility;
      //     } else {
      //       _this.camera.cameraRotation.y += offsetX / _this.angularSensibility;
      //     }
      //     _this.camera.cameraRotation.x += offsetY / _this.angularSensibility;
      //     _this.previousPosition = null;
      //     if (!noPreventDefault) {
      //       evt.preventDefault();
      //     }
      //   };
      //   this._observer = this.camera
      //     .getScene()
      //     .onPointerObservable.add(
      //       this._pointerInput,
      //       PointerEventTypes.POINTERDOWN |
      //         PointerEventTypes.POINTERUP |
      //         PointerEventTypes.POINTERMOVE
      //     );
      //   element.addEventListener("mousemove", this._onSearchMove, false);
      // };

      // //Add detachment control
      // FreeCameraSearchInput.prototype.detachControl = function () {
      //   var engine = this.camera.getEngine();
      //   var element = engine.getInputElement();
      //   if (this._observer && element) {
      //     this.camera.getScene().onPointerObservable.remove(this._observer);
      //     element.removeEventListener("mousemove", this._onSearchMove);
      //     this._observer = null;
      //     this._onSearchMove = null;
      //     this.previousPosition = null;
      //   }
      // };

      // //Add the two required functions for names
      // FreeCameraSearchInput.prototype.getClassName = function () {
      //   return "FreeCameraSearchInput";
      // };

      // FreeCameraSearchInput.prototype.getSimpleName = function () {
      //   return "MouseSearchCamera";
      // };

      // //Add the new mouse input manager to the camera
      // camera.inputs.add(new FreeCameraSearchInput());

      engine.runRenderLoop(() => {
        scene.render();
      });

      return () => {
        engine.stopRenderLoop();
        scene.dispose();
      };
    }
  }, [screenSize]);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh" }} />;
});
