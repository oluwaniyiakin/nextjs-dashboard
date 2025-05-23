import Link from 'next/link';
import { FaceFrownIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4">
      <FaceFrownIcon className="w-12 text-gray-400" />
      <h2 className="text-2xl font-semibold">404 Not Found</h2>
      <p>Could not find the requested invoice.</p>
      <Link
        href="/dashboard/invoices"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
      >
        Go Back
      </Link>
    </main>
  );
}
