
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { FeedbackModalProvider } from './src/contexts/FeedbackModalContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <FeedbackModalProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </FeedbackModalProvider>
    </SafeAreaProvider>
  );
}
