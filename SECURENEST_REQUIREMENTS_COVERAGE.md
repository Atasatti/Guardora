# SecureNest Requirements Coverage

Source reviewed: `SecureNest-100-Ash.docx` (347 rendered pages)

Last verified: 2026-07-30

## Status legend

- **Implemented** — available in the current Guardora web application and/or its active API.
- **API-ready** — backend workflow and data model are implemented, but a dedicated resident screen is not present.
- **Partial** — a useful implementation exists, but an external service, scheduled worker, advanced UI, or stated quality target is still missing.
- **Blocked** — cannot be completed from this repository without missing source code, credentials, infrastructure, data, or a commercial licence.

## Functional requirements

### 1. Account and moderator management

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 1 | Create resident accounts | Implemented | Admin web/API creation, unique email, password hashing, activation flow, account verification. |
| 2 | Multiple profiles per household | Implemented | Embedded household profiles support create, edit, select, and delete (max 10); the resident PWA includes create/select controls. |
| 3 | Resident login and profile selection | Implemented | Secure login, persistent database activation, lockout, active-account checks, role-aware redirect, JWT/cookie session, and household-profile selection. |
| 4 | Moderator roles and permissions | Implemented | Role-based permission set, protected routes, and web controls for moderator permissions. |
| 5 | Suspend or deactivate accounts | Implemented | Soft suspension/deactivation preserves audit, finance, and incident records; login is revoked. |
| 6 | Review suspicious activity | Implemented | Successful, failed and blocked logins are audited; the Alerts dashboard risk-scores 24-hour patterns and surfaces threshold-crossing accounts/IPs. |
| 7 | Manage flagged individuals | Implemented | Banned-person enrollment, listing, sync, removal, face gallery integration, and access controls. |
| 8 | View movement timeline | Implemented | Banned-person face matches persist camera, confidence and time; the admin timeline screen presents cross-camera sightings chronologically. |

### 2. Visitors and emergencies

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 9 | Create visitor passes | Implemented | Unique six-digit entry code, validity window, purpose, category, host ownership. |
| 10 | Visitor check-in and check-out | Implemented | Security verification, check-in/out timestamps, expiry and denied states, notifications, audit log. |
| 11 | Flag suspicious visitor | Implemented | Host/security flagging, reason, denied status, moderator notification. |
| 12 | View visitor logs | Implemented | Resident-specific and security-wide chronological visitor records. |
| 13 | Broadcast emergency alerts | Partial | Urgent announcements, in-app notifications, Socket.IO emergency/security events. SMS and native push require providers/credentials. |
| 14 | Submit incident reports with media | Implemented | Resident PWA submits authenticated reports with up to five validated image/video uploads; admin status, response and notifications are integrated. |
| 15 | Trigger SOS | Implemented | Resident PWA GPS SOS, single-active-event validation, live admin Socket.IO notification, location history, cancel and resolve workflows. |
| 16 | Share live location | Partial | GPS SOS and authenticated continuous location-update API are implemented. Native background tracking still requires the Flutter/native app and OS permissions. |
| 17 | Integrate resident cameras | Partial | Browser webcam plus encrypted RTSP/HTTP enrollment, ownership, AI-service handoff, WebSocket relay, and surveillance cards are implemented. Real camera URLs, network access, and a production media relay are external. |

### 3. Notice board, polls, and social networking

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 18 | View notice board | Implemented | Sorted, pinned-first active announcement feed is available in the mobile-responsive resident portal. |
| 19 | Publish official announcements | Implemented | Admin web creation/edit/delete plus resident notifications. |
| 20 | Create polls | Implemented | Admin web can publish polls with two or more options. |
| 21 | Vote in polls | Implemented | Resident portal supports one authenticated vote per resident with expiry validation. |
| 22 | View poll results | Implemented | Resident portal shows per-option totals and the API returns updated totals immediately. |
| 23 | Pin announcements | Implemented | Admin web pin/unpin action and pinned-first ordering. |
| 24 | Comment on notices | Implemented | Authenticated notice comments, admin enable/disable setting, and resident comment control are implemented. |
| 25 | Follow resident profiles | Implemented | Resident directory provides follow/unfollow with follower/following counters. |
| 26 | Send and respond to friend requests | Implemented | Resident UI supports send, accept and reject; API also supports cancel, duplicate prevention and block enforcement. |
| 27 | Private messages | Implemented | Persisted direct conversations, short-lived socket authentication, real-time delivery, inbox and history. |
| 28 | Group chat | Implemented | Resident UI creates named groups with 3–100 active members; group delivery/history APIs are protected. |
| 29 | Voice/video calls | Partial | Authenticated WebRTC audio/video calling, offer/answer/ICE signalling, accept/decline/end controls and STUN support are implemented on web. Reliable internet calling needs TURN credentials; native Flutter UI remains. |
| 30 | Customize profile | Implemented | Identity, contact, emergency contact, avatar, household profiles, profile image, light/dark/system theme and enforceable directory/message privacy controls are implemented. |
| 31 | Receive notifications | Partial | Persistent in-app notification centre, preferences, unread counts, links, and polling are implemented. FCM/APNs native push is not configured. |
| 32 | Block/unblock users | Implemented | Resident directory provides block/unblock; it removes social relationships and prevents follows, requests and direct messages. |
| 33 | Delete conversations | Implemented | Inbox delete control performs per-user soft deletion and preserves the other participant’s history. |

