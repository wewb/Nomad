nomad_sdk/
├── packages/
│   ├── track-sdk/           # SDK 部分
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── track-point.ts
│   │   │   ├── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── error-capture.ts
│   │   │   │   ├── event-queue.ts
│   │   │   │   ├── request.ts
│   │   │   │   └── user-info.ts
│   │   │   └── test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── track-server/        # 服务端部分
│   │   └── package.json
│   │
│   └── track-platform/      # 前端平台部分
│       └── package.json
│
├── package.json             # 工作区配置
└── README.md