import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

// Twitter API client setup
const twitterClient = new TwitterApi({
  appKey: process.env.X_CONSUMER_KEY as string,
  appSecret: process.env.X_CONSUMER_SECRET as string,
  accessToken: process.env.X_ACCESS_TOKEN as string,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET as string,
});

export async function GET() {
  try {
    // Get the current user's information
    const me = await twitterClient.v2.me({
      'user.fields': ['profile_image_url', 'description', 'public_metrics']
    });

    return NextResponse.json({
      username: me.data.username,
      name: me.data.name,
      profileImage: me.data.profile_image_url,
      description: me.data.description,
      followers: me.data.public_metrics?.followers_count,
      following: me.data.public_metrics?.following_count,
      tweets: me.data.public_metrics?.tweet_count
    });
  } catch (error) {
    console.error('Error fetching Twitter account info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitter account information' },
      { status: 500 }
    );
  }
} 