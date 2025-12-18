
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceProfile, getGeminiVoice } from "../types";

export const decodeBase64Audio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const createWavBlob = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint16(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmData.length, true);
  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcmData);
  return new Blob([buffer], { type: 'audio/wav' });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await sleep(delay);
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

const buildHumanLikePersonaPrompt = (profile: VoiceProfile, speed: number): string => {
  const { gender, region, age, pitch, intonation } = profile;
  const speedText = speed !== 1.0 ? ` Tốc độ đọc: ${speed}x.` : "";
  
  return `BẠN LÀ CHUYÊN GIA LỒNG TIẾNG NGƯỜI THẬT. 
Giới tính: ${gender}. Vùng miền: ${region}. Độ tuổi: ${age}. 
Tông giọng: ${pitch}. Cảm xúc: ${intonation}.
YÊU CẦU: Đọc tự nhiên, có ngắt nghỉ lấy hơi, nhấn nhá từ ngữ quan trọng. 
Tuyệt đối không đọc như máy.${speedText}`;
};

export const generateSpeech = async (
  prompt: string, 
  profile: VoiceProfile,
  speed: number = 1.0
): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const persona = buildHumanLikePersonaPrompt(profile, speed);
  const voiceName = getGeminiVoice(profile);

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `${persona}\n\nNội dung: ${prompt}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  }));

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateDialogue = async (
  lines: { speakerName: string, profile: VoiceProfile, text: string }[]
): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const conversationText = lines.map(l => `${l.speakerName}: ${l.text}`).join('\n');
  const uniqueSpeakers = Array.from(new Map(lines.map(l => [l.speakerName, l.profile])).entries());
  
  const speakerVoiceConfigs = uniqueSpeakers.slice(0, 2).map(([name, profile]) => ({
    speaker: name,
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: getGeminiVoice(profile) }
    }
  }));

  const charSettings = uniqueSpeakers.map(([name, profile]) => 
    `- ${name}: ${profile.gender}, ${profile.region}, phong cách ${profile.intonation}.`
  ).join('\n');

  const prompt = `Thực hiện đối thoại sống động như người thật. 
Nhân vật:
${charSettings}

Kịch bản:
${conversationText}`;

  const response = await callWithRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: speakerVoiceConfigs
        }
      }
    }
  }));

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
