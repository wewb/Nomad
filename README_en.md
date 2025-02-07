# Nomad SDK

A comprehensive tracking solution including SDK, server, and management platform.

## Project Structure

```
nomad_sdk/
├── packages/
│   ├── track-sdk/
│   │   ├── src/              # SDK source code
│   │   │   ├── types.ts      # Type definitions
│   │   │   ├── track-point.ts # Core tracking logic
│   │   │   └── index.ts      # Public API
│   │   ├── test/             # Test files
│   │   └── package.json
│   │
│   ├── track-server/
│   │   ├── src/
│   │   │   ├── routes/       # API routes
│   │   │   ├── models/       # Database models
│   │   │   └── index.ts      # Server entry
│   │   └── package.json
│   │
│   └── track-platform/
│       ├── src/              # React application
│       └── package.json
│
└── README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Start SDK development
npm run dev:sdk

# Start server development
npm run dev:server

# Start platform development
npm run dev:platform
```

## Features

- Event tracking and reporting
- Page initialization and registration
- Common parameter management
- User environment info collection
- Error monitoring and reporting
- Queue-based batch reporting
- Request limiting
- White screen monitoring

## Components

### Track SDK (@nomad/track-sdk)
- Lightweight tracking SDK for web applications
- Automatic event collection
- Error monitoring
- Performance tracking

### Track Server (@nomad/track-server)
- Data collection endpoint
- Event storage and processing
- Analytics API

### Track Platform (@nomad/track-platform)
- Visual analytics dashboard
- Real-time monitoring
- Custom reports