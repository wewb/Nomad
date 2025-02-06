# Nomad SDK

A comprehensive tracking solution including SDK, server, and management platform.

## Project Structure

```
nomad_sdk/
├── packages/
│   ├── track-sdk/
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── track-point.ts
│   │   │   ├── index.ts
│   │   │   └── test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── track-server/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── db.ts
│   │   │   ├── models/
│   │   │   └── routes/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── track-platform/
│       └── package.json
│
├── package.json
└── README.md
```

## Development

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

## Documentation

See [Requirements](./doc/Requirement.md) for detailed information. 