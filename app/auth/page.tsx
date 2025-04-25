'use client';

import Image from 'next/image';
import AuthForm from '@/components/Auth';

export default function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="mb-8">
        <Image
          src="/logo.png"
          alt="Logo"
          width={200}
          height={100}
          priority
        />
      </div>
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <AuthForm />
      </div>
    </div>
  );
} 