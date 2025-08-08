/**
 * Utility functions for video handling and Google Drive integration
 */

export interface VideoSource {
  type: 'direct' | 'iframe' | 'local' | 'youtube' | 'vimeo';
  src: string;
  label: string;
}

/**
 * Extract file ID from Google Drive sharing URL
 */
export function extractGoogleDriveFileId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Convert Google Drive sharing URL to direct download URL
 */
export function getGoogleDriveDirectUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Convert Google Drive sharing URL to preview/embed URL
 */
export function getGoogleDrivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Generate video sources from Google Drive URL
 */
export function generateVideoSources(googleDriveUrl: string, localVideoPath?: string): VideoSource[] {
  const fileId = extractGoogleDriveFileId(googleDriveUrl);
  
  if (!fileId) {
    throw new Error('Invalid Google Drive URL');
  }

  const sources: VideoSource[] = [
    {
      type: 'direct',
      src: getGoogleDriveDirectUrl(fileId),
      label: 'Google Drive Direct'
    },
    {
      type: 'iframe',
      src: getGoogleDrivePreviewUrl(fileId),
      label: 'Google Drive Embed'
    }
  ];

  if (localVideoPath) {
    sources.push({
      type: 'local',
      src: localVideoPath,
      label: 'Local Video'
    });
  }

  return sources;
}

/**
 * Test if a video URL is accessible
 */
export async function testVideoAccessibility(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Video accessibility test failed:', error);
    return false;
  }
}

/**
 * Get video metadata if available
 */
export function getVideoMetadata(videoElement: HTMLVideoElement): {
  duration: number;
  width: number;
  height: number;
  readyState: number;
} {
  return {
    duration: videoElement.duration || 0,
    width: videoElement.videoWidth || 0,
    height: videoElement.videoHeight || 0,
    readyState: videoElement.readyState
  };
}

/**
 * Format video duration for display
 */
export function formatVideoDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if browser supports video format
 */
export function canPlayVideoType(type: string): boolean {
  const video = document.createElement('video');
  return video.canPlayType(type) !== '';
}

/**
 * Get supported video formats for current browser
 */
export function getSupportedVideoFormats(): string[] {
  const formats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov'
  ];

  return formats.filter(format => canPlayVideoType(format));
}
