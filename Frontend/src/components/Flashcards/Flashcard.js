// src/components/Flashcards/Flashcard.jsx
import React, { useState, useRef, useEffect } from 'react';
import './Flashcard.css';

function Flashcard({ sign }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [videoStatus, setVideoStatus] = useState('loading'); // 'loading', 'error', 'ready'
  const videoRef = useRef(null);

  // Debug log & pre-load video when sign changes
  useEffect(() => {
    console.log('Sign data for card:', sign);
    setVideoStatus('loading');

    if (sign.video_url) {
      const testVideo = document.createElement('video');

      testVideo.onloadeddata = () => {
        console.log('Video pre-loaded successfully:', sign.video_url);
        setVideoStatus('ready');
      };
      testVideo.onerror = (e) => {
        console.error('Error pre-loading video:', e);
        setVideoStatus('error');
      };

      testVideo.src = sign.video_url;
      testVideo.load();

      return () => {
        testVideo.onloadeddata = null;
        testVideo.onerror = null;
        testVideo.src = '';
      };
    }
  }, [sign]);

  // Trigger video playback once flipped & ready
  useEffect(() => {
    if (isFlipped && videoStatus === 'ready' && videoRef.current) {
      videoRef.current
        .play()
        .then(() => console.log('Video playback started'))
        .catch(err => {
          console.error('Video play failed:', err);
          setVideoStatus('error');
        });
    }
  }, [isFlipped, videoStatus]);

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  // Retry loading the video (without flipping)
  const handleRetryVideo = e => {
    e.stopPropagation();
    console.log('Retrying video load...');
    setVideoStatus('loading');
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const renderVideoContent = () => {
    if (!sign.video_url) {
      return <div className="no-video">No video available</div>;
    }

    if (videoStatus === 'error') {
      return (
        <div className="video-error">
          <p>Error loading video</p>
          <button className="retry-button" onClick={handleRetryVideo}>
            Retry
          </button>
        </div>
      );
    }

    return (
      <>
        <video
          ref={videoRef}
          key={sign.id}
          className="card-video"
          controls
          muted
          playsInline
          loop
          onLoadedData={() => setVideoStatus('ready')}
          onError={() => setVideoStatus('error')}
        >
          <source src={sign.video_url} type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>
        {videoStatus === 'loading' && (
          <div className="video-loading">Loading video...</div>
        )}
      </>
    );
  };

  return (
    <div
      className={`flashcard ${isFlipped ? 'flipped' : ''}`}
      onClick={handleFlip}
    >
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <p className="instruction">Click to see the sign</p>
          <h3 className="sign-name">{sign.text}</h3>
        </div>

        <div className="flashcard-back">
          <h3>{sign.text}</h3>
          {renderVideoContent()}
          <p className="flip-instruction">Click to flip back</p>
        </div>
      </div>
    </div>
  );
}

export default Flashcard;
