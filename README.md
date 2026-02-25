### Collectify

Collectify is a full-stack web application for creating, managing, and
sharing collections of items.

---

### Collections & Items

- Create collections with predefined and custom categories
- Add, update, delete, and reorder items inside a collection
- Support for extensible item metadata (title, description, optional
  fields)
- Messenger with WebSocket

### Social Layer

- Like collections
- Add collections to favorites
- Follow users
- Notification system for social interactions (likes, favorites,
  follows)

### Discovery

- Home feed with pagination
- Sorting (popular, newest, etc.)
- Category filtering
- Search

---

## Screenshots

### Home Feed

![Home Feed](docs/screenshots/3-home-feed.png)

### Collection Page

![Collection Page](docs/screenshots/1-collection-page.png)

### Collection Create

![Collection Create](docs/screenshots/4-create-collection.png)

### Notifications

![Notifications](docs/screenshots/2-notifications.png)

---

### Architecture Overview

The application follows a modular, feature-oriented architecture built
on top of Next.js App Router.

High-level Flow

---

### Tech Stack

### Frontend

- Next.js
- TypeScript
- MUI + Ant Design
- Zustand
- dnd-kit
- TanStack Query

### Backend

- Next.js Route Handlers
- Prisma ORM
- PostgreSQL
- Redis

### Infrastructure

- Environment-based configuration
- Ready for deployment on Vercel

---

### Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL

### Installation

git clone https://github.com/xretic/collectify.git cd collectify npm
install npm run dev

---

### WebSocket Core

For real-time functionality the project relies on a separate WebSocket service:

https://github.com/xretic/collectify-websocket-core

IMPORTANT: The WebSocket core must be deployed separately on its own URL
before running the application in production.

### Deployment Steps

1.  Clone the WebSocket core:

git clone https://github.com/xretic/collectify-websocket-core cd
collectify-websocket-core npm install

2.  Build and start the service:

npm run build npm start

3.  Deploy it to a separate domain or subdomain (for example:
    https://socket.yourdomain.com)

---

### Environment Configuration

After deploying the WebSocket core, configure your main Collectify
project .env file:

NEXT_PUBLIC_SOCKET_URL=https://your-socket-url.com
SOCKET_PUBLISH_URL=https://your-socket-url.com

- NEXT_PUBLIC_SOCKET_URL
- SOCKET_PUBLISH_URL

Without deploying the WebSocket core and setting these environment
variables, real-time features will not function.
