# Video Setup Instructions

## Google Drive Video Integration

The Hero component on the home page is configured to display a video from Google Drive with multiple fallback options.

### Current Video Configuration

**Google Drive Link:** https://drive.google.com/file/d/1-jomah8ImnxGRGCL7DXtYTm7QMqDhZnA/view?usp=sharing

### Video Loading Strategy

The application attempts to load the video in the following order:

1. **Direct Download** - Tries to load the video directly from Google Drive
2. **Iframe Embed** - Falls back to Google Drive's preview iframe
3. **Local Video** - Uses a locally hosted video file
4. **Fallback Message** - Shows error message with manual link

### Setting Up Local Video (Recommended)

Since Google Drive has CORS restrictions and may not work reliably for direct video embedding, it's recommended to download the video and host it locally:

#### Steps:

1. **Download the video** from the Google Drive link above
2. **Rename the file** to `vrisham-intro.mp4`
3. **Place the file** in this directory (`public/videos/`)
4. **Restart the development server** if running

#### File Structure:
```
public/
  videos/
    vrisham-intro.mp4  <- Place your video file here
    README.md          <- This file
```

### Alternative Video Hosting Options

If Google Drive continues to have issues, consider these alternatives:

1. **YouTube** - Upload to YouTube and use YouTube embed
2. **Vimeo** - Upload to Vimeo and use Vimeo embed
3. **AWS S3** - Host on AWS S3 with public access
4. **Cloudinary** - Use Cloudinary for video hosting
5. **Local Hosting** - Keep the video in the public folder (recommended for development)

### Updating the Video Source

To change the video source, edit the `videoSources` array in `src/components/Hero.tsx`:

```typescript
const videoSources = [
  {
    type: 'direct',
    src: 'YOUR_NEW_DIRECT_URL',
    label: 'Direct Source'
  },
  // ... other sources
];
```

### Technical Notes

- The video player supports MP4, WebM, and OGV formats
- Autoplay is enabled with muted audio (browser requirement)
- The video is responsive and maintains aspect ratio
- Error handling automatically tries fallback sources
- CORS restrictions may prevent direct Google Drive embedding

### Troubleshooting

If the video doesn't load:

1. Check browser console for error messages
2. Verify the Google Drive link is publicly accessible
3. Try downloading and hosting the video locally
4. Consider using a dedicated video hosting service

### File Size Considerations

For web optimization:
- Keep video files under 50MB for good loading performance
- Consider compressing the video for web delivery
- Use appropriate video codecs (H.264 for broad compatibility)
