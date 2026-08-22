# Book Tracker App - Project Context

## Overview
A personal book tracking mobile app built with React Native (Expo) for Android. Tracks story books with purchase details, reading progress, statistics, wishlist, and sale records.

## Tech Stack
- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **UI Library:** React Native Paper (Material Design 3)
- **Database:** SQLite via `expo-sqlite` (local, offline-first)
- **Navigation:** Expo Router v6 (file-based routing)
- **State:** React hooks (useState, useEffect, useCallback)

## Project Structure
```
book-tracker/
├── app/                        # Expo Router screens (file-based routing)
│   ├── _layout.tsx             # Root layout (PaperProvider + Stack navigator)
│   ├── (tabs)/                 # Bottom tab navigation
│   │   ├── _layout.tsx         # Tab bar config (My Books, Statistics, Wishlist, Data)
│   │   ├── index.tsx           # Book list with search, counts and status filters
│   │   ├── statistics.tsx      # Overview, custom periods, expandable stats and graphs
│   │   ├── wishlist.tsx        # Wishlist count and purchase workflow
│   │   └── data.tsx            # Excel import/export
│   ├── book/
│   │   ├── add.tsx             # Add new book form
│   │   ├── edit.tsx            # Edit existing book form
│   │   └── [id].tsx            # Book details, reading, completion and sale actions
│   └── wishlist/
│       └── add.tsx             # Add to wishlist form
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── BookCard.tsx        # Book list item with status chip
│   │   ├── DatePickerInput.tsx # Auto-formatting YYYY-MM-DD input
│   │   └── EmptyState.tsx      # Empty list placeholder
│   │   └── AutocompleteInput.tsx # Author/publisher suggestions
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # CREATE TABLE statements
│   │   ├── database.ts         # SQLite connection + init
│   │   ├── bookQueries.ts      # Book CRUD + statistics queries
│   │   └── wishlistQueries.ts  # Wishlist CRUD + move-to-books
│   │   └── wishlistEvents.ts   # Shared wishlist refresh notifications
│   ├── hooks/                  # Custom React hooks
│   │   ├── useBooks.ts         # Book list + CRUD operations
│   │   ├── useWishlist.ts      # Wishlist operations
│   │   └── useStatistics.ts    # Date-range summary statistics
│   └── types/                  # TypeScript interfaces
│       └── index.ts            # Book, WishlistBook and statistics types
├── package.json
├── app.json                    # Expo config
├── babel.config.js
└── tsconfig.json
```

## Data Models

### Book
- id, title, author, publication
- actualPrice, discountedPrice
- optional coverUri
- purchasedDate, readingStartDate, completionDate (YYYY-MM-DD strings)
- isSold, soldDate, soldPrice
- createdAt

### WishlistBook
- id, title, author, publication
- expectedPrice, notes
- addedDate

## Features
1. **Book List** — Search and filter by In Stock/Reading/Done/Sold, with counts and date-descending order
2. **Add/Edit Book** — Full form, author/publisher autocomplete, camera/gallery covers
3. **Book Detail** — View all info, edit, delete, start/restart reading, complete, and sell
4. **Statistics** — Overview/custom periods, expandable monthly counts, drill-down lists and graphs
5. **Wishlist** — Live count, remove items, or purchase with date and price details
6. **Data** — Excel import/export

## Navigation
- Bottom tabs: My Books | Statistics | Wishlist | Data
- Stack navigation for detail/add/edit screens

## Conventions
- Dates stored as `YYYY-MM-DD` strings in SQLite
- Currency displayed in ₹ (Indian Rupees)
- Status derived from dates: In Stock → Reading → Done, with Sold as a separate state
- All data is local/offline (no API, no auth)

## Running the App
```bash
npm install
npx expo start -c
```
Scan QR with Expo Go on Android, or press `a` for emulator.

## Current Implementation Notes

- The visible My Books filter label is **In Stock**, backed by the internal `purchased` value.
- Statistics use `Total Spent - Total Earnings` for Net Spent. Purchased spending uses discounted price when present, otherwise printed price.
- Existing SQLite databases receive the nullable `coverUri` column during initialization.
- `expo-image-picker` works in Expo Go for camera/gallery images.
- `react-native-document-scanner-plugin` detects cover edges but requires an EAS/native build; its import is lazy so Expo Go can load routes.
- Build the native Android app with `eas build --platform android --profile preview`.
- Keep `package.json` and `package-lock.json` synchronized because EAS performs a clean install.

## Statistics Rules

- Purchased count uses `purchasedDate`.
- Completed count uses `completionDate`.
- Sold count uses `soldDate` and `isSold`.
- Total Spent uses discounted price when present, otherwise printed price.
- Total Earnings uses sold price.
- Net Spent is `Total Spent - Total Earnings`.

The Overview screen displays zero values for metrics without data. Year mode exposes monthly rows and separate monthly Purchases, Completions, and Net Spent graphs.
