# NTJ Backend - Quick Test Guide

## Check if Backend is Running

### Method 1: Browser
Open http://localhost:5000 in your browser

**Expected Response:**
```json
{
  "message": "🚀 NTJ Backend API",
  "version": "1.0.0",
  "status": "running"
}
```

### Method 2: PowerShell
```powershell
Invoke-RestMethod -Uri http://localhost:5000
```

### Method 3: Test Registration
```powershell
$body = @{
    name = "Test User"
    email = "test@example.com"
    phone = "9876543210"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://localhost:5000/api/auth/register -Body $body -ContentType "application/json"
```

## Check Server Status

If the server is running with `npm run dev`, you should see:
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
🚀 Server running on port 5000
📍 Local: http://localhost:5000
📍 Network: http://0.0.0.0:5000
```

## Troubleshooting

**Server keeps crashing?**
- Verify MongoDB connection string in `.env`  
- Check that password doesn't have `<` `>` brackets
-  Database name should be included: `/ntj-db?`

**Can't connect from mobile?**
- Make sure you use Network URL: `http://YOUR_IP:5000`
- Firewall might need to allow port 5000

## API Testing with Postman

Import these endpoints:
- POST http://localhost:5000/api/auth/register
- POST http://localhost:5000/api/auth/login
- GET http://localhost:5000/api/auth/me  (requires Bearer token)
- GET http://localhost:5000/api/orders
- GET http://localhost:5000/api/alerts
- And 20+ more endpoints...

See README.md for full API documentation.
