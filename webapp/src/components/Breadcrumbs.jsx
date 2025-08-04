'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Breadcrumbs = () => {
  const pathname = usePathname();
  
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  
  const breadcrumbs = [
    { label: 'Home', href: '/', icon: '🏠' },
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      const icon = segment === 'map' ? '🗺️' : segment === 'graphs' ? '📊' : '📄';
      
      return { label, href, icon };
    })
  ];

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
              <span>{breadcrumb.icon}</span>
              <span>{breadcrumb.label}</span>
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <span>{breadcrumb.icon}</span>
              <span>{breadcrumb.label}</span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
