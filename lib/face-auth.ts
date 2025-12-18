/**
 * Face Recognition Authentication
 * Uses face-api.js for face detection and enrollment
 */

import * as faceapi from "face-api.js"

export interface FaceDescriptor {
  userId: string
  descriptors: Float32Array[]
  label: string
  enrolledAt: number
}

const FACE_STORAGE_KEY = "spend-analyzer:faces"
const MODELS_URL = "/models"
let modelsLoaded = false

export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
  } catch {
    return false
  }
}

export async function loadFaceApiModels(): Promise<boolean> {
  if (modelsLoaded) return true

  try {
    const modelPath = `${MODELS_URL}/face-api`
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath),
    ])
    modelsLoaded = true
    console.log("[Face Auth] Models loaded successfully")
    return true
  } catch (e) {
    console.error("[Face Auth] Failed to load models:", e)
    return false
  }
}

export async function detectFaceFromVideo(videoElement: HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetectionResult }, faceapi.FaceLandmarks68>> | null> {
  try {
    if (!modelsLoaded) await loadFaceApiModels()

    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()

    return detection || null
  } catch (e) {
    console.error("[Face Auth] Face detection error:", e)
    return null
  }
}

export async function detectAllFaces(videoElement: HTMLVideoElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetectionResult }, faceapi.FaceLandmarks68>>[]> {
  try {
    if (!modelsLoaded) await loadFaceApiModels()

    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()

    return detections
  } catch (e) {
    console.error("[Face Auth] Batch face detection error:", e)
    return []
  }
}

export function cacheFaceDescriptor(userId: string, descriptor: Float32Array, label: string): void {
  try {
    const faces = JSON.parse(localStorage.getItem(FACE_STORAGE_KEY) || "[]")
    const descriptors = faces.find((f: any) => f.userId === userId)?.descriptors || []

    const serialized = {
      userId,
      descriptors: [...descriptors, Array.from(descriptor)],
      label,
      enrolledAt: Date.now(),
    }

    const index = faces.findIndex((f: any) => f.userId === userId)
    if (index >= 0) {
      faces[index] = serialized
    } else {
      faces.push(serialized)
    }

    localStorage.setItem(FACE_STORAGE_KEY, JSON.stringify(faces))
    console.log("[Face Auth] Descriptor cached for user:", userId)
  } catch (e) {
    console.warn("[Face Auth] Failed to cache descriptor:", e)
  }
}

export function getFaceDescriptors(userId: string): FaceDescriptor[] {
  try {
    const faces = JSON.parse(localStorage.getItem(FACE_STORAGE_KEY) || "[]")
    return faces
      .filter((f: any) => f.userId === userId)
      .map((f: any) => ({
        userId: f.userId,
        descriptors: f.descriptors.map((d: number[]) => new Float32Array(d)),
        label: f.label,
        enrolledAt: f.enrolledAt,
      }))
  } catch {
    return []
  }
}

export function clearFaceDescriptors(userId: string): void {
  try {
    const faces = JSON.parse(localStorage.getItem(FACE_STORAGE_KEY) || "[]")
    const filtered = faces.filter((f: any) => f.userId !== userId)
    localStorage.setItem(FACE_STORAGE_KEY, JSON.stringify(filtered))
    console.log("[Face Auth] Descriptors cleared for user:", userId)
  } catch (e) {
    console.warn("[Face Auth] Failed to clear descriptors:", e)
  }
}

export function compareFaceDescriptors(descriptor1: Float32Array, descriptor2: Float32Array, threshold: number = 0.6): number {
  return faceapi.euclideanDistance(Array.from(descriptor1), Array.from(descriptor2))
}

export function matchFace(testDescriptor: Float32Array, enrolledDescriptors: Float32Array[], threshold: number = 0.6): boolean {
  if (enrolledDescriptors.length === 0) return false

  const distances = enrolledDescriptors.map((enrolled) => compareFaceDescriptors(testDescriptor, enrolled, threshold))
  const minDistance = Math.min(...distances)

  return minDistance < threshold
}
