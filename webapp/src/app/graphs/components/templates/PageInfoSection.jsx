import OlympicRings from "@/components/OlympicRings";
import Link from "next/link";

export default function PageInfoSection({headline, subline, href, linkText, icon}) {
    return (
        <div className="relative z-10">
            <div
                className="p-6 mx-4 my-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <OlympicRings size="w-12 h-12"/>
                        <div>
                            {headline && (
                                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl dark:text-gray-200">
                                    {headline}
                                </h1>
                            )}
                            {subline && (
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-400 md:text-base">
                                    {subline}
                                </p>
                            )}
                        </div>
                    </div>

                    <Link
                        href={href}
                        className="flex items-center justify-center gap-2 text-sm text-white btn-olympic bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 group md:text-base"
                    >
                        {icon}
                        <span>{linkText}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
