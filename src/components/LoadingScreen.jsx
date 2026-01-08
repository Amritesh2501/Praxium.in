import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';

export default function LoadingScreen({ onComplete }) {
    const [fading, setFading] = useState(false);

    useEffect(() => {
        const totalDuration = 3000;

        const timer = setTimeout(() => {
            setFading(true);
            setTimeout(onComplete, 500); // Wait for transition
        }, totalDuration);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`loading-screen ${fading ? 'fade-out' : ''}`}>
            <div className="loading-card">
                <div className="shape cross"></div>
                <div className="shape circle"></div>
                <div className="shape square"></div>

                <h1 className="loading-text">PRAXIUM.AI</h1>
                <div className="progress-container">
                    <div className="progress-fill"></div>
                </div>
            </div>
        </div>
    );
}
