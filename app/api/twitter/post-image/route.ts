import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

// Twitter API client setup
const twitterClient = new TwitterApi({
  appKey: process.env.X_CONSUMER_KEY as string,
  appSecret: process.env.X_CONSUMER_SECRET as string,
  accessToken: process.env.X_ACCESS_TOKEN as string,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET as string,
});

// Temporarily disabled authentication
// const SECRET_KEY = process.env.TWITTER_POST_SECRET;

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

// Add new function to generate image using DALL-E 3
async function generateAIImage(prompt: string): Promise<string> {
  const refinedPrompt = `Create a visually stunning and viral image that perfectly complements this tweet: "${prompt}". Ensure the image is engaging and vibrant with modern design elements.`;
  
  const response = await axios.post(
    "https://api.openai.com/v1/images/generations",
    {
      model: "dall-e-3",
      prompt: refinedPrompt,
      n: 1,
      size: "1024x1024",
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    }
  );

  return response.data.data[0].url;
}

// Add rate limit tracking
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_REQUESTS = 50; // Adjust based on your API tier
let requestCount = 0;
let windowStart = Date.now();

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

// Modify postTweet to handle image posting
async function postTweet(tweetText: string, imageUrl?: string): Promise<{ id: string; url: string }> {
  try {
    // Check rate limit before proceeding
    if (!await checkRateLimit()) {
      const waitTime = RATE_LIMIT_WINDOW - (Date.now() - windowStart);
      console.log(`Rate limit reached. Need to wait ${Math.ceil(waitTime / 1000)} seconds`);
      throw new Error('Rate limit exceeded');
    }

    // Content moderation check - only check upper limit since we validate minimum length earlier
    if (tweetText.length > 280) {
      throw new Error('Tweet exceeds maximum length of 280 characters');
    }

    if (imageUrl) {
      console.log('Downloading image from URL...');
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      
      console.log('Uploading media to Twitter...');
      const mediaId = await twitterClient.v1.uploadMedia(Buffer.from(imageResponse.data), {
        mimeType: 'image/png',
        target: 'tweet'
      });
      console.log('Media uploaded successfully, ID:', mediaId);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Posting tweet with media...');
      try {
        // Get current user's ID first
        const me = await twitterClient.v2.me();
        const tweet = await twitterClient.v2.tweet({
          text: tweetText,
          media: { media_ids: [mediaId] }
        });
        return {
          id: tweet.data.id,
          url: `https://twitter.com/${me.data.id}/status/${tweet.data.id}`
        };
      } catch (error: unknown) {
        interface TwitterApiError {
          code?: number;
          response?: {
            status: number;
            data: unknown;
            headers: Record<string, string>;
          };
          rateLimit?: {
            reset: number;
          };
        }

        if (error instanceof Error) {
          const twitterError = error as Error & TwitterApiError;
          
          console.error('Full error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            response: twitterError.response?.data,
            rateLimit: twitterError.response?.headers?.['x-rate-limit-remaining'],
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
    } else {
      // Get current user's ID first
      const me = await twitterClient.v2.me();
      const tweet = await twitterClient.v2.tweet(tweetText);
      return {
        id: tweet.data.id,
        url: `https://twitter.com/${me.data.id}/status/${tweet.data.id}`
      };
    }
  } catch (error: unknown) {
    interface TwitterApiError {
      code?: number;
      response?: {
        status: number;
        data: unknown;
        headers: Record<string, string>;
      };
      rateLimit?: {
        reset: number;
      };
    }

    if (error instanceof Error) {
      const twitterError = error as Error & TwitterApiError;
      
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: twitterError.response?.data,
        rateLimit: twitterError.response?.headers?.['x-rate-limit-remaining'],
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

// Modify POST route to include image generation
export async function POST(req: Request) {
  try {
    // Temporarily disabled authentication check
    /*
    // Verify auth token
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token || token !== SECRET_KEY) {
      console.error("❌ Unauthorized access attempt with token:", token);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */

    const body = await req.json();
    
    if (!body.instruction) {
      return NextResponse.json(
        { error: 'Missing instruction in request body' },
        { status: 400 }
      );
    }

    const tweetText = await generateTweetText(body.instruction);
    
    // Content validation
    if (!tweetText || tweetText.length < 5) {
      return NextResponse.json(
        { error: "Generated tweet is too short or empty." },
        { status: 400 }
      );
    }

    let imageUrl;
    try {
      imageUrl = await generateAIImage(tweetText);
    } catch (error) {
      console.error('Error generating image:', error);
      return NextResponse.json(
        { error: "Failed to generate image. Please try again." },
        { status: 500 }
      );
    }

    // Post with image
    const result = await postTweet(tweetText, imageUrl);

    return NextResponse.json({ 
      message: `Tweet posted successfully!`,
      tweet: result
    });
  } catch (error: unknown) {
    interface TwitterErrorResponse {
      code: number;
      message: string;
    }

    const errorResponse: TwitterErrorResponse = {
      code: 500,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    return NextResponse.json(errorResponse, { status: errorResponse.code });
  }
}
