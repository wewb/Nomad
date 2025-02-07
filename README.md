# Nomad SDK

A comprehensive tracking solution including SDK, server, and management platform.

## Project Structure

```
F:\nomad_sdk\                <- 项目根目录
├── packages/                <- 所有子包
│   ├── track-sdk/          <- SDK 包
│   │   ├── src/
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── track-server/       <- 服务端包
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── track-platform/     <- 管理平台包
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── doc/                    <- 文档目录
│   └── Requirement.md
├── .gitignore
├── package.json           <- 根目录 package.json
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