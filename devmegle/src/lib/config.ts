import fs from 'fs';
import path from 'path';

export function loadApiKeys() {
  try {
    const keysPath = path.resolve(process.cwd(), 'keys.txt');
    const keysFile = fs.readFileSync(keysPath, 'utf-8');
    const lines = keysFile.split('\n');

    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.error('Error loading API keys from keys.txt:', error);
    // In a real app, you might want to throw an error or exit
  }
}
