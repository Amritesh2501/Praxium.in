import React from 'react';

const BauhausModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'info', confirmText = 'OK', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(3px)'
        }}>
            <div className="fade-in" style={{
                background: 'white',
                border: '4px solid black',
                boxShadow: '10px 10px 0 black',
                width: '90%',
                maxWidth: '500px',
                padding: '0'
            }}>
                <div style={{
                    padding: '15px 20px',
                    background: type === 'confirm' ? 'var(--accent)' : 'black',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    borderBottom: '4px solid black',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>{title}</span>
                    <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <div style={{ padding: '30px', fontSize: '1.1rem', lineHeight: '1.5' }}>
                    {message}
                </div>

                <div style={{ padding: '20px', borderTop: '2px solid black', background: '#f8f9fa', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            style={{
                                padding: '10px 25px',
                                background: 'white',
                                border: '2px solid black',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '3px 3px 0 #999'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 25px',
                            background: 'var(--secondary)',
                            color: 'white',
                            border: '2px solid black',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '3px 3px 0 black'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BauhausModal;
