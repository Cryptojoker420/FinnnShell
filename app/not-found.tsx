export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">404 - Not Found</h1>
        <p className="mb-4">Fiinn's lost you do not exist.</p>
        <a href="/" className="text-blue-600 underline">
          Go home
        </a>
      </div>
    </div>
  );
}