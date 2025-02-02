# nomad_sdk
SDK Kit for platform statistics based on functional settings

## Features

- Event tracking and reporting
- Page initialization and registration
- Common parameter management  
- User environment info collection
- Error monitoring and reporting
- Queue-based batch reporting
- Request limiting
- White screen monitoring

## Installation

```bash
npm install nomad-sdk
```

## Usage

```typescript
import { register, sendEvent, addCommonParams } from 'nomad-sdk'

// Initialize SDK
register({
  projectId: 'your-project-id',
  uploadPercent: 0.1
})

// Add common parameters
addCommonParams({
  channel: 'web',
  version: '1.0.0'
})

// Track events
sendEvent('button_click', {
  buttonId: 'submit-btn',
  page: '/home'
})
```

## Documentation

[Requirements Doc](./doc/Requirement.md)

## License

MIT
