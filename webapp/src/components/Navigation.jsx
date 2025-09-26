'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import OlympicRings from './OlympicRings';

const Navigation = () => {
    const pathname = usePathname();

    const navItems = [
        {href: '/', label: 'Home', icon: '🏠', color: 'from-blue-500 to-blue-600'},
        {href: '/map', label: 'Map', icon: '🗺️', color: 'from-cyan-500 to-blue-500'},
        {href: '/graphs', label: 'Analytics', icon: '📊', color: 'from-amber-500 to-orange-500'},
    ];

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden no-print">
                <div className="glass rounded-2xl p-2 shadow-2xl border border-white/20">
                    <div className="flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300
                  ${pathname === item.href
                                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                }
                `}
                                aria-label={`Navigate to ${item.label}`}
                            >
                                <span className="text-base mb-1">{item.icon}</span>
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Desktop Top Navigation - Hidden by default, shown on larger screens if needed */}
            <nav className="hidden lg:block fixed top-4 left-4 z-40 no-print">
                <div className="glass rounded-2xl p-3 shadow-xl border border-white/20">
                    <div className="flex items-center space-x-4">
                        <OlympicRings size="w-8 h-8"/>
                        <div className="flex space-x-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                    ${pathname === item.href
                                        ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }
                  `}
                                    aria-label={`Navigate to ${item.label}`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navigation;
