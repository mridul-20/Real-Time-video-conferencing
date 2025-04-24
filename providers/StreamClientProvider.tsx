'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Maximum number of connection retries
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [error, setError] = useState<string>();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const initializeClient = async () => {
      try {
        if (!isLoaded || !user) return;
        if (!API_KEY) throw new Error('Stream API key is missing');

        console.log('Initializing Stream client with API key:', API_KEY);

        // Create client with specific configuration
        const client = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: user?.id,
            name: user?.username || user?.id,
            image: user?.imageUrl,
          },
          tokenProvider,
          options: {
            logLevel: 'debug', // Enable debug logging
            baseURL: 'https://video.stream-io-api.com', // Explicitly set base URL
            timeout: 10000, // Increase timeout to 10 seconds
          },
        });

        // Function to attempt connection with retries
        const connectWithRetries = async (retries = 0): Promise<void> => {
          try {
            console.log(`Attempting connection (attempt ${retries + 1}/${MAX_RETRIES})`);
            await client.connectUser({ 
              id: user.id,
              name: user?.username || user?.id,
              image: user?.imageUrl,
            });
            console.log('Stream client connected successfully');
            setVideoClient(client);
          } catch (err) {
            console.error(`Connection attempt ${retries + 1} failed:`, err);
            
            if (retries < MAX_RETRIES) {
              console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              await connectWithRetries(retries + 1);
            } else {
              throw new Error(`Failed to connect after ${MAX_RETRIES} attempts: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        };

        await connectWithRetries();
      } catch (err) {
        console.error('Error initializing Stream client:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize video client');
      }
    };

    initializeClient();

    // Cleanup function
    return () => {
      if (videoClient) {
        console.log('Disconnecting Stream client');
        videoClient.disconnectUser();
      }
    };
  }, [user, isLoaded]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
