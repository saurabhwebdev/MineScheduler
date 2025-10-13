import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

/**
 * UTF-8 safe base64 encoding
 */
const utf8ToBase64 = (str) => {
  try {
    // Use TextEncoder for proper UTF-8 encoding
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    let binary = '';
    uint8Array.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  } catch (error) {
    console.error('Error encoding avatar:', error);
    return null;
  }
};

/**
 * Generate avatar SVG based on user data
 * @param {Object} user - User object with name and gender
 * @returns {string} - SVG data URL
 */
export const generateAvatar = (user) => {
  if (!user) return null;

  try {
    const seed = user.email || user.name || 'default';
    const gender = user.gender || 'male';

    // Avatar options based on gender
    const options = {
      seed: seed,
      // Style options for cartoon avatars
      backgroundColor: ['062d54'],
      ...(gender === 'female' && {
        style: ['circle'],
      }),
      ...(gender === 'male' && {
        style: ['circle'],
      }),
    };

    const avatar = createAvatar(avataaars, options);
    const svg = avatar.toString();
    
    // Convert SVG to data URL with proper UTF-8 encoding
    const base64 = utf8ToBase64(svg);
    if (!base64) return null;
    
    const dataUrl = `data:image/svg+xml;base64,${base64}`;
    return dataUrl;
  } catch (error) {
    console.error('Error generating avatar:', error);
    return null;
  }
};

/**
 * Get initials from name as fallback
 * @param {string} name - User's name
 * @returns {string} - Initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
