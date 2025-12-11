
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export class VisionService {
  private handLandmarker: HandLandmarker | null = null;
  private runningMode: "IMAGE" | "VIDEO" = "VIDEO";
  
  async initialize() {
    try {
        // Use the same version family as the import map
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: this.runningMode,
          numHands: 1
        });
        console.log("Vision Initialized");
    } catch (e) {
        console.error("Failed to init vision:", e);
        throw e;
    }
  }

  detect(video: HTMLVideoElement, startTimeMs: number) {
    if (!this.handLandmarker) return null;
    return this.handLandmarker.detectForVideo(video, startTimeMs);
  }
}

export const visionService = new VisionService();
