import { Slot } from 'expo-router';
import { AuthProvider } from './authContext';
import React from 'react';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
