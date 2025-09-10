import React from "react";

export default function SectionHeader({headline, description}) {
    return (
        <div
            className="bg-gradient-to-r from-[var(--olympic-medal-silver)]/80 via-[var(--olympic-medal-gold)]/80 to-[var(--olympic-medal-bronze)]/80 rounded-2xl p-6">
            <div className={"text-center text-olympic-black-6"}>
                <h2 className="text-2xl font-bold items-center gap-2 text-olympic-black-6">
                    {headline}
                </h2>
                <p className="text-sm mt-1">
                    {description}
                </p>
            </div>
        </div>
    )
}