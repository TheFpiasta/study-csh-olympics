import Link from "next/link";

export default function GraphicsPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Graphics Page</h1>
            <p className="text-lg">This is the graphics page where you can visualize data.</p>
            {/* Add your graphics components here */}

            <div className="mt-4">
                <Link href={"/"} className={"px-4 py-2 rounded bg-green-200 hover:bg-green-300"}>
                    Back to Overview
                </Link>
            </div>
        </div>
    )
}