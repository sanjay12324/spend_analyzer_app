"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Camera, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  cacheFaceDescriptor,
  getFaceDescriptors,
  isWebGLSupported,
  loadFaceApiModels,
  detectFaceFromVideo,
  matchFace,
} from "@/lib/face-auth"

interface FaceRecognitionModalProps {
  isLogin: boolean
  onClose: () => void
}

export function FaceRecognitionModal({ isLogin, onClose }: FaceRecognitionModalProps) {
  const [stage, setStage] = useState<"select" | "enroll" | "login">(isLogin ? "login" : "select")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isWebGLSupported()) {
      setError("WebGL not supported. Face recognition requires modern browser with WebGL support.")
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        setError(null)
      }
    } catch (err) {
      setError("Failed to access camera. Please check permissions.")
      console.error(err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return null

    try {
      const context = canvasRef.current.getContext("2d")
      if (!context) return null

      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context.drawImage(videoRef.current, 0, 0)
      return canvasRef.current.toDataURL("image/jpeg")
    } catch (err) {
      console.error("[Face Auth] Failed to capture:", err)
      return null
    }
  }

  const handleEnrollFace = async () => {
    if (!isLogin && !userName.trim()) {
      setError("Please enter your name")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!videoRef.current) {
        setError("Camera not accessible")
        return
      }

      // Load models
      const modelsLoaded = await loadFaceApiModels()
      if (!modelsLoaded) {
        setError("Failed to load face recognition models")
        return
      }

      // Detect face
      const detection = await detectFaceFromVideo(videoRef.current)
      if (!detection || !detection.descriptor) {
        setError("No face detected. Please position your face clearly.")
        return
      }

      // Get user ID from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("User not authenticated")
        return
      }

      // Cache the face descriptor
      cacheFaceDescriptor(user.id, detection.descriptor, userName || "Primary Face")

      stopCamera()
      setStage("select")
      setUserName("")
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll face")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginFace = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!videoRef.current) {
        setError("Camera not accessible")
        return
      }

      // Load models
      const modelsLoaded = await loadFaceApiModels()
      if (!modelsLoaded) {
        setError("Failed to load face recognition models")
        return
      }

      // Detect face
      const detection = await detectFaceFromVideo(videoRef.current)
      if (!detection || !detection.descriptor) {
        setError("No face detected. Please position your face clearly.")
        return
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("Please log in with email/password first to enroll face")
        return
      }

      // Get enrolled faces
      const enrolledFaces = getFaceDescriptors(user.id)
      if (enrolledFaces.length === 0) {
        setError("No faces enrolled. Please enroll your face first.")
        return
      }

      // Match against enrolled faces
      const allDescriptors = enrolledFaces.flatMap((f) => f.descriptors)
      const isMatch = matchFace(detection.descriptor, allDescriptors, 0.6)

      if (isMatch) {
        setError(null)
        stopCamera()
        onClose()
        router.push("/dashboard")
      } else {
        setError("Face does not match enrolled faces. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Face recognition failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Face Recognition Login" : "Enroll Face Recognition"}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Look at the camera to authenticate"
              : "Register your face for quick login. You can enroll multiple faces (you, your mother, etc)"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 rounded text-sm">{error}</div>}

          {cameraActive ? (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isLogin && (
                <div className="grid gap-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sanja, Mom"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={stopCamera}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={isLogin ? handleLoginFace : handleEnrollFace}
                  disabled={isLoading || (!isLogin && !userName.trim())}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {isLogin ? "Authenticate" : "Capture"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startCamera} className="w-full h-12" disabled={isLoading}>
              <Camera className="h-5 w-5 mr-2" />
              Start Camera
            </Button>
          )}

          {!isLogin && stage === "select" && (
            <div className="p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200 rounded text-sm text-center">
              ✓ Face enrolled successfully. You can enroll another face or continue.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isLogin ? "Use Email/Password" : "Skip for Now"}
          </Button>
          {!isLogin && (
            <Button onClick={() => {
              stopCamera()
              onClose()
            }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
