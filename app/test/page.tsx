'use client';

import { useEffect } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';

export default function TestPage() {
  const client = useStreamVideoClient();

  useEffect(() => {
    const testConnection = async () => {
      if (!client) return;

      try {
        const call = client.call('default', 'test-call');
        await call.getOrCreate();
        console.log('Test call created successfully');
      } catch (error) {
        console.error('Error creating test call:', error);
      }
    };

    testConnection();
  }, [client]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Stream Video Test Page</h1>
      <p>Check the console for connection logs</p>
    </div>
  );
} 