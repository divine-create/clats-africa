import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

export interface ClatsAvatarProps {
  avatarData?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ClatsAvatar({ avatarData, size = 64, className, style }: ClatsAvatarProps) {
  const avatarUri = useMemo(() => {
    if (!avatarData) return null;
    
    // Check if it's JSON configuration for DiceBear
    if (avatarData.startsWith('{')) {
      try {
        const config = JSON.parse(avatarData);
        // We use avataaars collection by default
        const avatar = createAvatar(avataaars, config);
        return avatar.toDataUri();
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [avatarData]);

  if (avatarUri) {
    return (
      <img 
        src={avatarUri} 
        alt='Child Avatar'
        className={className} 
        style={{ width: size, height: size, objectFit: 'contain', ...style }}
      />
    );
  }

  // Fallback for legacy emojis or missing avatars
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.6,
        background: '#E2E8F0',
        borderRadius: '50%',
        ...style
      }}
    >
      {avatarData || '👦🏾'}
    </div>
  );
}
