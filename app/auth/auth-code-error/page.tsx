export const dynamic = 'force-dynamic';

export default function AuthCodeErrorPage() {
  return (
    <div className="flex items-center justify-center h-screen p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
        <p className="mb-4">
          There was a problem during Twitter login. Please try again.
        </p>
        <a href="/auth/login" className="text-blue-600 underline">
          Return to login
        </a>
      </div>
    </div>
  );
}
