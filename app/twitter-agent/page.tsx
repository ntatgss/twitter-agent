'use client';

import { useState, useEffect } from 'react';

interface TwitterAccount {
  username: string;
  name: string;
  profileImage: string;
  description: string;
  followers: number;
  following: number;
  tweets: number;
  lastUpdated: number;
}

interface TweetResponse {
  message: string;
  tweet: {
    id: string;
    url: string;
  };
}

const CACHE_KEY = 'twitter_account_info';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default function TwitterPost() {
  const [instruction, setInstruction] = useState('');
  const [status, setStatus] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeImage, setIncludeImage] = useState(false);
  const [account, setAccount] = useState<TwitterAccount | null>(null);
  const [accountError, setAccountError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const isCacheValid = (cachedData: TwitterAccount): boolean => {
    return Date.now() - cachedData.lastUpdated < CACHE_DURATION;
  };

  const fetchAccountInfo = async (forceRefresh = false) => {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData) as TwitterAccount;
          if (isCacheValid(parsedCache)) {
            setAccount(parsedCache);
            return;
          }
        }
      }

      setIsRefreshing(true);
      const response = await fetch('/api/twitter/me');
      if (!response.ok) throw new Error('Failed to fetch account info');
      const data = await response.json();
      
      // Add timestamp to the data
      const accountData: TwitterAccount = {
        ...data,
        lastUpdated: Date.now()
      };

      // Update cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(accountData));
      setAccount(accountData);
    } catch (error) {
      setAccountError('Failed to load Twitter account information');
      console.error('Error fetching account info:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const handleRefreshAccount = () => {
    fetchAccountInfo(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('');
    setTweetUrl('');

    try {
      const endpoint = includeImage ? '/api/twitter/post-image' : '/api/twitter/post';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction }),
      });

      const data = await response.json() as TweetResponse;
      if (response.ok) {
        setStatus(data.message);
        setTweetUrl(data.tweet.url);
      } else {
        setStatus(`Error: ${data.message}`);
      }
    } catch {
      setStatus('Failed to post tweet');
    } finally {
      setIsLoading(false);
    }
  };

  const getMaskedValue = (value: string) => {
    return isPrivate ? '••••••••' : value;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Post a Tweet</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enter instructions below and let AI generate your tweet content
          </p>
        </div>

        {/* Twitter Account Info */}
        {account ? (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16">
                  {isPrivate ? (
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={account.profileImage}
                      alt={account.name}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getMaskedValue(account.name)}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">@{getMaskedValue(account.username)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {isPrivate ? '••••••••••••••••••••••••••••••••••••••••' : account.description}
                  </p>
                  <div className="flex space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{account.followers.toLocaleString()} followers</span>
                    <span>{account.following.toLocaleString()} following</span>
                    <span>{account.tweets.toLocaleString()} tweets</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  title={isPrivate ? "Show account info" : "Hide account info"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isPrivate ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={handleRefreshAccount}
                  disabled={isRefreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Refresh account info"
                >
                  <svg
                    className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(account.lastUpdated).toLocaleString()}
            </div>
          </div>
        ) : accountError ? (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{accountError}</p>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {/* Tweet Form Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Include AI-generated image</span>
              </label>
            </div>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={includeImage ? "Describe the tweet and image you want to generate..." : "Enter your tweet instruction..."}
              className="w-full p-3 border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !instruction}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 transition-colors duration-200"
            >
              {isLoading ? 'Posting...' : `Post Tweet${includeImage ? ' with Image' : ''}`}
            </button>
          </form>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`mt-6 p-4 rounded-md border ${
            status.includes('Error') 
              ? 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300' 
              : 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <p>{status}</p>
              {tweetUrl && (
                <a
                  href={tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  View Tweet
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Example Instructions */}
        <div className="mt-8 p-5 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Example Instructions</h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li>• "Create a tweet about the latest advancements in AI technology"</li>
            <li>• "Generate a motivational message for Monday morning with an inspiring image"</li>
            <li>• "Write a tweet announcing a new product launch with an image that represents innovation"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}