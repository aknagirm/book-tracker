# Book Tracker App - Project Context

## Overview
A personal book tracking mobile app built with React Native (Expo) for Android. Tracks story books with purchase details, reading progress, statistics, wishlist, and sale records.

## Tech Stack
- **Framework:** React Native with Expo SDK 53 (managed workflow)
- **Language:** TypeScript
- **UI Library:** React Native Paper (Material Design 3)
- **Database:** SQLite via `expo-sqlite` (local, offline-first)
- **Navigation:** Expo Router v5 (file-based routing)
- **State:** React hooks (useState, useEffect, useCallback)

## Project Structure
```
book-tracker/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout (PaperProvider + Stack navigator)
│   ├── (tabs)/                 # Bottom tab navigation
│   │   ├── _layout.tsx         # Tab bar config (My Books, Statistics, Wishlist)
│   │   ├── index.tsx           # Book list with search + filter
│   │   ├── statistics.tsx      # Year/month purchase & completion stats
│   │   └── wishlist.tsx        # Wishlist with move-to-purchased action
│   ├── book/
│   │   ├── add.tsx             # Add new book form
│   │   ├── edit.tsx            # Edit existing book form
│   │   └── [id].tsx            # Book detail view + sell dialog
│   └── wishlist/
│       └── add.tsx             # Add to wishlist form
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── BookCard.tsx        # Book list item with status chip
│   │   ├── DatePickerInput.tsx # Auto-formatting YYYY-MM-DD input
│   │   └── EmptyState.tsx      # Empty list placeholder
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # CREATE TABLE statements
│   │   ├── database.ts         # SQLite connection + init
│   │   ├── bookQueries.ts      # Book CRUD + statistics queries
│   │   └── wishlistQueries.ts  # Wishlist CRUD + move-to-books
│   ├── hooks/                  # Custom React hooks
│   │   ├── useBooks.ts         # Book list + CRUD operations
│   │   ├── useWishlist.ts      # Wishlist operations
│   │   └── useStatistics.ts    # Year/month aggregated stats
│   └── types/                  # TypeScript interfaces
│       └── index.ts            # Book, WishlistBook, MonthlyStats, YearlyStats
├── package.json
├── app.json                    # Expo config
├── babel.config.js
└── tsconfig.json
```

## Data Models

### Book
- id, title, author, publication
- actualPrice, discountedPrice
- purchasedDate, readingStartDate, completionDate (YYYY-MM-DD strings)
- isSold, soldDate, soldPrice
- createdAt

### WishlistBook
- id, title, author, publication
- expectedPrice, notes
- addedDate

## Features
1. **Book List** — Search, filter by status (All/Reading/Completed/Sold)
2. **Add/Edit Book** — Full form with date inputs
3. **Book Detail** — View all info, edit, delete, mark as sold
4. **Statistics** — Year/month breakdown of purchases and completions with spending totals
5. **Wishlist** — Separate list, can move items to purchased books
6. **Sell Book** — Record sale date and price via dialog

## Navigation
- Bottom tabs: My Books | Statistics | Wishlist
- Stack navigation for detail/add/edit screens

## Conventions
- Dates stored as `YYYY-MM-DD` strings in SQLite
- Currency displayed in ₹ (Indian Rupees)
- Status derived from dates: Purchased → Reading → Completed → Sold
- All data is local/offline (no API, no auth)

## Running the App
```bash
npm install
npx expo start
```
Scan QR with Expo Go on Android, or press `a` for emulator.
