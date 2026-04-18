# Quick Fix - Restart Backend

## The Problem

You have 3 backend servers running simultaneously:
- npm run dev (old)
- npm run dev (old)
- npm start (new)

They're all trying to use port 5000, so the old broken code is still running.

## The Solution

1. **Stop ALL backend servers:**
   - Find each terminal running backend servers
   - Press **Ctrl+C** in each one
   - OR close those terminal windows

2. **Start fresh backend:**
   ```bash
   cd ntj-backend
   npm start
   ```

3. **Try registering again on your phone**

## What Should Happen

After restarting with the fixed code:
✅ "Success! Registration successful!"
✅ Automatically logs you in
✅ See placeholder home screen

---

**Do this now and let me know what happens!**
