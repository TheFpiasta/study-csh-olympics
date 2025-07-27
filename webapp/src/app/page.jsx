import Image from "next/image";
import Link from "next/link";

export default function Home() {
    return (
        <div className="p-3 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-6">Welcome to the Olympic venues Web App</h1>
            <p className="text-lg mb-8">Explore our features:</p>
            <div className="space-x-4">
                <Link href={"/map"} className={"px-4 py-2 rounded bg-cyan-200 hover:bg-cyan-300"}>
                    Go to Map
                </Link>
                <Link href={"/graphs"} className={"px-4 py-2 rounded bg-amber-200 hover:bg-amber-300"}>
                    Go to Graphs
                </Link>
            </div>

            <div className="mt-8">
                <Link href={"https://github.com/TheFpiasta/study-csh-olympics"} about={"_blank"} className="text-blue-500 hover:underline">
                    View on GitHub
                </Link>
            </div>

            {/*stick to the bottom*/}
            <footer className="mt-12 text-gray-500 text-sm bottom-5 absolute">
                <p>A Project for the University Leipzig in the modul Computational Spatial Humanities</p>
            </footer>

        </div>
    );
}
