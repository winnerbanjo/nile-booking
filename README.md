# Nile Booking

A full-stack MERN (MongoDB, Express, React, Node.js) application for booking services along the Nile.

## Project Structure

```
nlle-booking/
├── server/          # Node.js/Express backend
│   ├── config/      # Configuration files (database, etc.)
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware
│   ├── models/      # Mongoose schemas
│   └── routes/      # API routes
├── client/          # React + Vite frontend
│   └── src/
│       ├── features/    # Feature-based modules (auth, services, bookings)
│       ├── components/  # Shared components
│       ├── lib/         # Utilities and helpers
│       └── types/       # TypeScript type definitions
└── package.json     # Root package.json with dev scripts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:

Create a `.env` file in the `server/` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nile-booking
NODE_ENV=development
```

3. Start the development servers:

```bash
npm run dev
```

This will start both the server (port 5000) and client (port 3000) concurrently.

### Individual Commands

- Start server only: `npm run server`
- Start client only: `npm run client`

## Tech Stack

### Backend
- Node.js & Express
- MongoDB & Mongoose
- CORS
- dotenv
- bcryptjs

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/UI
- React Router

## Features

- User authentication (User model with bcrypt password hashing)
- Service management (Service model with categories, pricing, availability)
- Booking system (ready for implementation)
- Feature-based architecture for scalability

## Development

The project uses a feature-based architecture in the client for better organization and scalability. Each feature (auth, services, bookings) has its own folder with components, hooks, and types.
