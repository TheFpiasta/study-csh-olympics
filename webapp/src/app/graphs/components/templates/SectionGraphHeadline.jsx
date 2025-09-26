export default function ({children, headline, description, infoText}) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    {/*&#10627; {headline} &#10628;*/}
                    &#8277; {headline}
                    {/*&#11094; {headline}*/}
                    {/*&#8267; {headline}*/}
                    {/*&#11146; {headline}*/}
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        {description}
                    </span>
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                    {children}
                </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 ">
                Note: {infoText}
            </div>
        </>
    );
}