### 4. Community posts and moderation

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 34 | Create posts with media | Implemented | Resident composer supports authenticated posts and validated image uploads. |
| 35 | Comments and reactions | Implemented | Resident portal supports comments and like/unlike reactions with counters; secure comment edit/delete APIs enforce ownership. |
| 36 | Automated content moderation | Implemented | Local Ollama moderation is preferred, optional Gemini fallback, moderation queue, human ban/dismiss decision. |
| 37 | Report content or people | Implemented | Resident controls and APIs cover incidents, marketplace fraud, posts/people, and dangerous areas. |
| 38 | Edit/delete own posts | Implemented | Resident controls enforce ownership; moderator/admin overrides and deletion audit logs remain available. |

### 5. Maintenance

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 39 | Submit maintenance request | Implemented | Resident portal supports type, priority, details, and up to five validated media attachments. |
| 40 | Track request status | Implemented | Resident view shows pending, assigned, in-progress, completed and cancelled states backed by status history. |
| 41 | Assign maintenance staff | Implemented | Admin web staff selector and protected assignment endpoint with expected resolution time. |
| 42 | Notify request updates | Implemented | Persistent resident notifications cover creation, assignment and status changes. |
| 43 | Submit service feedback | Implemented | Completed requests expose resident 1–5 rating controls; optional comments are supported by API. |
| 44 | Maintenance reports | Implemented | Status/type totals, mean completion time, average feedback rating, dashboard/Kanban. |

### 6. Billing

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 45 | View dues | Implemented | Resident portal shows scoped pending, paid and overdue bills. |
| 46 | View monthly statements | Implemented | Resident-scoped monthly statements include categories, descriptions, dates, totals and dependency-free PDF download. |
| 47 | View payment history | Implemented | Payment states, timestamps, external references, receipts and resident history are stored and displayed. |
| 48 | Make online payment | Partial | Hosted Stripe Checkout with signed webhook, PayPal order/capture, and bank/cash confirmation flows are implemented. Real provider credentials are external. |
| 49 | Download receipt | Implemented | Unique secure receipt data and valid PDF download are implemented and runtime-tested. |
| 50 | Apply late fee | Implemented | Protected idempotent percentage-based late-fee operation for overdue unpaid bills. |
| 51 | Billing dashboard | Implemented | Web totals, paid/pending/overdue tracking, filtering, and bill management. |
| 52 | Financial summaries | Implemented | Total, pending, cleared, overdue counts and amounts. |
| 53 | Billing reports | Implemented | Dashboard summaries, CSV export, resident statements and receipt PDFs are implemented. External accounting-system sync is optional integration work. |

The obsolete model that stored raw card numbers/CVV was replaced with tokenized provider IDs and last-four metadata. Residents cannot mark their own bill as paid.

### 7. Facility booking

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 54 | Browse facilities | Implemented | Authenticated facility list and details with capacity, hours, price, images, and rules. |
| 55 | Book a facility | Implemented | Resident portal enforces future-only verified/active resident, 0.5–2 hour limit, overlap prevention and paid-facility billing. |
| 56 | Modify/cancel booking | Implemented | Resident portal exposes collision-safe modification and 12-hour cancellation policy. |
| 57 | Booking history | Implemented | Resident and admin views expose chronological reservations with status. |
| 58 | Facility usage reports | Implemented | Status, facility popularity, booked hours, and reservation totals. |
| 59 | Facility rules | Implemented | Rules and operating hours are stored and shown through the active facility model/API. |
| 60 | Reminders and no-shows | Implemented | Automatic server scheduler handles reminders, check-in outcomes, 90-day no-show counting and 30-day restriction after three no-shows; protected manual processing remains available. |

### 8. Safety map

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 61 | View society safety map | Implemented | Web SVG map and dynamic areas API. |
| 62 | Show high-risk areas | Implemented | Safe/unsafe state, risk level, reason, expiry, polygon/centre data, and history. |
| 63 | Report dangerous area | Implemented | Each resident map area exposes reporting and sends an emergency moderator notification. |
| 64 | Mark emergency zones | Implemented | Security can mark areas high/critical risk with reason and expiry. |
| 65 | Recommend safe route | Partial | Dijkstra-based internal society routing returns an area-by-area safe path and excludes active risk zones. External road turn-by-turn navigation still needs map-provider data. |

