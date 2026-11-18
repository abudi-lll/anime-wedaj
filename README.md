# anime-wedaj

A full-stack starter for an anime streaming platform with free content, Pro subscriptions, and manual Ethiopian payment verification.

## Stack
- React + Vite + React Router
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Multer receipt uploads (local development)
- Admin-managed anime catalog and manual payment approval

## Before you start
You need Node.js (LTS) and a MongoDB database.

## 1. Configure the backend
Open a terminal in `server` and run:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in:
- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a long random secret
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: initial admin account details
- `CLIENT_URL`: usually `http://localhost:5173`
- `TELEBIRR_NUMBER`, `BANK_NAME`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER`

Then create the first admin:

```bash
npm run seed:admin
```

Start the API:

```bash
npm run dev
```

API runs at `http://localhost:5000`.

## 2. Configure and start the frontend
Open a second terminal in `client`:

```bash
npm install
```

Copy `.env.example` to `.env`. Set `VITE_TELEBIRR_NUMBER` and `VITE_BANK_DETAILS` to the payment instructions you want customers to see (these values are public on the checkout page). Then run:

```bash
npm run dev
```

Open `http://localhost:5173`.

## 3. First admin login
Use the email and password configured in `server/.env`. Open `/login`, then visit `/admin`.

Do not share the admin password or commit `.env` files to GitHub.

## 4. Add anime
From the admin dashboard, add anime metadata and a video URL. Use only videos you own, have licensed, or have permission to stream. For a real production service, use a dedicated video host/CDN with adaptive streaming (HLS/DASH), not your application server.

## 5. Manual payments
Users choose Monthly Pro (199 ETB) or Yearly Pro (1,699 ETB), select Telebirr or bank transfer, enter a transaction/reference number, and upload a receipt screenshot. The request remains pending until an admin checks the actual payment in their payment account and approves it.

A screenshot is not proof of settled payment. Verify the transaction in the actual Telebirr/bank account before approving. The backend prevents users from approving themselves and prevents reuse of a transaction reference.

## Important production notes
- Local receipt uploads are for development only. Receipt files are served through an admin-authenticated endpoint, not a public static folder. Use private object storage (for example, S3-compatible storage) in production.
- Add payment-provider/API integration if available; do not automate approval from screenshots.
- Configure HTTPS, secure environment variables, backups, monitoring, email verification, password reset, and stronger abuse controls before launch.
- Confirm local legal, tax, consumer-protection, and data-protection requirements.
- Do not upload copyrighted anime without distribution rights.
