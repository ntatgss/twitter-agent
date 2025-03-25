import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

// For the any types, let's create proper interfaces
interface TwitterErrorResponse {
  code: number;
  message: string;
  data?: unknown;
}

interface TwitterApiError extends Error {
  code?: number;
  response?: {
    status: number;
    headers: {
      'x-rate-limit-remaining': string;
    };
    data: unknown;
  };
  rateLimit?: {
    reset: number;
  };
}

// Twitter API client setup
const twitterClient = new TwitterApi({
  appKey: process.env.X_CONSUMER_KEY as string,
  appSecret: process.env.X_CONSUMER_SECRET as string,
  accessToken: process.env.X_ACCESS_TOKEN as string,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET as string,
});

// Add rate limit tracking
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_REQUESTS = 50; // Adjust based on your API tier
let requestCount = 0;
let windowStart = Date.now();

// Temporarily disabled authentication
// const SECRET_KEY = process.env.TWITTER_POST_SECRET;

async function checkRateLimit(): Promise<boolean> {
  const now = Date.now();
  if (now - windowStart >= RATE_LIMIT_WINDOW) {
    requestCount = 0;
    windowStart = now;
  }
  
  if (requestCount >= MAX_REQUESTS) {
    return false;
  }
  
  requestCount++;
  return true;
}

// OpenAI API call to generate tweet text
async function generateTweetText(finalInstruction: string): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "o3-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a tweet generator. Your responses MUST be 280 characters or less. Never exceed this limit. Do not include quotes or formatting - just the tweet text."
          },
          { 
            role: "user", 
            content: `Write a tweet about: ${finalInstruction}. Remember: must be 280 characters or less.` 
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      }
    );

    const tweetText = response.data.choices[0].message.content.trim();
    // Failsafe: ensure tweet doesn't exceed 280 chars
    return tweetText.length > 280 ? tweetText.slice(0, 280).trim() : tweetText;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error generating tweet text:', error.message);
      return 'This is AI Agent';  // Fallback text if generation fails
    } else {
      console.error('An unexpected error occurred:', error);
      return 'This is AI Agent';  // Fallback text if an unexpected error occurs
    }
  }
}

// Function to post tweet on Twitter
async function postTweet(tweetText: string, retryCount = 0): Promise<string> {
  try {
    // Check rate limit before proceeding
    if (!await checkRateLimit()) {
      const waitTime = RATE_LIMIT_WINDOW - (Date.now() - windowStart);
      console.log(`Rate limit reached. Need to wait ${Math.ceil(waitTime / 1000)} seconds`);
      throw new Error('Rate limit exceeded');
    }

    // Content moderation check - only check upper limit
    if (tweetText.length > 280) {
      throw new Error('Tweet exceeds maximum length of 280 characters');
    }

    try {
      const tweet = await twitterClient.v2.tweet(tweetText);
      return `Tweet posted with ID ${tweet.data.id}`;
    } catch (error: unknown) {
      if (error instanceof Error) {
        const twitterError = error as TwitterApiError;
        if (twitterError.code === 429 || twitterError.response?.status === 429) {
          const resetTime = twitterError.rateLimit?.reset || 60;
          console.log(`Twitter rate limited. Waiting ${resetTime} seconds...`);
          if (retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, (resetTime + 1) * 1000));
            return postTweet(tweetText, retryCount + 1);
          }
        }
      }
      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: 'response' in error ? ((error as { response: { data: unknown } }).response.data) : undefined,
        rateLimit: 'response' in error ? ((error as { response: { headers: { 'x-rate-limit-remaining': string } } }).response.headers['x-rate-limit-remaining']) : undefined,
        timestamp: new Date().toISOString()
      });

      if (error.message.includes('Rate limit exceeded')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to post tweet: ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
      throw new Error('Failed to post tweet due to an unexpected error.');
    }
  }
}

// POST route for handling the tweet generation and posting
export async function POST(req: Request) {
  try {
    // Temporarily disabled authentication check
    /* 
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token || token !== SECRET_KEY) {
      console.error("❌ Unauthorized access attempt with token:", token);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("❌ Error parsing request body:", error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    if (!body.instruction) {
      return NextResponse.json(
        { error: 'Missing instruction in request body' },
        { status: 400 }
      );
    }

    const tweetText = await generateTweetText(body.instruction);
    
    // Update error handling types
    if (!tweetText) {
      const errorResponse: TwitterErrorResponse = {
        code: 500,
        message: 'Failed to generate tweet text',
      };
      return NextResponse.json(errorResponse, { status: errorResponse.code });
    }

    // Content validation
    if (!tweetText || tweetText.length < 5) {
      return NextResponse.json(
        { error: "Generated tweet is too short or empty." },
        { status: 400 }
      );
    }

    const result = await postTweet(tweetText);
    return NextResponse.json({ message: result });
  } catch (error: unknown) {
    const errorResponse: TwitterErrorResponse = {
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: errorResponse.code });
  }
}
