import crypto from 'crypto';

/**
 * Generate UUID v7
 * @returns {string} UUID v7 string in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function generateUUIDv7() {
  const timestamp = Date.now();
  const timeHigh = Math.floor(timestamp / 1000);
  const timeLow = timestamp % 1000;
  
  // Generate random bytes using Node.js crypto module
  const randomBytes = crypto.randomBytes(10);
  
  // Convert to hex string with proper padding
  const toHex = (num, length) => {
    // Ensure the number is positive
    const positiveNum = num & 0xFFFFFFFF;
    return positiveNum.toString(16).padStart(length, '0').toLowerCase();
  };
  
  // Build UUID v7 components
  const timeHighHex = toHex(timeHigh, 8);
  const timeLowHex = toHex(((timeLow & 0x3FF) << 4) | 0x7, 4);
  const random1Hex = '7' + toHex(((randomBytes[0] << 8) | randomBytes[1]) & 0x0FFF, 3);
  const random2Hex = toHex(((randomBytes[2] & 0x3F) | 0x80) << 8 | randomBytes[3], 4);
  
  // Generate 12 hex characters for the last part (6 bytes)
  const random3Hex = toHex(randomBytes[4], 2) + 
                    toHex(randomBytes[5], 2) + 
                    toHex(randomBytes[6], 2) + 
                    toHex(randomBytes[7], 2) + 
                    toHex(randomBytes[8], 2) + 
                    toHex(randomBytes[9], 2);
  
  return `${timeHighHex}-${timeLowHex}-${random1Hex}-${random2Hex}-${random3Hex}`;
}
