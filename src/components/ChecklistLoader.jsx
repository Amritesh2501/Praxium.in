import React, { useEffect, useState } from 'react';
import './ChecklistLoader.css';

const ChecklistLoader = ({ mode = 'curating' }) => { // 'curating' or 'evaluating'
    const [checkedItems, setCheckedItems] = useState([false, false, false, false]);

    useEffect(() => {
        let mounted = true;

        const runAnimation = () => {
            if (!mounted) return;
            setCheckedItems([false, false, false, false]); // Reset

            setTimeout(() => mounted && setCheckedItems([true, false, false, false]), 500);
            setTimeout(() => mounted && setCheckedItems([true, true, false, false]), 1200);
            setTimeout(() => mounted && setCheckedItems([true, true, true, false]), 1900);
            setTimeout(() => mounted && setCheckedItems([true, true, true, true]), 2600);
        };

        runAnimation(); // First run
        const interval = setInterval(runAnimation, 3500); // Loop every 3.5s

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const text = mode === 'curating' ? "Curating Your Test..." : "Evaluating Responses...";
    const subtext = mode === 'evaluating' ? "Reviewing your logic and calculating your final score." : "";

    return (
        <div className="checklist-loader fade-in">
            <div className="checklist-card">
                <div className="checklist-header"></div>

                {[0, 1, 2, 3].map((i) => (
                    <div className="checklist-item" key={i}>
                        <div className={`checklist-box ${checkedItems[i] ? 'checked' : ''}`}>
                            <span className="material-icons">check</span>
                        </div>
                        <div className="checklist-line">
                            {mode === 'evaluating' && checkedItems[i] && <div className="eval-progress" style={{ animationDelay: `${i * 0.5}s` }}></div>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="checklist-caption">{text}</div>
            {subtext && <div style={{ marginTop: '10px', color: 'gray', fontSize: '0.9rem', textAlign: 'center', maxWidth: '300px' }}>{subtext}</div>}
            {mode === 'evaluating' && <div style={{ width: '200px', height: '4px', background: '#5C6BC0', marginTop: '20px', borderRadius: '2px' }}></div>}
        </div>
    );
};

export default ChecklistLoader;
