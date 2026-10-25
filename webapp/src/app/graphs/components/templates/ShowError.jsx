import React from "react";

export default function ShowError({error}) {
    return (
        <div className="border border-olympic-red-1 rounded-lg p-6">
            <p className="text-olympic-red-primary dark:text-red-300">Error loading data: {error}</p>
        </div>
    )
}