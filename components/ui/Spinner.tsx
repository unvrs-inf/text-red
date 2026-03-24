"use client";

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-4',
};

export default function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`${sizes[size]} border-gray-300 border-t-blue-500 rounded-full animate-spin`}
    />
  );
}
