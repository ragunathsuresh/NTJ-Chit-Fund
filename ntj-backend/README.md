# NTJ Backend API

Backend server for NTJ mobile application built with Node.js, Express, and MongoDB.

## Technologies

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Razorpay** - Payment gateway
- **Bcrypt** - Password hashing

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secret_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   CORS_ORIGIN=*
   ```

3. **Start the server:**
   ```bash
   # Development with auto-reload
   npm run dev
   
   # Production
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)

### Users (`/api/users`)
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update profile (protected)
- `PUT /password` - Change password (protected)

### Orders (`/api/orders`)
- `GET /` - Get all orders (protected)
- `GET /:id` - Get order by ID (protected)

### Payments (`/api/payments`)
- `POST /razorpay/create-order` - Create Razorpay order (protected)
- `POST /razorpay/verify` - Verify payment (protected)

### Alerts (`/api/alerts`)
- `GET /` - Get all alerts (protected)
- `POST /` - Create alert (protected)
- `PUT /:id` - Update alert (protected)
- `PATCH /:id/toggle` - Toggle alert (protected)
- `DELETE /:id` - Delete alert (protected)

### Banks (`/api/banks`)
- `GET /` - Get all bank accounts (protected)
- `POST /` - Add bank account (protected)
- `PATCH /:id/primary` - Set as primary (protected)
- `DELETE /:id` - Delete account (protected)

### KYC (`/api/kyc`)
- `POST /upload` - Upload KYC documents (protected)
- `GET /status` - Get KYC status (protected)

## MongoDB Models

- **User** - User accounts with authentication
- **Order** - Transaction records
- **Alert** - Price alerts
- **BankAccount** - Linked bank accounts

## Security

- Passwords hashed with bcrypt
- JWT token authentication
- Protected routes require valid token
- CORS enabled
- Input validation with express-validator

## Development

The server runs on port 5000 by default and listens on all interfaces (0.0.0.0) for mobile access.

Access the API at: `http://localhost:5000` or `http://YOUR_IP:5000`

## License

MIT
