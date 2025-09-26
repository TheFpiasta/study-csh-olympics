import PageInfoSection from "@/app/graphs/components/templates/PageInfoSection";
import React from "react";

export const metadata = {
    title: 'Terms of Service - Olympic Venues Visualization',
    description: 'Terms of service for the Olympic venues visualization project',
}

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

                <div className="prose prose-lg max-w-none dark:prose-invert">
                    <p className="text-lg text-muted-foreground mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Academic Research Project</h2>
                        <p>
                            This website is an academic research project developed for Computational Spatial Humanities
                            at University Leipzig. By using this website, you acknowledge that this is a research
                            project
                            and not a commercial service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Use of Data</h2>
                        <p>
                            The Olympic venue data presented on this website is compiled from publicly available sources
                            for educational and research purposes. This includes:
                        </p>
                        <ul className="list-disc pl-6 mt-2">
                            <li>Historical Olympic venue information</li>
                            <li>Geographical coordinates and mapping data</li>
                            <li>Olympic Games reports and statistics</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Open Source License</h2>
                        <p>
                            This project is open source and available on GitHub. The source code is provided under
                            an open source license. You are free to view, fork, and contribute to the project
                            according to the license terms specified in the repository.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Accuracy Disclaimer</h2>
                        <p>
                            While we strive for accuracy, the data presented is for research and educational purposes.
                            We make no warranties about the completeness, reliability, or accuracy of the information.
                            Any reliance on this data is at your own risk.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
                        <p>
                            You may use this website for:
                        </p>
                        <ul className="list-disc pl-6 mt-2">
                            <li>Educational and research purposes</li>
                            <li>Personal learning about Olympic history and venues</li>
                            <li>Academic citation and reference</li>
                        </ul>
                        <p className="mt-4">
                            You may not use this website for commercial purposes without permission.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
                        <p>
                            The compilation, analysis, and presentation of data on this website represents original
                            academic work. While individual data points may be from public sources, the overall
                            research methodology and presentation is the intellectual property of the research team.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                        <p>
                            This is an academic research project provided "as is" without any warranties.
                            The researchers and University Leipzig shall not be liable for any damages arising
                            from the use of this website or its data.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Contact and Issues</h2>
                        <p>
                            For questions, issues, or feedback about these terms or the project, please contact us
                            through our <a href="https://github.com/TheFpiasta/study-csh-olympics/issues"
                                           className="text-primary hover:underline">GitHub Issues page</a>.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Changes will be posted on this
                            page with an updated revision date. Continued use of the website after changes constitutes
                            acceptance of the new terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
