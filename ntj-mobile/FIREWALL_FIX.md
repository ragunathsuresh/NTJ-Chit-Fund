# Firewall Fix - Allow Port 5000

## The Issue
Windows Firewall is blocking port 5000, preventing your phone from connecting to the backend API.

## The Fix

### Step 1: Open PowerShell as Administrator

1. **Press Windows key**
2. **Type:** `PowerShell`
3. **Right-click** on "Windows PowerShell"
4. **Click:** "Run as administrator"
5. **Click "Yes"** when asked for permission

### Step 2: Run This Command

Copy and paste this into the PowerShell window:

```powershell
New-NetFirewallRule -DisplayName "NTJ Backend API" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

Press Enter.

### Step 3: Verify

You should see output showing the rule was created successfully.

### Step 4: Test the App

1. **On your phone**, open the app (should already be loaded)
2. **Click "Register"**
3. Fill in:
   - Name: Test User
   - Email: test@example.com  
   - Phone: 9876543210
   - Password: test123
   - Confirm Password: test123
4. **Click "Register"**

Should work now!

---

## Alternative: Manual Firewall Configuration

If the PowerShell command gives you trouble:

1. Open **Control Panel**
2. Go to **System and Security** → **Windows Defender Firewall**
3. Click **Advanced settings**
4. Click **Inbound Rules** → **New Rule**
5. Select **Port** → Click **Next**
6. Select **TCP** and enter **5000** → Click **Next**
7. Select **Allow the connection** → Click **Next**  
8. Check all profiles (Domain, Private, Public) → Click **Next**
9. Name it **"NTJ Backend API"** → Click **Finish**

---

## After Fixing

Once the firewall is opened, registration should work perfectly!
