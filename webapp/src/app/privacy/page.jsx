import PageInfoSection from "@/app/graphs/components/templates/PageInfoSection";
import React from "react";

export const metadata = {
    title: 'Privacy Policy - Olympic Venues Visualization',
    description: 'Privacy policy for the Olympic venues visualization project',
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <PageInfoSection
                headline={""}
                subline={""}
                href={"/"}
                linkText={"Back to Home"}
                icon={
                    <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 17l-5-5m0 0l5-5m-5 5h12"/>
                    </svg>
                }/>

            <div className="max-w-4xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-lg max-w-none dark:prose-invert">
                    <p className="text-lg text-muted-foreground mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                        <p>
                            This website is a research project for Computational Spatial Humanities at University
                            Leipzig.
                            We do not collect personal information from users. The website operates entirely client-side
                            and does not store user data or track user behavior.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
                        <p>
                            All Olympic venue data displayed on this website is sourced from:
                        </p>
                        <ul className="list-disc pl-6 mt-2">
                            <li>Olympedia.org (publicly available Olympic venue information)</li>
                            <li>International Olympic Committee reports and publications</li>
                            <li>Academic research and publicly available datasets</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Cookies and Local Storage</h2>
                        <p>
                            This website may use local storage to save your theme preferences (dark/light mode)
                            and other user interface settings. No personal information is stored.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
                        <p>
                            This website uses MapLibre for map visualization. Please refer to MapLibre's privacy
                            policy for information about their data handling practices.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Academic Use</h2>
                        <p>
                            This project is developed as part of academic research. Any aggregated, anonymous
                            usage patterns may be analyzed for research purposes only.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
                        <p>
                            For questions about this privacy policy or the research project, please contact us
                            through our <a href="https://github.com/TheFpiasta/study-csh-olympics/issues"
                                           className="text-primary hover:underline">GitHub Issues page</a>.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
                        <p>
                            We may update this privacy policy from time to time. Any changes will be posted
                            on this page with an updated revision date.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
