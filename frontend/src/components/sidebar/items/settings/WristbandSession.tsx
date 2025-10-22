import React from 'react';
import { useWristbandSession } from "@wristband/react-client-auth";

export default function WristbandSession() {
  const { metadata } = useWristbandSession();

  if (!metadata) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-r from-primary to-primary-light">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Wristband Session
        </h3>
      </div>
      <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-auto">
        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all font-mono">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
