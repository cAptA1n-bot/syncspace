import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'SyncSpace — Write · Collaborate · Stay in Sync',
  description: 'A modern collaborative workspace for individuals and teams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0F172A] text-[#F8FAFC] antialiased selection:bg-[#2563EB] selection:text-white">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#111F33',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#111F33',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#111F33',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

