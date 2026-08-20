# Home Scholar → mobile app: build plan

**Status:** plan v2, corrected against the actual repo + machine on 2026-08-15.
**Goal:** a real, installable Home Scholar app with reliable background audio,
on TestFlight (iOS) and Play internal testing (Android), built today.

Supersedes plan v1 (Capacitor). See "Why not Capacitor" below.

---

## Principle: wrap, don't rewrite

Home Scholar is a working React + Vite + Tailwind + Supabase web app with 305
live lessons (229 audio, 73 visual, 3 quiz_game). A React Native rewrite of the
visual-lesson renderer, KaTeX and the kaplay arcade game is not worth it. The
app is a **native shell around the existing web app**, plus **one native
feature the web can't do: background audio**.

## The shape

```
┌─────────────────────────────────────────────┐
│  Expo native shell (iOS + Android)          │
│                                             │
│  ┌────────────────────────────────────────┐ │
│  │ WebView → home-scholar-app.vercel.app  │ │  ← the whole existing app,
│  │  dashboard · visual lessons · kids game│ │    unchanged, always current
│  └──────────────┬─────────────────────────┘ │
│                 │ postMessage bridge        │
│  ┌──────────────▼─────────────────────────┐ │
│  │ Native audio player                    │ │  ← the one native feature:
│  │  background playback · lock screen     │ │    plays with screen off
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Decisions (locked)

| Decision | Choice | Why |
|---|---|---|
| Wrapper | **Expo + react-native-webview**, EAS cloud builds | No local Xcode/Android toolchain exists; EAS is installed and logged in; Basin already ships this way |
| WebView source | **Live Vercel URL** | New courses ship by `vercel --prod`, no app rebuild or store resubmission |
| Audio | **Native player owns playback**, web page commands it | Background + lock-screen controls are impossible from HTML `<audio>` in a webview |
| Auth | **Email/password only inside the shell** | Google blocks OAuth in embedded webviews (`disallowed_useragent`) |
| Offline | **Streaming only in v1** | Downloads are the first fast-follow |
| Distribution | **TestFlight + Play internal testing** | Invite-only, no public listing |
| Platforms | **iOS first, Android immediately after** | Same codebase; iOS background audio is the risky half |

## Why not Capacitor (correcting plan v1)

Capacitor builds locally and this machine cannot:

- No Xcode (Command Line Tools only) · no CocoaPods · no Android SDK · no JDK

That is ~15 GB of installation before any app code. EAS builds in the cloud and
needs none of it. `eas` is already installed and authenticated as
`steelferguson`, and `basin-app` proves the whole path (EAS build → TestFlight
via `eas submit`, Play internal via a service account).

Other v1 errors corrected here:

- Audio is on **Cloudflare R2** (`pub-674ac47cefcc418e86fc612dac464d07.r2.dev`),
  not Supabase Storage. Verified public and range-request capable (HTTP 206), so
  native seeking works.
- v1 said to point the wrapper at the bundled `dist`. That would require an app
  rebuild and store submission for every new lesson. Point at the live URL.
- v1 said `UIBackgroundModes: audio` would be enough to keep HTML `<audio>`
  alive. It is not sufficient for lock-screen controls or Now Playing metadata,
  and is unreliable for playback itself. Native playback instead.
- v1 didn't flag the Google-OAuth-in-webview block.

---

## Repos touched

1. **`projects/home-scholar-mobile/`** (new) — the Expo shell.
2. **`projects/home-scholar-app/`** (existing) — small additive changes: a
   bridge module, shell-aware audio rendering in `Lesson.jsx`, hide the Google
   button in the shell. Web behavior in a normal browser is unchanged.

---

## The bridge contract

Web → native (`window.ReactNativeWebView.postMessage`):

| Message | Payload | Meaning |
|---|---|---|
| `play` | `{url, title, subtitle, position, rate, lessonId}` | Load and play this lesson |
| `pause` / `resume` | — | Transport control from the web UI |
| `seek` | `{seconds}` | Scrub |
| `rate` | `{rate}` | Speed control (0.75/1/1.25/1.5) |
| `stop` | — | Leaving the lesson |

Native → web (`injectJavaScript` → `window.__hsNative` event):

| Message | Payload | Meaning |
|---|---|---|
| `status` | `{lessonId, position, duration, playing}` | ~every 5s; drives `savePosition` |
| `ended` | `{lessonId}` | Drives `markComplete` |
| `ready` | `{version}` | Shell handshake; web uses it to switch to native mode |

Progress keeps flowing through the existing `useProgress` hook, so
`user_progress.last_position_seconds` stays correct with zero schema change.

---

## Build order

### M0 — Expo shell scaffold (~20 min)
- `projects/home-scholar-mobile/`: Expo SDK 54, `react-native-webview`,
  audio library, `expo-updates`.
- `app.json`: bundle id `com.steelferguson.homescholar`, iOS
  `UIBackgroundModes: ["audio"]`, Android foreground-service media permissions,
  portrait, icon/splash.
- `eas.json` modeled on `basin-app`: `development` / `preview` / `production`.

### M1 — WebView boots the real app (~45 min)
- Full-screen WebView → `https://home-scholar-app.vercel.app`, safe-area aware.
- Verify on device: email/password login persists, dashboard loads, a visual
  lesson renders (KaTeX + widgets), the kids kaplay game runs, progress saves.
