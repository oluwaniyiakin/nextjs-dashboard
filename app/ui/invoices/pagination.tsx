'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { generatePagination } from '@/app/lib/utils';

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get('page')) || 1;
  const allPages = generatePagination(currentPage, totalPages);

  function createPageURL(pageNumber: number | string) {
    const params = new URLSearchParams(searchParams.toString());

    if (typeof pageNumber === 'number') {
      params.set('page', pageNumber.toString());
    }

    return `${pathname}?${params.toString()}`;
  }

  function goToPage(pageNumber: number) {
    const url = createPageURL(pageNumber);
    router.push(url);
  }

  return (
    <div className="inline-flex">
      <PaginationArrow
        direction="left"
        onClick={() => goToPage(currentPage - 1)}
        isDisabled={currentPage <= 1}
      />

      <div className="flex -space-x-px">
        {allPages.map((page, index) => {
          let position: 'first' | 'last' | 'single' | 'middle' | undefined;

          if (index === 0) position = 'first';
          if (index === allPages.length - 1) position = 'last';
          if (allPages.length === 1) position = 'single';
          if (page === '...') position = 'middle';

          return (
            <PaginationNumber
              key={`${page}-${index}`}
              page={page}
              isActive={currentPage === page}
              position={position}
              onClick={() => typeof page === 'number' && goToPage(page)}
            />
          );
        })}
      </div>

      <PaginationArrow
        direction="right"
        onClick={() => goToPage(currentPage + 1)}
        isDisabled={currentPage >= totalPages}
      />
    </div>
  );
}

function PaginationNumber({
  page,
  isActive,
  position,
  onClick,
}: {
  page: number | string;
  isActive: boolean;
  position?: 'first' | 'last' | 'middle' | 'single';
  onClick?: () => void;
}) {
  const className = clsx(
    'flex h-10 w-10 items-center justify-center text-sm border cursor-pointer',
    {
      'rounded-l-md': position === 'first' || position === 'single',
      'rounded-r-md': position === 'last' || position === 'single',
      'z-10 bg-blue-600 border-blue-600 text-white': isActive,
      'hover:bg-gray-100': !isActive && position !== 'middle',
      'text-gray-300 cursor-default': position === 'middle',
    }
  );

  if (position === 'middle') {
    return <div className={className}>{page}</div>;
  }

  return (
    <div onClick={onClick} className={className}>
      {page}
    </div>
  );
}

function PaginationArrow({
  direction,
  isDisabled,
  onClick,
}: {
  direction: 'left' | 'right';
  isDisabled?: boolean;
  onClick: () => void;
}) {
  const className = clsx(
    'flex h-10 w-10 items-center justify-center rounded-md border',
    {
      'pointer-events-none text-gray-300': isDisabled,
      'hover:bg-gray-100 cursor-pointer': !isDisabled,
      'mr-2 md:mr-4': direction === 'left',
      'ml-2 md:ml-4': direction === 'right',
    }
  );

  const icon =
    direction === 'left' ? (
      <ArrowLeftIcon className="w-4" />
    ) : (
      <ArrowRightIcon className="w-4" />
    );

  return (
    <div onClick={!isDisabled ? onClick : undefined} className={className}>
      {icon}
    </div>
  );
}
