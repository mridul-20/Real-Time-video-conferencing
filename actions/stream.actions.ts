'use server';

import { currentUser } from '@clerk/nextjs/server';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export const tokenProvider = async () => {
  try {
    const user = await currentUser();
    console.log('Current user from Clerk:', user?.id);

    if (!user) throw new Error('User is not authenticated');
    if (!STREAM_API_KEY) throw new Error('Stream API key is missing');
    if (!STREAM_API_SECRET) throw new Error('Stream API secret is missing');

    console.log('Initializing Stream client with API key:', STREAM_API_KEY);
    const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

    // Add more time buffer for token expiration
    const expirationTime = Math.floor(Date.now() / 1000) + 24 * 3600; // 24 hours
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    const token = streamClient.createToken(user.id, expirationTime, issuedAt);
    console.log('Token generated successfully:', {
      userId: user.id,
      expiresIn: `${Math.floor((expirationTime - Date.now() / 1000) / 60)} minutes`,
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
    
    return token;
  } catch (error) {
    console.error('Error in token provider:', error);
    console.error('Environment check:', {
      apiKeyPresent: STREAM_API_KEY ? 'Yes' : 'No',
      apiSecretPresent: STREAM_API_SECRET ? 'Yes' : 'No',
      apiKeyLength: STREAM_API_KEY?.length,
      apiSecretLength: STREAM_API_SECRET?.length,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};
