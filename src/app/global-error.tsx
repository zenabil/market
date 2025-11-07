'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FirestorePermissionError } from '@/firebase/errors';
import { useLanguage } from '@/contexts/language-provider';
import { TriangleAlert } from 'lucide-react';
import React from 'react';

// This component acts as a global error boundary for the application.
// It is particularly designed to catch and provide a rich debugging experience
// for FirestorePermissionError, which is thrown by our custom FirebaseErrorListener.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isPermissionError = error instanceof FirestorePermissionError;
  const { t } = useLanguage();

  const copyToClipboard = () => {
    if (isPermissionError) {
      navigator.clipboard.writeText(JSON.stringify(error.request, null, 2));
      alert('Error details copied to clipboard!');
    }
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl text-center shadow-2xl">
            <CardHeader>
              <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit">
                <TriangleAlert className="h-8 w-8" />
              </div>
              <CardTitle className="mt-4 text-2xl font-headline">
                {isPermissionError ? t('globalError.permissionError.title') : t('globalError.applicationError.title')}
              </CardTitle>
              <CardDescription>
                {isPermissionError
                  ? t('globalError.permissionError.description')
                  : t('globalError.applicationError.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPermissionError ? (
                <div className="text-left bg-muted p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
                  <pre>{JSON.stringify(error.request, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-left bg-muted p-4 rounded-md font-mono text-sm">
                  <p>{error.message}</p>
                  {error.stack && <pre className="mt-4 text-xs whitespace-pre-wrap">{error.stack}</pre>}
                </div>
              )}
              <div className="mt-6 flex justify-center gap-4">
                <Button onClick={() => reset()}>{t('globalError.retry')}</Button>
                {isPermissionError && (
                  <Button variant="outline" onClick={copyToClipboard}>
                    {t('globalError.copyDetails')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
