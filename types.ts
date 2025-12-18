
export enum AppMode {
  SINGLE = 'Single',
  DIALOGUE = 'Dialogue'
}

export type Gender = 'Nam' | 'Nữ';
export type Region = 'Miền Bắc (Hà Nội)' | 'Miền Nam (Sài Gòn)' | 'Chuẩn (Trung lập)';
export type Age = 'Trẻ em' | 'Thanh niên' | 'Trung niên' | 'Người già';
export type Pitch = 'Trầm' | 'Trung bình' | 'Cao';
export type Intonation = 'Tự nhiên' | 'Vui vẻ' | 'Trầm buồn' | 'Trang trọng' | 'Kịch tính' | 'Hào hứng';
export type BaseVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Leda' | 'Aoede';

export interface VoiceProfile {
  gender: Gender;
  region: Region;
  age: Age;
  pitch: Pitch;
  intonation: Intonation;
  baseVoice: BaseVoice;
}

export interface Speaker {
  id: string;
  name: string;
  profile: VoiceProfile;
}

export interface DialogueLine {
  id: string;
  speakerId: string;
  text: string;
}

// Map attributes to specific Gemini voices if users want auto-selection, 
// but we'll prioritize the direct baseVoice selection now.
export const getGeminiVoice = (profile: VoiceProfile): string => {
  return profile.baseVoice;
};
