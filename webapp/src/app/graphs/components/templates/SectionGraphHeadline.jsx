export default function ({children, headline, description, infoText}) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    {/*&#10627; {headline} &#10628;*/}
                    <span className={"text-olympic-medal-gold"}>&#8277;</span> <span className={""}>{headline}</span>
                    {/*&#11094; {headline}*/}
                    {/*&#8267; {headline}*/}
                    {/*&#11146; {headline}*/}

                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                    {children}
                </div>
            </div>
            {description && (
                <div className="text-sm font-normal mb-4 ml-6">
                    {description}
                </div>
            )}
            {infoText && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 ml-6">
                    <span className={""}>[Note]</span> {infoText}
                </div>
            )}
        </>
    );
}
