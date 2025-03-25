'use client';

import { useState } from 'react';

export default function TwitterPost() {
  const [instruction, setInstruction] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeImage, setIncludeImage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    /* Commenting out authentication check
    if (!secretKey.trim()) {
      setStatus('Error: Secret key is required');
      return;
    }
    */
    setIsLoading(true);
    setStatus('');

    try {
      const endpoint = includeImage ? '/api/twitter/post-image' : '/api/twitter/post';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          /* Commenting out authentication header
          'Authorization': `Bearer ${secretKey.trim()}`
          */
        },
        body: JSON.stringify({ instruction }),
      });

      const data = await response.json();
      setStatus(response.ok ? data.message : `Error: ${data.message}`);
    } catch {
      setStatus('Failed to post tweet');
    } finally {
      setIsLoading(false);
    }
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
        
        {/* Authentication Section - Temporarily disabled */}
        {/* 
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your secret key"
              className="w-full p-2 border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-md"
              disabled={isLoading}
            />
          </div>
        </div>
        */}

        {/* Tweet Form Section */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
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
            {status}
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