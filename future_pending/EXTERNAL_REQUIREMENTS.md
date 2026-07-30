# External and native requirements

These are not missing business logic in the current repository. Each one needs
source code, credentials, hardware, data, or infrastructure that is external
to the repo.

| Priority | Requirement | Already implemented | Still required | Why it remains |
| --- | --- | --- | --- | --- |
| P0 | Native resident mobile app | Complete resident PWA and backend APIs | Create/import the Flutter Android/iOS project and build native screens | Flutter source, Flutter SDK, signing files, and native project are not present |
| P0 | Native push notifications | Persistent in-app notifications and preferences | Firebase project, FCM credentials, APNs key/certificate, device-token registration, background handlers | Provider accounts and native app are external |
| P0 | Production camera integration | Encrypted RTSP/HTTP enrollment, ownership, AI handoff, WebSocket relay, browser webcam | Real authorized camera URLs, network access, secure production media relay and target-hardware test | Physical cameras and their network are external |
| P1 | Reliable internet voice/video calls | WebRTC audio/video UI, signalling, STUN, accept/decline/end controls | TURN server and credentials; native Flutter call UI | STUN alone cannot traverse every restrictive NAT/firewall |
| P1 | Real online payments | Stripe Checkout/webhook code, PayPal order/capture, cash/bank flows | Live/sandbox provider credentials, public webhook URL, provider-side configuration and acceptance test | Payment accounts and secrets are external |
| P1 | Emergency SMS and native broadcast | Urgent announcements, in-app alerts and Socket.IO events | SMS provider account/credentials and native push delivery | Delivery providers are external |
| P2 | External turn-by-turn safe route | Internal society graph, Dijkstra route and active-risk avoidance | Map-provider key, road/network data and usage terms | External road data is not stored in the project |

## Completion evidence to collect

- Native app: signed test build plus device screenshots and permission tests.
- Push: one FCM Android delivery, one APNs iOS delivery, and delivery logs.
- Cameras: at least one authorized RTSP camera tested for reconnect, latency,
  dropped frames, and alert delivery.
- TURN: successful call between two devices on different restrictive networks.
- Payments: successful sandbox checkout, signed webhook, refund/failure test.
- SMS: provider delivery receipt for an emergency broadcast.
- Maps: a route test showing an active risk zone being avoided.

