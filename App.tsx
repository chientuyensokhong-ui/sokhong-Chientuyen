
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Settings, Play, Download, Trash2, Plus, Volume2, MessageSquare, User, FileText, Loader2, Info, Sparkles, HeartPulse, Mic2, Wifi, WifiOff, ShieldCheck, Zap, BarChart3, Headphones } from 'lucide-react';
import { AppMode, Speaker, DialogueLine, VoiceProfile, Gender, Region, Age, Pitch, Intonation, BaseVoice } from './types';
import { generateSpeech, generateDialogue, decodeBase64Audio, createWavBlob } from './services/tts';

const GENDERS: Gender[] = ['Nam', 'Nữ'];
const REGIONS: Region[] = ['Miền Bắc (Hà Nội)', 'Miền Nam (Sài Gòn)', 'Chuẩn (Trung lập)'];
const AGES: Age[] = ['Trẻ em', 'Thanh niên', 'Trung niên', 'Người già'];
const PITCHES: Pitch[] = ['Trầm', 'Trung bình', 'Cao'];
const INTONATIONS: Intonation[] = ['Tự nhiên', 'Vui vẻ', 'Trầm buồn', 'Trang trọng', 'Kịch tính', 'Hào hứng'];
const BASE_VOICES: BaseVoice[] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'Leda', 'Aoede'];

