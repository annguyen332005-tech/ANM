# SecureWeb Server

Backend API cho dự án SecureWeb.

## Cài đặt

```powershell
cd d:\BTANM\server
npm install
```

## Môi trường

File `.env` đã được tạo sẵn:

```env
PORT=4000
JWT_SECRET=secureweb-dev-secret-key-change-me
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
DATABASE_URL="file:../database/secureweb.db"
```

## Prisma

```powershell
npx prisma generate
npx prisma db push
node scripts/seed.js
```

## Chạy server

```powershell
npm run dev
```

## API test nhanh

- Health check: `GET http://localhost:4000/api/health`
- Login: `POST http://localhost:4000/api/auth/login`
- Assets: `GET http://localhost:4000/api/assets`
