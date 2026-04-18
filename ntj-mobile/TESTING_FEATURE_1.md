# NTJ Mobile App - Feature 1 Testing Guide

## Current Feature: Authentication

We've built the authentication system! Here's how to test it:

### Step 1: Update API URL

1. Open `.env` file in `ntj-mobile` folder
2. Find your computer's IP address:
   - Run `ipconfig` in terminal
   - Look for IPv4 Address (e.g., 192.168.1.5)
3. Update API_URL:
   ```
   API_URL=http://YOUR_IP_ADDRESS:5000/api
   ```
   Example: `API_URL=http://192.168.1.5:5000/api`

### Step 2: Start the App

```bash
cd ntj-mobile
npx expo start
```

### Step 3: Test on Your Phone

1. Install **Expo Go** app from Play Store/App Store
2. Scan the QR code from terminal
3. App should load on your phone

### Step 4: Test Authentication

**Register a New User:**
1. Open the app → "Register" button
2. Fill in:
   - Name: Test User
   - Email: test@test.com
   - Phone: 9876543210
   - Password: test123
   - Confirm Password: test123
3. Click "Register"
4. Should see success message and be logged in

**Logout & Login:**
1. After registering, you'll see a placeholder home screen
2. Click "Logout"
3. Click "Login"
4. Enter email: test@test.com
5. Password: test123
6. Should successfully log in

### What to Check:

✅ Register screen works  
✅ Login screen works  
✅ Form validation (empty fields, password mismatch)  
✅ Connection to backend API  
✅ Token storage (stays logged in after app restart)  
✅ Logout works  

### Troubleshooting:

- **"Network Error"**: Check API_URL in .env
- **Backend not responding**: Make sure `npm run dev` is running in ntj-backend
- **Can't scan QR**: Use tunnel mode: `npx expo start --tunnel`

### Next Feature:

Once authentication works, we'll build Feature 2: Home Dashboard with gold/silver balances!

---

**Current Status**: Built authentication system, ready for testing!
