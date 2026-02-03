import React from 'react';

const AILoadingScreen = ({ title, subtitle }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '500px' }}>
        <div className="ai-spinner"></div>
        <h2 className="ai-loading-text">{title}</h2>
        <p className="ai-subtext">{subtitle}</p>
    </div>
);

export default AILoadingScreen;
