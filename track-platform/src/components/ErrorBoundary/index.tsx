import React from 'react';
import { Alert } from 'tdesign-react';

export function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: '20px' }}>
      <Alert
        theme="error"
        title="出错了"
        operation={<span>{error.message}</span>}
        style={{ marginBottom: '16px' }}
      />
    </div>
  );
} 