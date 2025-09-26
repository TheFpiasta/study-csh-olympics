'use client';

import React, {useState, useEffect} from 'react';

const SectionNavigation = () => {
    const [activeSection, setActiveSection] = useState('');
    const [isSticky, setIsSticky] = useState(false);

    const sections = [
        {id: 'dataset-statistics', label: 'Dataset Statistics', icon: '📊'},
        {id: 'olympic-metrics', label: 'Olympic Metrics', icon: '🏅'},
        {id: 'geographical-analysis', label: 'Geographical Analysis', icon: '🌍'},
        {id: 'venue-building', label: 'Venue Building', icon: '🏟️'},
        {id: 'venue-usage', label: 'Venue Usage', icon: '📈'},
        {id: 'cost-profitability', label: 'Cost & Profitability', icon: '💰'},
    ];

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsSticky(scrollPosition > 250);

            // Find the currently visible section
            const sectionElements = sections.map(section =>
                document.getElementById(section.id)
            );

            const currentSection = sectionElements.find(element => {
                if (!element) return false;
                const rect = element.getBoundingClientRect();
                return rect.top <= 100 && rect.bottom >= 100;
            });

            if (currentSection) {
                setActiveSection(currentSection.id);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offsetTop = element.offsetTop - 100; // Account for sticky header
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    };

    return (
        <>
            {/* Original Navigation - Always visible */}
            <nav
                className="relative bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg transition-all duration-300">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                            🧭 Quick Navigation
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                    activeSection === section.id
                                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <span className="text-sm">{section.icon}</span>
                                <span className="hidden sm:inline truncate">
                                    {section.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                        Click any section to jump directly to it
                    </div>
                </div>
            </nav>

            {/* Sticky Navigation - Appears/disappears on scroll */}
            {isSticky && (
                <nav
                    className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-600/50 z-50 transition-all duration-300">
                    <div className="px-4 py-2">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                                className="flex-shrink-0 text-xs px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-colors"
                            >
                                ↑
                            </button>
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${
                                        activeSection === section.id
                                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="text-sm">{section.icon}</span>
                                    <span className="hidden lg:inline truncate">
                                        {section.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            )}
        </>
    );
};

export default SectionNavigation;
