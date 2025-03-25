# Twitter Agent

A Next.js application that acts as an AI-powered Twitter/X posting agent. Generate and post tweets with optional AI-generated images using OpenAI's GPT and DALL-E models.

## Features

- 🤖 AI-powered tweet generation
- 🖼️ Optional AI-generated images to accompany tweets
- 🔄 Simple user interface for creating tweets
- 🔒 Rate limiting protection for Twitter API
- ⚡ Built with Next.js and React

## Prerequisites

To use this application, you need:

1. Twitter Developer Account with API v2 access
2. OpenAI API key for GPT and DALL-E
3. Node.js and npm/yarn installed

## Obtaining API Keys

### Twitter/X API Credentials

1. Create a Twitter Developer Account:
   - Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Sign in with your Twitter account
   - Apply for a developer account if you don't have one

2. Create a new Project and App:
   - In the Developer Portal, click on "Projects & Apps" > "Overview" > "Create Project"
   - Give your project a name and select a use case
   - Create a new app within the project

3. Set up App permissions:
   - Go to the "Settings" tab for your app
   - Under "User authentication settings", enable OAuth 1.0a
   - Set App permissions to "Read and Write"
   - Add callback URLs (use http://localhost:3000 for local development)
   - Save your changes

4. Get your credentials:
   - Go to the "Keys and tokens" tab
   - You'll need:
     - API Key (Consumer Key) and API Key Secret (Consumer Secret)
     - Access Token and Access Token Secret
     - Bearer Token
     - Client ID and Client Secret

### OpenAI API Key

1. Create an OpenAI account:
   - Go to [OpenAI's website](https://openai.com/)
   - Sign up for an account if you don't have one

2. Get your API key:
   - Navigate to [API Keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Give your key a name and copy it (you won't be able to see it again)

3. Set up billing (required for API access):
   - Go to [Billing settings](https://platform.openai.com/account/billing/overview)
   - Add a payment method
   - You'll need credits for both GPT (text generation) and DALL-E (image generation)

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/twitter-agent.git
cd twitter-agent
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
X_BEARER_TOKEN=your_twitter_bearer_token
X_CONSUMER_KEY=your_twitter_consumer_key
X_CONSUMER_SECRET=your_twitter_consumer_secret
X_ACCESS_TOKEN=your_twitter_access_token
X_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
X_APP_CLIENT_ID=your_twitter_app_client_id
X_APP_CLIENT_SECRET=your_twitter_app_client_secret
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000/twitter-agent](http://localhost:3000/twitter-agent) in your browser to use the application.

## How to Use

1. Navigate to `/twitter-agent` in your browser
2. Type your tweet instruction in the text area
3. Toggle the "Include AI-generated image" checkbox if you want an image
4. Click the "Post Tweet" button
5. Wait for the AI to generate and post your tweet

## Example Instructions

- "Create a tweet about the latest advancements in AI technology"
- "Generate a motivational message for Monday morning with an inspiring image"
- "Write a tweet announcing a new product launch with an image that represents innovation"

## Technical Details

This project uses:

- Next.js 15.x with App Router
- React 19.x
- Twitter API v2 via twitter-api-v2 library
- OpenAI API for text and image generation
- TailwindCSS for styling

## Deployment

Deploy your own Twitter Agent on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Ftwitter-agent&env=OPENAI_API_KEY,X_BEARER_TOKEN,X_CONSUMER_KEY,X_CONSUMER_SECRET,X_ACCESS_TOKEN,X_ACCESS_TOKEN_SECRET,X_APP_CLIENT_ID,X_APP_CLIENT_SECRET)

## License

MIT
"# twitter-agent" 
