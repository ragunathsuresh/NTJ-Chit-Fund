# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email or Google account
3. Choose the **FREE** tier (M0 - Shared)

## Step 2: Create a Cluster

1. After signing in, click **"Build a Database"** or **"Create"**
2. Choose **FREE** (M0) tier
3. Select your preferred cloud provider (AWS recommended)
4. Choose a region closest to you (e.g., Mumbai for India)
5. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 3: Create Database User

1. On the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `ntjuser` (or your choice)
5. Click **"Autogenerate Secure Password"** and **COPY IT**
6. Set privilege to **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Whitelist IP Address

1. On the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - This adds `0.0.0.0/0`
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Select **Driver**: Node.js, **Version**: 6.9 or later
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update .env File

1. Open `ntj-backend/.env`
2. Replace the MONGODB_URI line with your connection string
3. **IMPORTANT**: Replace `<username>` with your database username
4. **IMPORTANT**: Replace `<password>` with your database password
5. Add database name `/ntj-db` before the `?`

**Example:**
```env
MONGODB_URI=mongodb+srv://ntjuser:YourPassword123@cluster0.ab1cd.mongodb.net/ntj-db?retryWrites=true&w=majority
```

## Step 7: Test Connection

Run the backend server:
```bash
cd ntj-backend
npm run dev
```

If successful, you'll see:
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
🚀 Server running on port 5000
```

## Troubleshooting

- **Authentication failed**: Check username/password
- **IP not whitelisted**: Add 0.0.0.0/0 in Network Access
- **Connection timeout**: Check your internet connection
- **Invalid connection string**: Make sure you replaced `<username>` and `<password>`

## Security Note

For production:
- Create a strong password
- Restrict IP access to specific IPs
- Use environment variables (never commit .env to git)
