const fs = require('fs');
const path = require('path');
const os = require('os');

// Manually parse .env file to avoid extra dependencies
const envPath = path.resolve(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
      env[key.trim()] = value.join('=').trim();
    }
  });
}

// ─── Auto-detect current machine IP ──────────────────────────────────────────
// Priority: .env file → auto-detect from network interfaces → localhost
const getLocalIp = () => {
  // If explicitly set in .env, use that
  if (env.API_URL && !env.API_URL.includes('localhost')) {
    return env.API_URL; // already a full URL
  }
  // Auto-detect the machine's current WiFi/LAN IP
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        // Prefer 192.168.x.x (home WiFi / LAN)
        if (net.address.startsWith('192.168.')) return net.address;
      }
    }
  }
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address; // any non-loopback IP
      }
    }
  }
  return 'localhost';
};

// For web: always localhost. For mobile: auto-detected IP.
const detectedIp = getLocalIp();
// If getLocalIp returned a full URL (from .env), use it directly; otherwise build one
const API_URL = detectedIp.startsWith('http')
  ? detectedIp
  : `http://${detectedIp}:5000/api`;

console.log(`[app.config.js] Auto-detected API URL: ${API_URL}`);

module.exports = {
  "expo": {
    "name": "NTJ Mobile",
    "slug": "ntj-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#121212"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "apiUrl": API_URL
    }
  }
}