- Web side: `src/lib/nativeBridge.js` + hide the Google button in the shell.

### M2 — Native background audio (the crux) (~90 min)
- **Resolved: `expo-audio` (SDK 57) does all of it, no third-party library.**
  It ships `setActiveForLockScreen` / `updateLockScreenMetadata`, and its config
  plugin writes iOS `UIBackgroundModes: audio` plus Android's
  `FOREGROUND_SERVICE_MEDIA_PLAYBACK` and a media3 `MediaSessionService`.
  `react-native-track-player` (last released Aug 2025, RN ~0.7x) is not needed
  and would have fought the new architecture. The plan's top risk is closed.
- `interruptionMode: 'doNotMix'` is mandatory — without it the OS may not
  attach lock-screen controls, and Android background playback dies at ~3 min.
- `Lesson.jsx`: in the shell, replace the `<audio>` element with a compact
  "playing in app" panel that drives the native player over the bridge.
- Verify on device: **lock the screen and confirm playback continues**,
  lock-screen play/pause/scrub work, speed control works, and the position lands
  in `user_progress`.

### M3 — Identity + polish (~30 min)
- App icon and splash, app name, version, `ITSAppUsesNonExemptEncryption: false`.

### M4 — Ship (~60 min of work, plus external waits)
- iOS: `eas build -p ios --profile production` → `eas submit` → TestFlight.
- Android: `eas build -p android --profile production` → `eas submit --track internal`.
- Install from TestFlight on the real phone and re-verify background audio on
  the shipped build, not just the dev build.

---

## Dependencies on you (I can't do these)

- **Your iPhone available** for device testing, and one-time UDID registration
  (`eas device:create`) for the fast-iteration dev build.
- **Apple sign-in / 2FA** when EAS asks for App Store Connect credentials.
- **Play Console:** create the Home Scholar app record. Confirm whether the
  `basin-app` service account can be granted access to it, or a new key is needed.
- Any Apple/Google review or processing waits.

## Risks, ranked

1. **Background audio library compatibility** (M2). Defined fallback above.
   Everything else is routine; this is the piece that decides the day.
2. **Store-side waits** — TestFlight processing and Play internal review are
   outside our control. The phone-in-hand dev build de-risks the session goal.
3. **WebView auth persistence** — expected to work (localStorage persists), but
   verified in M1 rather than assumed.
4. **Play Console app record** — if it doesn't exist, Android ends the session
   as an installable APK rather than Play internal.

## Out of scope (fast-follows)

Offline downloads · push notifications · bundling content in the app ·
Google sign-in via `expo-auth-session` · kid profiles (already on the
`profiles-flashcards-wip` branch) · any redesign or new lesson content.
