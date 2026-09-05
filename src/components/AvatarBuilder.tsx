import React, { useState, useEffect } from 'react';
import { ClatsAvatar } from './ClatsAvatar';

const SKIN_COLORS = ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335'];
const HAIR_STYLES = ['dreads01', 'dreads02', 'frizzle', 'fro', 'froBand', 'shortCurly', 'shortFlat', 'shortRound', 'shortWaved', 'theCaesar', 'theCaesarAndSidePart', 'curly', 'bun', 'straight01', 'shaggy'];
const CLOTHING = ['blazerAndShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'graphicShirt', 'collarAndSweater'];
const ACCESSORIES = ['blank', 'kurt', 'prescription02', 'round', 'sunglasses'];
const MOUTHS = ['smile', 'twinkle', 'default', 'eating', 'happy'];
const EYES = ['default', 'happy', 'surprised', 'squint', 'wink'];

interface AvatarBuilderProps {
  initialAvatar?: string;
  onSave: (avatarJson: string) => void;
  isDark: boolean;
}

export function AvatarBuilder({ initialAvatar, onSave, isDark }: AvatarBuilderProps) {
  const [config, setConfig] = useState<any>(() => {
    try {
      if (initialAvatar && initialAvatar.startsWith('{')) {
        return JSON.parse(initialAvatar);
      }
    } catch(e) {}
    return {
      seed: Math.random().toString(36).substring(7),
      skinColor: ['d08b5b'],
      top: ['shortCurly'],
      clothing: ['hoodie'],
      accessories: ['blank'],
      mouth: ['smile'],
      eyes: ['default'],
      backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']
    };
  });

  const [activeTab, setActiveTab] = useState<'skin'|'hair'|'clothes'|'face'>('skin');

  const updateConfig = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: [value] }));
  };

  const handleShuffle = () => {
    setConfig({
      seed: Math.random().toString(36).substring(7),
      skinColor: [SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)]],
      top: [HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)]],
      clothing: [CLOTHING[Math.floor(Math.random() * CLOTHING.length)]],
      accessories: [ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)]],
      mouth: [MOUTHS[Math.floor(Math.random() * MOUTHS.length)]],
      eyes: [EYES[Math.floor(Math.random() * EYES.length)]],
      backgroundColor: config.backgroundColor
    });
  };

  useEffect(() => {
    onSave(JSON.stringify(config));
  }, [config, onSave]);

  const tabs = [
    { id: 'skin', label: 'Tone' },
    { id: 'hair', label: 'Hair' },
    { id: 'clothes', label: 'Outfit' },
    { id: 'face', label: 'Face' },
  ];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Preview */}
      <div className="flex justify-center items-center relative">
        <ClatsAvatar avatarData={JSON.stringify(config)} size={120} className="rounded-2xl border-4 border-[#2EC4B6] shadow-lg bg-slate-100" />
        <button 
          onClick={handleShuffle}
          className="absolute bottom-[-10px] bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full border-b-2 border-indigo-700 active:border-b-0 active:translate-y-[2px]"
        >
          🎲 Random
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg mt-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${activeTab === t.id ? 'bg-white dark:bg-slate-600 shadow-sm text-[#2EC4B6]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="grid grid-cols-5 gap-2 mt-1 max-h-[120px] overflow-y-auto p-1">
        {activeTab === 'skin' && SKIN_COLORS.map(c => (
          <button key={c} onClick={() => updateConfig('skinColor', c)} className={`w-8 h-8 rounded-full border-2 ${config.skinColor?.[0] === c ? 'border-[#2EC4B6] scale-110' : 'border-transparent'}`} style={{ backgroundColor: '#' + c }} />
        ))}

        {activeTab === 'hair' && HAIR_STYLES.map(h => (
          <button key={h} onClick={() => updateConfig('top', h)} className={`text-[10px] truncate rounded-md p-1 border ${config.top?.[0] === h ? 'border-[#2EC4B6] bg-[#2EC4B6]/10 text-[#2EC4B6]' : 'border-slate-200 dark:border-slate-700'}`}>
            {h.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}

        {activeTab === 'clothes' && CLOTHING.map(c => (
          <button key={c} onClick={() => updateConfig('clothing', c)} className={`text-[10px] truncate rounded-md p-1 border ${config.clothing?.[0] === c ? 'border-[#2EC4B6] bg-[#2EC4B6]/10 text-[#2EC4B6]' : 'border-slate-200 dark:border-slate-700'}`}>
            {c.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}

        {activeTab === 'face' && [...EYES, ...ACCESSORIES].map(f => (
          <button key={f} onClick={() => updateConfig(EYES.includes(f) ? 'eyes' : 'accessories', f)} className={`text-[10px] truncate rounded-md p-1 border ${config.eyes?.[0] === f || config.accessories?.[0] === f ? 'border-[#2EC4B6] bg-[#2EC4B6]/10 text-[#2EC4B6]' : 'border-slate-200 dark:border-slate-700'}`}>
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
