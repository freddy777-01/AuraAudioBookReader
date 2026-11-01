import { useAudioPlayer as usePlayerContext } from '../contexts/AudioPlayerContext';

// Helper to format raw seconds into HH:MM:SS or MM:SS
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper to calculate readable time remaining
export const formatTimeRemaining = (currentTime: number, duration: number, rate: number = 1.0): string => {
  const remainingRealSeconds = Math.max(0, (duration - currentTime) / rate);
  const hrs = Math.floor(remainingRealSeconds / 3600);
  const mins = Math.floor((remainingRealSeconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m left`;
  }
  return `${mins}m left`;
};

export const useAudioPlayer = () => {
  const player = usePlayerContext();

  const progressPercentage = player.duration > 0
    ? Math.min(100, Math.max(0, (player.currentTime / player.duration) * 100))
    : 0;

  const formattedCurrentTime = formatTime(player.currentTime);
  const formattedDuration = formatTime(player.duration);
  const timeRemaining = formatTimeRemaining(player.currentTime, player.duration, player.playbackRate);

  return {
    ...player,
    progressPercentage,
    formattedCurrentTime,
    formattedDuration,
    timeRemaining,
  };
};
