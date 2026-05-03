import { memo, useEffect, useLayoutEffect, useRef } from "react";
import "plyr-react/plyr.css";

interface AudioPlayerProps {
  audioUrl: string;
  isReady: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  /**
   * Start of the segment to play, in seconds. When this changes (passage
   * navigation), the player seeks here. Falsy/undefined → start at 0.
   */
  audioStart?: number | null;
  /**
   * End of the segment, in seconds. The player pauses when currentTime
   * reaches this value. Falsy/undefined → play to the end of the file.
   */
  audioEnd?: number | null;
}

const AudioPlayer = ({ audioUrl, isReady, onTimeUpdate, audioStart, audioEnd }: AudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plyrInstanceRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const isInitializedRef = useRef(false);
  // Hold latest start/end so the timeupdate listener (registered once at
  // init) always reads fresh values when the user switches passages.
  const audioStartRef = useRef<number | null | undefined>(audioStart);
  const audioEndRef = useRef<number | null | undefined>(audioEnd);
  audioStartRef.current = audioStart;
  audioEndRef.current = audioEnd;

  // When the segment range changes (e.g. user navigates to another passage),
  // seek to the new start. Skip while the user is actively playing if the
  // new start equals the old one (no-op).
  useEffect(() => {
    const audioElement = audioElementRef.current;
    if (!audioElement || !isInitializedRef.current) return;
    const start = audioStart ?? 0;
    if (Math.abs(audioElement.currentTime - start) > 0.5) {
      audioElement.currentTime = start;
    }
  }, [audioStart, audioEnd]);

  // Use useLayoutEffect to ensure ref is ready before initialization
  useLayoutEffect(() => {
    // Cleanup previous instance if audioUrl changes
    if (isInitializedRef.current) {
      if (plyrInstanceRef.current) {
        try {
          plyrInstanceRef.current.destroy();
        } catch (e) {
          console.error("Error destroying previous player:", e);
        }
        plyrInstanceRef.current = null;
      }
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        try {
          audioElementRef.current.parentNode.removeChild(audioElementRef.current);
        } catch (e) {
          console.error("Error removing previous audio element:", e);
        }
        audioElementRef.current = null;
      }
      isInitializedRef.current = false;
    }
    
    const initPlayer = async () => {
      // Wait for container to be ready
      if (!containerRef.current) {
        return;
      }

      try {
        // Double check container is still in DOM
        if (!containerRef.current.isConnected) {
          return;
        }

        // Create audio element
        const audioElement = document.createElement("audio");
        audioElement.controls = true;
        audioElement.src = audioUrl;
        audioElementRef.current = audioElement;
        
        // Verify container is still valid before appending
        if (!containerRef.current || !containerRef.current.isConnected) {
          audioElementRef.current = null;
          return;
        }
        
        // Append to container
        containerRef.current.appendChild(audioElement);

        // Verify audioElement is now in DOM before initializing Plyr
        if (!audioElement.isConnected || !audioElement.parentNode) {
          if (audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement);
          }
          audioElementRef.current = null;
          return;
        }

        // Dynamically import Plyr
        const Plyr = (await import("plyr")).default;
        
        // Final check before Plyr initialization
        if (!audioElement.isConnected || !audioElement.parentNode) {
          if (audioElement.parentNode) {
            audioElement.parentNode.removeChild(audioElement);
          }
          audioElementRef.current = null;
          return;
        }
        
        // Initialize Plyr
        plyrInstanceRef.current = new Plyr(audioElement, {
          controls: [
            "rewind",
            "play",
            "fast-forward",
            "progress",
            "current-time",
            "mute",
            "volume",
            "settings",
          ],
        });

        // Setup time update listener — also enforce the audio_end cap by
        // pausing once playback reaches it. The latest audioStart / audioEnd
        // are read through refs so this listener doesn't need to be
        // re-attached when the passage changes.
        audioElement.addEventListener("timeupdate", () => {
          if (onTimeUpdate) {
            onTimeUpdate(audioElement.currentTime);
          }
          const end = audioEndRef.current;
          if (end != null && audioElement.currentTime >= end) {
            audioElement.pause();
          }
        });

        // On metadata load, snap to the configured start point so the user
        // doesn't have to manually seek.
        audioElement.addEventListener("loadedmetadata", () => {
          const start = audioStartRef.current;
          if (start != null && start > 0) {
            audioElement.currentTime = start;
          }
        });

        isInitializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize audio player:", error);
        // Cleanup on error
        if (audioElementRef.current && audioElementRef.current.parentNode) {
          try {
            audioElementRef.current.parentNode.removeChild(audioElementRef.current);
          } catch (e) {
            console.error("Error cleaning up audio element:", e);
          }
          audioElementRef.current = null;
        }
        isInitializedRef.current = false;
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      initPlayer();
    });

    // Cleanup only on unmount
    return () => {
      cancelAnimationFrame(rafId);
      if (plyrInstanceRef.current) {
        try {
          plyrInstanceRef.current.destroy();
        } catch (e) {
          console.error("Error destroying player:", e);
        }
        plyrInstanceRef.current = null;
      }
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        try {
          audioElementRef.current.parentNode.removeChild(audioElementRef.current);
        } catch (e) {
          console.error("Error removing audio element:", e);
        }
        audioElementRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [audioUrl]); // Include audioUrl to reinitialize if URL changes

  // Handle play when ready
  useEffect(() => {
    if (isReady && audioElementRef.current) {
      const audioElement = audioElementRef.current;
      
      if (audioElement.paused) {
        audioElement.play().catch((error) =>
          console.error("Audio play failed:", error)
        );
      }
    }
  }, [isReady]);

  return <div ref={containerRef} />;
};

// Memo to prevent re-render
export default memo(AudioPlayer);
