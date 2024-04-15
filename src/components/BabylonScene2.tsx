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
} from "@babylonjs/core";
import "@babylonjs/loaders";

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
    }
  }, [screenSize]);

  return <canvas ref={canvasRef} style={{ width: "100vw", height: "100vh" }} />;
});
