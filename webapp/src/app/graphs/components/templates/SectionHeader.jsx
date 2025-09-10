import React from "react";

export default function SectionHeader({headline, description}) {
    return (
        <div
            className="bg-gradient-to-r dark:from-[var(--olympic-medal-bronze)]/70 dark:to-[var(--olympic-medal-gold)]/80 rounded-2xl p-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-olympic-black-6">
                    {headline}
                    {/*<span className="text-sm font-normal text-olympic-black-5">*/}
                    {/*      Infrastructure Evolution Over Time*/}
                    {/*    </span>*/}
                </h2>
                <p className="text-sm mt-1 text-olympic-black-5">
                    {description}
                </p>
            </div>
        </div>
    )
}