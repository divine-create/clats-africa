# CLATS Native Expo Migration Plan

Transitioning CLATS from a Next.js web application to a **True Native Expo Application** requires translating the web DOM into native mobile components. This plan outlines a structured, phased approach to rewriting the UI while preserving your business logic and backend.

---

## 🏗️ 1. Architecture & Core Stack

We will use modern React Native tooling that closely mimics your Next.js developer experience:
* **Framework**: [Expo](https://expo.dev/) with **Expo Router** (gives you the same file-based routing as Next.js App Router).
* **Styling**: [NativeWind](https://www.nativewind.dev/) (allows us to reuse 90% of your existing Tailwind CSS classes on native components).
* **Database**: Supabase (fully compatible with Expo).
* **State Management**: React Context (existing `AppContext.tsx`).

---

## 🚀 Phase 1: Project Setup & Foundation

1. **Initialize the Expo App**: 
   * Generate a fresh Expo project: `npx create-expo-app clats-mobile -t expo-template-blank-typescript`
   * Set up Expo Router to mimic your `src/app` directory structure.
2. **Install Native Dependencies**:
   * Install NativeWind for Tailwind support.
   * Install Supabase client and storage adapters.
3. **Migrate Configuration**:
   * Move the constants and styling tokens from `src/utils/config.ts`.
   * Set up custom fonts (like 'Baloo 2') using `expo-font`.

---

## 💾 Phase 2: Data Layer & State Translation

Your web app heavily relies on `localStorage` for sessions and offline data. Native apps do not have `localStorage`.

1. **Replace Storage Mechanisms**:
   * Replace all `localStorage.getItem/setItem` calls with **`AsyncStorage`** (for generic data like theme/language) and **`expo-secure-store`** (for sensitive session tokens).
2. **Adapt Supabase for Mobile**:
   * Update `supabaseClient.ts` to use `AsyncStorage` as the auth storage adapter so users don't get logged out when they close the app.
3. **Migrate AppContext**:
   * Port `AppContext.tsx` directly over. Since it's pure React state, it works flawlessly in Native, provided the `localStorage` logic is swapped out.

---

## 🎨 Phase 3: Component & UI Translation (The Heavy Lifting)

React Native does not understand HTML tags. We must translate the DOM elements in your `src/components` folder.

| Web (Next.js) | Native (Expo) | Notes |
| :--- | :--- | :--- |
| `<div>`, `<main>`, `<section>` | `<View>` | Used for all containers and layouts. |
| `<span>`, `<p>`, `<h1>` | `<Text>` | All text **must** be wrapped in a Text tag. |
| `<button>`, `onClick` | `<TouchableOpacity onPress={...}>` | Handles touch interactions and button presses. |
| `<input>` | `<TextInput>` | For login forms and PIN entry. |
| `<img>` | `<Image>` (from `expo-image`) | Better caching and native performance. |
| `w-screen h-screen` | `flex: 1` | Layouts are exclusively Flexbox based in Native. |

**Steps:**
1. Migrate the UI primitives (`Heading`, `Txt`, `Chip`, `Card`).
2. Rebuild the Authentication screens (`ParentAuth`, `ChildAccess`).
3. Rebuild the core Dashboards (`AdminDashboard`, `ChildApp`).

---

## 🎵 Phase 4: Media, Hardware & Animations

Mobile apps handle media differently than browsers. We need to swap out web APIs for native modules:

1. **Audio (SFX & Voices)**:
   * **Current**: Web `new Audio()` API.
   * **Native**: Replace with `expo-av`. We will rewrite your `src/utils/audio.ts` to preload MP3s natively so UI clicks have zero latency.
2. **Video Playback**:
   * **Current**: HTML `<iframe>` for YouTube.
   * **Native**: Implement `react-native-youtube-iframe` to render native video players securely.
3. **Animations**:
   * **Current**: Framer Motion / CSS Transitions.
   * **Native**: Migrate complex animations to `react-native-reanimated` or standard React Native `Animated` API for 60fps buttery smooth UI.
4. **Google Authentication**:
   * Migrate from the web URL redirect approach to `expo-auth-session/providers/google` which securely opens the native iOS/Android browser overlay.

---

## 📦 Phase 5: Build & Distribution (EAS)

Once the code is translated, we build the actual application binaries.

1. Configure `app.json` with the correct package names (e.g., `com.clats.africa`), icon, and splash screen.
2. Use **Expo Application Services (EAS)** to compile the code in the cloud:
   * `eas build --platform android` -> Generates the `.apk` and `.aab` (for Google Play).
   * `eas build --platform ios` -> Generates the `.ipa` (for Apple App Store).

---

### Summary of Effort
Building a true native app from a web app is a **full UI rebuild**, but because your logic (Supabase, Context, Utilities, Types) is written in TypeScript, you get to recycle about **40% to 50%** of your existing codebase instantly. NativeWind will save immense time on styling.