const DEFAULT_PROFILE: VoiceProfile = {
  gender: 'Nam',
  region: 'Miền Bắc (Hà Nội)',
  age: 'Thanh niên',
  pitch: 'Trung bình',
  intonation: 'Tự nhiên',
  baseVoice: 'Kore'
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SINGLE);
  const [speed, setSpeed] = useState(1.0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [singleProfile, setSingleProfile] = useState<VoiceProfile>(DEFAULT_PROFILE);
  const [singleText, setSingleText] = useState("Chào mừng bạn đến với phiên bản Pro. Hệ thống đang hoạt động ở chế độ ưu tiên cao nhất, cho phép bạn tạo giọng nói chất lượng cao với tốc độ nhanh và không giới hạn.");
  
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: '1', name: 'Nhân vật Nam', profile: { ...DEFAULT_PROFILE, gender: 'Nam', baseVoice: 'Kore', intonation: 'Tự nhiên' } },
    { id: '2', name: 'Nhân vật Nữ', profile: { ...DEFAULT_PROFILE, gender: 'Nữ', baseVoice: 'Leda', intonation: 'Trang trọng', region: 'Miền Nam (Sài Gòn)' } },
  ]);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([
    { id: '1', speakerId: '1', text: 'Đây là bản kịch bản dành cho tài khoản Pro của bạn.' },
    { id: '2', speakerId: '2', text: 'Tuyệt vời, tốc độ phản hồi và chất lượng giọng nói thật sự rất khác biệt.' },
  ]);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'raw'>('builder');

  const charCount = useMemo(() => {
    if (mode === AppMode.SINGLE) return singleText.length;
    return dialogue.reduce((acc, line) => acc + line.text.length, 0);
  }, [mode, singleText, dialogue]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handlePreview = async (profile: VoiceProfile, sourceId: string) => {
    if (!isOnline) return alert("Cần kết nối mạng để nghe thử.");
    setPreviewLoading(sourceId);
    try {
      const sampleText = "Đây là mẫu giọng đọc thực tế của tôi.";
      const base64 = await generateSpeech(sampleText, profile, 1.0);
      if (base64) {
        const pcmData = decodeBase64Audio(base64);
        const blob = createWavBlob(pcmData);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
      }
    } catch (error: any) {
      console.error("Preview failed", error);
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleConvert = async () => {
    if (!isOnline) return;
    setLoading(true);
    setAudioUrl(null);
    try {
      let base64: string | undefined;
      if (mode === AppMode.SINGLE) {
        base64 = await generateSpeech(singleText, singleProfile, speed);
      } else {
        const dialogueData = dialogue.map(line => {
          const speaker = speakers.find(s => s.id === line.speakerId);
          return {
            speakerName: speaker?.name || "Người nói",
            profile: speaker?.profile || DEFAULT_PROFILE,
            text: line.text
          };
        });
        base64 = await generateDialogue(dialogueData);
      }

      if (base64) {
        const pcmData = decodeBase64Audio(base64);
        setAudioUrl(URL.createObjectURL(createWavBlob(pcmData)));
      }
    } catch (error: any) {
      alert(`Lỗi hệ thống: ${error.message || "Không thể kết nối API"}`);
    } finally {
      setLoading(false);
    }
  };

  const ProfileSelector = ({ profile, onChange, onPreview, isPreviewing }: { 
    profile: VoiceProfile, 
    onChange: (p: VoiceProfile) => void,
    onPreview: () => void,
    isPreviewing: boolean 
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-500">Giọng gốc</label>
          <select value={profile.baseVoice} onChange={(e) => onChange({ ...profile, baseVoice: e.target.value as BaseVoice })} className="w-full bg-[#0E1117] border border-gray-700 text-[#FFD700] rounded-lg px-2 py-1.5 text-xs focus:border-[#FFD700] outline-none transition-all">
            {BASE_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-500">Ngữ điệu</label>
          <select value={profile.intonation} onChange={(e) => onChange({ ...profile, intonation: e.target.value as Intonation })} className="w-full bg-[#0E1117] border border-gray-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none">
            {INTONATIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-gray-500">Vùng miền</label>
          <select value={profile.region} onChange={(e) => onChange({ ...profile, region: e.target.value as Region })} className="w-full bg-[#0E1117] border border-gray-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none">
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <button 
        onClick={onPreview} 
        disabled={isPreviewing}
        className="w-full py-2 bg-gray-800/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-700 transition-all disabled:opacity-50"
      >
        {isPreviewing ? <Loader2 size={12} className="animate-spin" /> : <Headphones size={12} />}
        {isPreviewing ? "ĐANG TẠO MẪU..." : "NGHE THỬ GIỌNG NÀY"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1117] text-gray-200">
      <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161B22] shadow-2xl z-30">
        <div className="flex items-center gap-3">
          <div className="bg-[#FFD700] p-1.5 rounded-lg">
            <Zap className="text-[#0E1117]" size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tighter uppercase italic flex items-center gap-2">
              TTS MASTER <span className="bg-white/10 text-[#FFD700] px-2 py-0.5 rounded text-[10px] not-italic border border-[#FFD700]/30">PRO PLAN</span>
            </h1>
            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Enterprise Human AI Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase">
            <ShieldCheck size={12} /> API Security Active
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${isOnline ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {isOnline ? <><Wifi size={12} /> Connected</> : <><WifiOff size={12} /> Offline</>}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-[#161B22] border-r border-gray-800 p-5 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14} /> Trạng thái sử dụng
            </label>
            <div className="p-4 bg-[#0E1117] border border-gray-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400">Độ dài văn bản:</span>
                <span className="text-xs font-mono text-[#FFD700]">{charCount.toLocaleString()} KT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400">Ước tính (Pro):</span>
                <span className="text-xs font-mono text-green-400">Unlimited</span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <div className="bg-[#FFD700] h-full" style={{ width: `${Math.min((charCount/5000)*100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Chế độ vận hành</label>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => setMode(AppMode.SINGLE)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-xs font-black uppercase ${mode === AppMode.SINGLE ? 'bg-[#FFD700] border-[#FFD700] text-[#0E1117] shadow-lg shadow-[#FFD700]/10' : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                <Volume2 size={16} /> Đơn thoại
              </button>
              <button onClick={() => setMode(AppMode.DIALOGUE)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-xs font-black uppercase ${mode === AppMode.DIALOGUE ? 'bg-[#FFD700] border-[#FFD700] text-[#0E1117] shadow-lg shadow-[#FFD700]/10' : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                <MessageSquare size={16} /> Đối thoại chuyên sâu
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Tốc độ tự nhiên ({speed}x)</label>
            <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-[#FFD700] cursor-pointer" />
          </div>

          <div className="mt-auto pt-6">
             <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-2xl border border-gray-700">
                <div className="flex items-center gap-2 text-white font-bold text-xs mb-2">
                  <HeartPulse size={14} className="text-[#FFD700]" /> Realism Engine
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed italic">"Phiên bản Pro sử dụng thuật toán ngắt nghỉ đa tầng, tạo cảm giác hơi thở và nhịp điệu giống người thật 99%."</p>
             </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          <section className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-gray-800 bg-[#0E1117]">
            <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#FFD700]/30 group-hover:bg-[#FFD700] transition-all"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase text-gray-400 tracking-widest"><Settings size={14} /> Studio Configuration</div>
                <div className="text-[10px] font-mono text-gray-500">{charCount} CHARS</div>
              </div>

              {mode === AppMode.SINGLE ? (
                <ProfileSelector 
                  profile={singleProfile} 
                  onChange={setSingleProfile} 
                  onPreview={() => handlePreview(singleProfile, 'single')}
                  isPreviewing={previewLoading === 'single'}
                />
              ) : (
                <div className="space-y-4">
                  {speakers.map((s, idx) => (
                    <div key={s.id} className="p-4 bg-[#0E1117]/50 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-[#FFD700] uppercase italic tracking-wider flex items-center gap-2"><User size={12} /> {s.name}</span>
                        <input value={s.name} onChange={(e) => {
                          const ns = [...speakers];
                          ns[idx].name = e.target.value;
                          setSpeakers(ns);
                        }} className="bg-transparent border-b border-gray-800 text-xs text-right outline-none focus:border-[#FFD700] transition-all" />
                      </div>
                      <ProfileSelector 
                        profile={s.profile} 
                        onChange={(p) => {
                          const ns = [...speakers];
                          ns[idx].profile = p;
                          setSpeakers(ns);
                        }} 
                        onPreview={() => handlePreview(s.profile, s.id)}
                        isPreviewing={previewLoading === s.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#161B22] border border-gray-800 rounded-3xl flex flex-col h-[400px] shadow-2xl overflow-hidden">
               <div className="flex border-b border-gray-800 bg-[#1F242D]">
                 <button onClick={() => setActiveTab('builder')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'builder' ? 'bg-[#0E1117] text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-gray-500 hover:text-gray-300'}`}>Visual Editor</button>
                 <button onClick={() => setActiveTab('raw')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'raw' ? 'bg-[#0E1117] text-[#FFD700] border-b-2 border-[#FFD700]' : 'text-gray-500 hover:text-gray-300'}`}>Source Script</button>
               </div>
               <div className="flex-1 p-8 overflow-y-auto">
                 {activeTab === 'builder' ? (
                   mode === AppMode.SINGLE ? (
                     <textarea value={singleText} onChange={(e) => setSingleText(e.target.value)} className="w-full h-full bg-transparent text-gray-100 resize-none outline-none text-lg leading-relaxed font-light placeholder-gray-700" placeholder="Paste your text here..." />
                   ) : (
                     <div className="space-y-4">
                        {dialogue.map((line, idx) => (
                          <div key={line.id} className="flex gap-4 items-start group animate-in slide-in-from-left-2 duration-300">
                            <select value={line.speakerId} onChange={(e) => {
                              const nd = [...dialogue];
                              nd[idx].speakerId = e.target.value;
                              setDialogue(nd);
                            }} className="w-24 shrink-0 bg-[#0E1117] border border-gray-800 text-[10px] text-[#FFD700] font-black rounded-lg p-2 outline-none cursor-pointer hover:border-gray-600">
                              {speakers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <textarea value={line.text} onChange={(e) => {
                              const nd = [...dialogue];
                              nd[idx].text = e.target.value;
                              setDialogue(nd);
                            }} className="flex-1 bg-[#0E1117] border border-gray-800 rounded-xl p-3 text-sm outline-none focus:border-[#FFD700] resize-none min-h-[40px] transition-all" rows={1} />
                            <button onClick={() => setDialogue(dialogue.filter((_, i) => i !== idx))} className="mt-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        ))}
                        <button onClick={() => setDialogue([...dialogue, { id: Date.now().toString(), speakerId: speakers[0].id, text: '' }])} className="w-full py-4 border-2 border-dashed border-gray-800 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-tighter hover:border-[#FFD700] hover:text-[#FFD700] transition-all">+ Add New Voice Line</button>
                     </div>
                   )
                 ) : <pre className="text-gray-600 text-xs font-mono leading-loose">{mode === AppMode.SINGLE ? singleText : dialogue.map(l => `${speakers.find(s => s.id === l.speakerId)?.name}: ${l.text}`).join('\n')}</pre>}
               </div>
            </div>

            <button onClick={handleConvert} disabled={loading || !isOnline} className="w-full bg-gradient-to-r from-[#FFD700] to-[#E6C200] text-[#0E1117] font-black py-6 rounded-3xl flex items-center justify-center gap-4 shadow-[0_20px_50px_-15px_rgba(255,215,0,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale group">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} className="group-hover:translate-x-1 transition-transform" fill="currentColor" />}
              <span className="text-xl uppercase tracking-tighter">RENDER PRO AUDIO 🚀</span>
            </button>
          </section>

          <section className="w-full lg:w-96 p-6 flex flex-col space-y-6 bg-[#0E1117] border-l border-gray-800">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Studio Output</label>
             <div className="flex-1 bg-[#161B22] rounded-[40px] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center p-8 text-center space-y-8 shadow-inner relative overflow-hidden">
                {!audioUrl && !loading && (
                  <div className="opacity-10 space-y-4 flex flex-col items-center">
                    <Mic2 size={80} />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Ready for Render</p>
                  </div>
                )}
                
                {loading && (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-[#FFD700]/10 border-t-[#FFD700] rounded-full animate-spin"></div>
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#FFD700] animate-pulse" size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[#FFD700] text-lg font-black tracking-widest animate-pulse uppercase italic">Processing...</p>
                      <p className="text-[10px] text-gray-600 uppercase font-bold">Priority Pro Server Access</p>
                    </div>
                  </div>
                )}

                {audioUrl && !loading && (
                  <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#FFD700] to-[#B8860B] rounded-full flex items-center justify-center mx-auto shadow-[0_20px_60px_-15px_rgba(255,215,0,0.5)] border-4 border-[#0E1117]">
                      <Volume2 size={64} className="text-[#0E1117]" />
                    </div>
                    <div className="space-y-6">
                      <div className="inline-block px-4 py-1.5 bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-black rounded-full border border-[#FFD700]/20 uppercase">Mastered Audio</div>
                      <audio src={audioUrl} controls className="w-full h-10 accent-[#FFD700]" />
                      <a href={audioUrl} download={`pro_voice_${Date.now()}.wav`} className="flex items-center justify-center gap-3 w-full py-5 bg-white hover:bg-[#FFD700] text-[#0E1117] font-black rounded-3xl text-xs transition-all shadow-xl uppercase tracking-widest">
                        <Download size={18} /> Export Studio WAV
                      </a>
                    </div>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-1 gap-3">
               <div className="p-4 bg-[#161B22] rounded-2xl border border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Zap size={16} className="text-blue-400" /></div>
                    <span className="text-[10px] text-gray-500 uppercase font-black">Connection</span>
                 </div>
                 <span className="text-xs font-mono text-blue-400 font-bold">ULTRALOW LATENCY</span>
               </div>
               <div className="p-4 bg-[#161B22] rounded-2xl border border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg"><ShieldCheck size={16} className="text-green-400" /></div>
                    <span className="text-[10px] text-gray-500 uppercase font-black">Account</span>
                 </div>
                 <span className="text-xs font-mono text-green-400 font-bold">PRO UNLIMITED</span>
               </div>
             </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
