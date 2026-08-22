# Book Tracker

A personal React Native book-tracking app built with Expo and Expo Router.

## Features

- Add purchased books or wishlist items.
- Track purchased, reading, completed, and sold statuses.
- View book details, prices, dates, sale information, and cover images.
- Add or change covers using the phone camera or gallery.
- Scan book-cover edges with a native document scanner and save the cropped result.
- Autocomplete authors and publishers from existing records.
- Import and export books and wishlist items as Excel files.
- View statistics by year, custom date range, or presets such as the last 3 months, 6 months, or 365 days.
- Expand yearly statistics by month and open the matching book list by tapping a count.

## Requirements

- Node.js and npm.
- Expo Go for normal JavaScript development and testing.
- An Expo account and EAS CLI for a standalone Android build.
- The edge-detection cover scanner requires a native development or preview build. It is not included in standard Expo Go.

## Install

```powershell
npm install
```

## Run With Expo Go

```powershell
npx expo start -c
```

Scan the QR code with Expo Go. Camera capture and gallery selection use `expo-image-picker`.

## Build Android APK

The repository includes `eas.json` profiles. To create an installable preview APK without Android Studio:

```powershell
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Open the EAS download link on the phone and install the generated APK. The `react-native-document-scanner-plugin` edge detector is available in this native build.

## Useful Checks

```powershell
npx tsc --noEmit
npx expo-doctor
npx expo export --platform android
```

## Project Layout

```text
app/                 Expo Router screens and layouts
src/components/     Reusable UI components
src/db/              SQLite schema, database, and queries
src/hooks/           Data and statistics hooks
src/types/           Shared TypeScript types
src/utils/           Excel import/export helpers
assets/              Static assets
```

## Data Storage

The app stores data locally in the SQLite database `booktracker.db`.

- `books` stores books, prices, dates, sale state, and optional cover URI.
- `wishlist` stores wishlist entries.
- Existing databases receive the `coverUri` column through a startup migration.

The app does not require a backend. Metadata lookup and the document scanner are the only features that depend on external/native services.

## Notes

- Open Library and Google Books metadata lookups are not guaranteed to contain regional or Bengali editions.
- Excel dates are safest in `YYYY-MM-DD` format.
- Keep `package.json` and `package-lock.json` synchronized because EAS performs a clean dependency install.
