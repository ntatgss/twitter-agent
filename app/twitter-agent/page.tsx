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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Post a Tweet</h1>
      
      {/* Authentication Section - Temporarily disabled */}
      {/* 
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secret Key
          </label>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter your secret key"
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          />
        </div>
      </div>
      */}

      {/* Tweet Form Section */}
      <div className="p-6 bg-white rounded-lg shadow">
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
              <span className="ml-2">Include AI-generated image</span>
            </label>
          </div>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={includeImage ? "Describe the tweet and image you want to generate..." : "Enter your tweet instruction..."}
            className="w-full p-2 border rounded-md h-32"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !instruction}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Posting...' : `Post Tweet${includeImage ? ' with Image' : ''}`}
          </button>
        </form>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`mt-4 p-4 rounded-md ${status.includes('Error') ? 'bg-red-100' : 'bg-green-100'}`}>
          {status}
        </div>
      )}
    </div>
  );
}