const OlympicRings = ({className = "", size = "w-24 h-24"}) => {
    return (
        <div className={`${className} ${size} relative`}>
            <svg viewBox="0 0 200 120" className="w-full h-full">
                {/* Blue ring */}
                <circle
                    cx="40"
                    cy="40"
                    r="24"
                    fill="none"
                    stroke="#0081C8"
                    strokeWidth="6"
                    className="animate-pulse"
                    style={{animationDelay: "0s"}}
                />
                {/* Yellow ring */}
                <circle
                    cx="100"
                    cy="40"
                    r="24"
                    fill="none"
                    stroke="#FCB131"
                    strokeWidth="6"
                    className="animate-pulse"
                    style={{animationDelay: "0.2s"}}
                />
                {/* Black ring */}
                <circle
                    cx="160"
                    cy="40"
                    r="24"
                    fill="none"
                    stroke="#00A651"
                    strokeWidth="6"
                    className="animate-pulse"
                    style={{animationDelay: "0.4s"}}
                />
                {/* Green ring */}
                <circle
                    cx="70"
                    cy="70"
                    r="24"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="6"
                    className="animate-pulse dark:stroke-white"
                    style={{animationDelay: "0.6s"}}
                />
                {/* Red ring */}
                <circle
                    cx="130"
                    cy="70"
                    r="24"
                    fill="none"
                    stroke="#EE334E"
                    strokeWidth="6"
                    className="animate-pulse"
                    style={{animationDelay: "0.8s"}}
                />
            </svg>
        </div>
    );
};

export default OlympicRings;