### 9. Marketplace

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 66 | Create listing | Implemented | Resident portal supports validated listings, images, category, price, seller stats and moderation. |
| 67 | Edit/delete listing | Implemented | Resident edit/delete controls enforce seller ownership; status controls, moderator override and audit remain protected. |
| 68 | Browse listings | Implemented | Available resident feed is shown; closed listings remain available to moderators. |
| 69 | Search/filter listings | Implemented | Portal filters title/description and category; API also supports server-side query parameters. |
| 70 | View listing details | Implemented | Cards expose listing details, seller identity, unit and price. |
| 71 | Contact seller | Implemented | Dedicated Contact action opens secure direct messaging with the seller. |
| 72 | Negotiate/make offer | Implemented | Resident offer controls, duplicate prevention, seller response, buyer withdrawal and notifications are implemented. |
| 73 | Report fraud | Implemented | Resident Report Listing control feeds the moderator report queue. |
| 74 | View listing/offer history | Implemented | Resident portal shows buyer/seller offer history and final status. |

### 10. Advertising

| UC | Requirement | Status | Current implementation / remaining gap |
|---:|---|---|---|
| 75 | Apply for an ad | Implemented | Owner-only Promote control and API enforce 7/14/30-day validation and duplicate prevention. |
| 76 | Review an ad | Implemented | Admin web/API approval/rejection, note, expiry, advertiser notification, click tracking. |
| 77 | Correct and resubmit rejected ad | Implemented | Resident promotion history exposes rejected notes and owner-only resubmission with audit history. |

## Non-functional and external requirements

### Implemented

- Password hashing, JWT verification, secure cookies, role and granular permission checks.
- Production-safe authentication bypass (development only).
- Temporary lock after repeated failed login attempts.
- Ownership checks on posts, listings, messages, bills, visitors, reports, and reservations.
- File type/size/count restrictions for uploads.
- Audit logs for sensitive administrative and security actions.
- Tokenized payment-method model; no raw CVV/card-number storage.
- Persistent notifications and authenticated Socket.IO clients.
- Short-lived socket tokens, WebRTC call signalling, configurable STUN/TURN support.
- Authentication rate limiting, security headers, trusted-origin validation, and persistent hashed activation codes.
- Automatic reservation lifecycle scheduler.
- Encrypted camera source storage and protected AI-service handoff.
- CSV operational exports and valid downloadable PDF statements/receipts.
- Mobile-responsive resident PWA covering the resident workflows.
- Next.js production build and TypeScript verification.

### Partial or not yet demonstrated

- Local concurrent smoke tests pass the feed/search/map/notification targets with p95 below 11 ms. Production-like load, alert delivery, mobile location and poll-result targets still require deployed infrastructure testing.
- Horizontal reliability requires a Redis Socket.IO adapter, distributed background queue, object storage, monitoring, backups, and multiple service instances. Activation codes themselves now persist in MongoDB.
- MongoDB indexes are present, but the document’s proposed PostgreSQL + MongoDB hybrid was not introduced. The current implementation consistently uses MongoDB/Mongoose.
- Uploaded files are local-disk assets. Vercel/serverless production needs S3, Cloudinary, or equivalent object storage.
- Rate limiting, trusted-origin protection and security headers are implemented. Dependency scanning and an independent penetration test remain deployment gates.

### Blocked by missing source or external configuration

- The Flutter Android project, Flutter SDK and APK are not in this repository. A complete resident PWA now supplies the functional resident screens, but a native Flutter deliverable must be created as a separate project/toolchain.
- Native push notifications require Firebase/APNs configuration.
- SMS requires a provider account and credentials.
- Email activation requires working SMTP credentials; the code path exists.
- Stripe Checkout needs a real secret key/webhook secret. PayPal order/capture needs client credentials.
- Turn-by-turn maps need a map provider key and route/network data.
- Voice/video calling works locally with WebRTC and STUN; reliable restrictive-network production calling needs TURN credentials.
- RTSP enrollment and local AI relay are implemented; production streaming needs actual camera URLs/network access and a scalable media relay/transcoder.
- Stronger/commercial AI deployment depends on model licences, hardware, trained data, accuracy acceptance thresholds, and explicit opt-in. Existing AGPL and research-only models remain disabled by default where required.

## Verification performed

- Backend: all active JavaScript source files pass `node --check`.
- Frontend: ESLint passes.
- Frontend: Next.js 16.2.12 production build and TypeScript pass.
- Runtime: MongoDB, active APIs, scheduler/manual reservation processing, CSV exports, valid PDF generation, encrypted camera handoff, resident proxy, friend requests, offers, safe routing and validation errors were exercised on localhost.
- Performance: 10 concurrent requests over three rounds passed local p95 targets (notice 10.3 ms, search 3.8 ms, map 7.8 ms, notification 7.9 ms).
- AI service health: YuNet detector and SFace recognizer ready; enrolled gallery detected; configured detection and violence runtimes report ready under their explicit local opt-ins.
