import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper to convert raw L16 PCM audio from Gemini TTS into a standard browser-playable WAV file
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const fileLength = dataLength + 36;

  // RIFF container identifier
  header.write("RIFF", 0);
  header.writeUInt32LE(fileLength, 4);
  // WAVE format signature
  header.write("WAVE", 8);
  // Format chunk header
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Chunk size: 16 bytes for PCM format
  header.writeUInt16LE(1, 20);  // Audio format: 1 (Linear PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  header.writeUInt32LE(byteRate, 28);
  
  const blockAlign = numChannels * (bitsPerSample / 8);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  
  // Data chunk header
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Helper to generate content with automatic model fallbacks if the primary model hits a rate limit or quota limit
async function generateContentWithFallback(ai: any, params: any) {
  const modelCandidates = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  let lastError: any = null;

  for (const model of modelCandidates) {
    try {
      console.log(`[Gemini Engine] Attempting generation using model: ${model}`);
      const response = await ai.models.generateContent({
        ...params,
        model: model
      });
      console.log(`[Gemini Engine] Generation successful using model: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini Engine] Model ${model} failed: ${err.message || err}`);
      lastError = err;
      // Continue to the next candidate model
    }
  }

  // If all models failed, throw the last error
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parsers with higher limits to support base64 media payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Lazy initialize the Google Gen AI client with server-side environment variable
  let aiClient: GoogleGenAI | null = null;
  const getAiClient = (): GoogleGenAI => {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is missing in secure store.");
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  };

  // Secure API Route to fetch dynamic STUN/TURN configurations from Xirsys Cloud
  app.get("/api/ice-servers", async (req, res) => {
    try {
      const ident = process.env.XIRSYS_IDENT;
      const secret = process.env.XIRSYS_SECRET;
      const channel = process.env.XIRSYS_CHANNEL || "channel009d58b6";

      if (!ident || !secret) {
        console.warn("[Xirsys Engine] Credentials not configured in secure store. Falling back to public STUN.");
        return res.json({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" }
          ]
        });
      }

      const auth = Buffer.from(`${ident}:${secret}`).toString("base64");
      const url = `https://global.xirsys.net/_turn/${channel}`;

      console.log(`[Xirsys Engine] Securely requesting ICE servers from Xirsys for channel: ${channel}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ format: "urls" })
      });

      if (!response.ok) {
        throw new Error(`Xirsys API returned status: ${response.status}`);
      }

      const data = await response.json() as any;
      if (data && data.s === "ok" && data.v && data.v.iceServers) {
        console.log("[Xirsys Engine] Successfully retrieved STUN/TURN configurations.");
        return res.json({ iceServers: data.v.iceServers });
      } else {
        throw new Error("Invalid response format received from Xirsys API");
      }
    } catch (err: any) {
      console.error("[Xirsys Engine] Request failed:", err.message || err);
      // Safe fallback to Google STUN servers
      return res.json({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" }
        ]
      });
    }
  });

  // API Route for secure neural translation, transcription, and TTS generation
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, audio, targetLanguage, generateTts } = req.body;

      if (!targetLanguage) {
        return res.status(400).json({ error: "targetLanguage is required." });
      }

      const ai = getAiClient();
      let translatedText = "";

      if (audio) {
        console.log(`Processing media audio stream for translation to: ${targetLanguage}`);
        const base64Data = audio.includes(",") ? audio.split(",")[1] : audio;
        const mimeType = audio.includes(";") ? audio.split(";")[0].split(":")[1] : "audio/wav";

        const response = await generateContentWithFallback(ai, {
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: `Listen to this audio carefully, transcribe its speech precisely, and then translate that transcription into ${targetLanguage}. Return ONLY the translated text. Do not add any conversational filler, explanations, markdown quotes, or preambles.`,
              },
            ],
          },
        });

        translatedText = response.text?.trim() || "";
      } else if (text) {
        console.log(`Processing text translation to ${targetLanguage}: "${text.substring(0, 40)}..."`);
        const response = await generateContentWithFallback(ai, {
          contents: `Translate the following text into ${targetLanguage}. Return ONLY the translated text without any quotes, preambles, or explanations:\n\n"${text}"`,
        });

        translatedText = response.text?.trim() || "";
      } else {
        return res.status(400).json({ error: "Either text or audio payload is required." });
      }

      let translatedAudioBase64 = "";

      if (generateTts && translatedText) {
        try {
          console.log(`Generating speech synthesis (TTS) in ${targetLanguage} for: "${translatedText.substring(0, 45)}..."`);
          const ttsResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: `Say this text in ${targetLanguage} clearly and naturally: ${translatedText}` }] }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Zephyr" },
                },
              },
            },
          });

          const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            const rawPcmBuffer = Buffer.from(base64Audio, "base64");
            const wavBuffer = pcmToWav(rawPcmBuffer, 24000, 1, 16);
            translatedAudioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
          }
        } catch (ttsErr: any) {
          console.warn("[Gemini TTS Engine] Speech synthesis (TTS) soft-fail:", ttsErr?.message || ttsErr);
          // Soft fail for TTS so the text translation is still returned
        }
      }

      res.json({
        translatedText,
        translatedAudio: translatedAudioBase64 || null,
      });

    } catch (error: any) {
      console.error("Translation Engine Exception:", error);
      const errorMessage = error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
      
      const isQuotaError = 
        errorMessage.includes("429") || 
        errorMessage.toLowerCase().includes("quota") || 
        errorMessage.toLowerCase().includes("resource_exhausted") ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("limit: 20") ||
        errorMessage.toLowerCase().includes("limit: 10");

      if (isQuotaError) {
        const friendlyMsg = "تم تجاوز الحد الأقصى لطلبات الترجمة المجانية من ذكاء Gemini لهذا اليوم. يرجى المحاولة لاحقاً. // Daily Gemini Translation quota limit exceeded. Please try again later.";
        return res.status(429).json({ error: friendlyMsg });
      }

      const fullError = `${errorMessage}${error?.stack ? " | Stack: " + error.stack : ""}`;
      res.status(500).json({ error: fullError });
    }
  });

  // Serve Vite in dev mode or static folder in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CryptAlko Mainframe Server] operational and listening on port ${PORT}`);
  });
}

startServer();
