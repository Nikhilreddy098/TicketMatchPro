# 🎫 TicketMatchPro — Peer-to-Peer Ticket Marketplace & Exchange Application

[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-black.svg?style=flat&logo=expo)](https://expo.dev)
[![React Native 0.86](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com)
[![Tests Passing](https://img.shields.io/badge/Tests-365%2F365%20Passed-22C55E.svg?style=flat)]()
[![License MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**TicketMatchPro** is a modern, commercial-grade peer-to-peer (P2P) ticket marketplace and ticket exchange mobile application built for iOS, Android, and Web using Expo SDK 57, React Native, TypeScript, and Supabase backend services.

---

## 🌟 Core Features

- 🔐 **Authentication & Security**: Email/password authentication, Zod form validation, role-based access control (`user` / `admin`), and session persistence.
- 🎟️ **Ticket Marketplace**: Browse, search, filter by category (Concerts, Sports, Movies, Festivals, Theatre, College Events, Other), filter by city/price, and list tickets with seat/row details.
- 🔄 **P2P Ticket Exchange**: Propose ticket swaps directly with other users, track proposal statuses (`pending`, `accepted`, `rejected`, `cancelled`), and auto-lock tickets upon acceptance.
- 💬 **Live Chat Messenger**: Real-time buyer-seller messaging scoped to ticket listings and exchange offers.
- 💳 **Payment Portal & Demo Mode**: Dynamic fee calculation (Subtotal + 5% Service Fee), multiple payment methods (UPI, Card, Net Banking, Wallet), Razorpay server verification contract, and automatic Demo Payment Mode.
- 📱 **Digital Ticket Pass & QR Verification**: SVG QR pass generation and live QR Verification Scanner (`/verify-ticket`) returning status (`VALID`, `USED`, `CANCELLED`, `NOT_FOUND`).
- 🛡️ **Role-Gated Admin Panel**: Moderation dashboard for platform statistics, user management, listing deletion, transaction audits, and reports.

---

## 🏗️ Tech Stack & Architecture

- **Frontend**: React Native, Expo SDK 57, Expo Router v4, React 19, Lucide Icons, Custom Dark Mode Theme.
- **Backend & Database**: Supabase Auth, PostgreSQL Database, Row-Level Security (RLS) policies, Storage Buckets.
- **Form Validation**: Zod, React Hook Form.
- **Testing**: Node Native Test Runner + TypeScript custom test suite (**365 Automated Test Cases**).

---

## 🛠️ Quick Start & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/TicketMatchPro.git
cd TicketMatchPro
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your Supabase credentials in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Setup
Run the SQL migration script located at [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor. This initializes tables, RLS policies, storage rules, and sample seed data.

### 5. Run the Application
```bash
npx expo start
```
- Press **`w`** for Web Browser (`http://localhost:8081`)
- Press **`i`** for iOS Simulator
- Press **`a`** for Android Emulator / Device

---

## 🔑 Demo Account Credentials

Use these credentials on the Sign In screen or tap **Use Demo Account**:
- **Email**: `demo@ticketmatchpro.app`
- **Password**: `Demo@12345`

---

## 🧪 Running Automated Tests

Run the automated test suite covering **365 test cases** (pricing logic, Zod validation schemas, QR hash verification, exchange workflow, search filters):

```bash
npm test
```

Run TypeScript strict type checking:
```bash
npm run lint
```

---

## 📱 Building Android APK Installer

To generate a standalone `.apk` installer for Android phones:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
