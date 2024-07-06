import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './VideoJS.css';

const VideoJS = (props) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const {options, onReady, setToPlay, centered} = props;

    useEffect(() => {
        if (!playerRef.current) {
            const videoElement = document.createElement("video-js");
            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);

            const player = videojs(videoElement, options, () => {
                console.log('onPlayerReady');
                onReady && onReady(player);
            });
            playerRef.current = player;
        } else {
            const player = playerRef.current;
            player.src(options.src);
        }
    }, [options.sources[0].src, onReady, videoRef]);

    useEffect(() => {
        const player = playerRef.current;
        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    const handleClick = () => {
        setToPlay('undefined');
    }

    if (centered) {
        return (
            <div data-vjs-player className='player'>
                <div ref={videoRef} />
                <div className='close-button' onClick={handleClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>
                </div>
            </div>
        )
    } else {
        return (
            <div data-vjs-player >
                <div ref={videoRef} />
            </div>
        )
    }
}

export default VideoJS
