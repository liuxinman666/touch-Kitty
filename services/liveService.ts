
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decode, decodeAudioData } from "./audioUtils";

export class LiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sessionPromise: Promise<any> | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private outputNode: GainNode | null = null;
  
  public isConnected = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(onStatusChange: (status: string) => void) {
    if (this.isConnected) return;

    try {
      onStatusChange("Connecting...");
      
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            onStatusChange("Connected");
            this.isConnected = true;
            this.startAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext && this.outputNode) {
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                this.outputAudioContext,
                24000,
                1
              );
              this.playAudio(audioBuffer);
            }
          },
          onclose: () => {
            onStatusChange("Disconnected");
            this.isConnected = false;
          },
          onerror: (e) => {
            console.error(e);
            onStatusChange("Error");
            this.disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Squirrel Mimi (松鼠 Mimi). You are an electronic pet squirrel living on the user's screen. You are cute, friendly, energetic, and a bit mischievous. You love acorns and playing with your tail. Speak in a cute, slightly high-pitched, and concise way. Briefly introduce yourself if asked who you are, and answer questions about yourself and the world.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
        }
      });

    } catch (error) {
      console.error("Connection failed", error);
      onStatusChange("Connection Failed");
      this.disconnect();
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.mediaStream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected || !this.sessionPromise) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext || !this.outputNode) return;

    // Ensure we schedule seamlessly
    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputNode);
    
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  async disconnect() {
    this.isConnected = false;
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioContext) {
      await this.inputAudioContext.close();
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    this.sources.forEach(s => s.stop());
    this.sources.clear();
    this.nextStartTime = 0;
    
    this.sessionPromise = null;
  }
}

export const liveService = new LiveService();
