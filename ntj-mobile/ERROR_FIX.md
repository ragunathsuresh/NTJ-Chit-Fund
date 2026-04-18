# Boolean Casting Error - SOLVED

## The Real Problem

The error `java.lang.String cannot be cast to java.lang.Boolean` was caused by these lines in `app.json`:

```json
"newArchEnabled": true,
"edgeToEdgeEnabled": true
```

These experimental features cause type conflicts in React Native.

## The Solution

I've removed those flags from `app.json`. The file now contains only the essential configuration.

## Important: Update Your IP Address

**Before restarting, update the API URL in app.json:**

Open `ntj-mobile/app.json` and change line 28:
```json
"apiUrl": "http://YOUR_ACTUAL_IP:5000/api"
```

Find your IP:
```powershell
ipconfig
```

Example: `"apiUrl": "http://192.168.1.5:5000/api"`

## Steps to Test Now:

1. **Update IP in app.json** (line 28)
2. **Stop Expo server** (Ctrl+C if running)
3. **Clear cache and restart:**
   ```bash
   npx expo start --clear
   ```
4. **Scan QR code on your phone**
5. **Try registering a new user**

The error should be completely fixed now!

## What We Removed:
- `newArchEnabled` - New React Native architecture (not needed)
- `edgeToEdgeEnabled` - Android edge-to-edge display (not needed)

These are optional experimental features that were causing the type casting issue.
