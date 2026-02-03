import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const ChatInput = ({ onSend, placeholder = "Type a message..." }) => {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [attachment, setAttachment] = useState(null); // { type: 'image' | 'audio', url: string, file: File }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() || attachment) {
            onSend(text, attachment);
            setText('');
            setAttachment(null);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAttachment({ type: 'image', url, file });
        }
    };

    const { openModal } = useData();

    const handleAudioClick = () => {
        // Mock audio recording
        const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; // Placeholder
        setAttachment({ type: 'audio', url: mockAudioUrl });
        openModal({
            title: "Audio Recorded",
            message: "Mock audio has been recorded and attached.",
            type: 'info'
        });
    };

    const addEmoji = (emoji) => {
        setText(prev => prev + emoji);
        setShowEmoji(false);
    };

    return (
        <div style={{ padding: '15px', borderTop: '2px solid black', background: '#fff' }}>
            {attachment && (
                <div className="fade-in" style={{ padding: '10px', background: '#f3f4f6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '4px' }}>
                    {attachment.type === 'image' && <img src={attachment.url} alt="Attachment" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                    {attachment.type === 'audio' && <span className="material-icons">mic</span>}
                    <span style={{ fontSize: '0.8rem', flex: 1 }}>{attachment.type === 'image' ? 'Image attached' : 'Audio recorded'}</span>
                    <button onClick={() => setAttachment(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'red' }}>✕</button>
                </div>
            )}

            {showEmoji && (
                <div className="fade-in" style={{
                    position: 'absolute', bottom: '80px', left: '20px',
                    background: 'white', border: '2px solid black', padding: '10px',
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px',
                    boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
                }}>
                    {['😀', '😂', '🤔', '👍', '🔥', '🎉', '❤️', '👀', '🚀', '💯'].map(e => (
                        <button
                            key={e}
                            onClick={() => addEmoji(e)}
                            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Media Buttons */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="button" onClick={handleAudioClick} style={{ background: '#f3f4f6', border: '1px solid black', borderRadius: '4px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                        <span className="material-icons" style={{ fontSize: '1.2rem' }}>mic</span>
                    </button>
                    <button type="button" onClick={() => document.getElementById('img-upload').click()} style={{ background: '#f3f4f6', border: '1px solid black', borderRadius: '4px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                        <span className="material-icons" style={{ fontSize: '1.2rem' }}>image</span>
                    </button>
                    <button type="button" onClick={() => setShowEmoji(!showEmoji)} style={{ background: '#f3f4f6', border: '1px solid black', borderRadius: '4px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                        <span className="material-icons" style={{ fontSize: '1.2rem' }}>sentiment_satisfied_alt</span>
                    </button>
                </div>

                <input type="file" id="img-upload" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={placeholder}
                    style={{ flex: 1, padding: '12px', border: '2px solid black', fontWeight: 'bold', fontSize: '1rem' }}
                />
                <button type="submit" style={{ padding: '0 25px', height: '45px', background: 'var(--secondary)', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer', boxShadow: '2px 2px 0 black' }}>
                    SEND
                </button>
            </form>
        </div>
    );
};

export default ChatInput; // Ensure default export
