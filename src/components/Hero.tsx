import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateVideoSources, type VideoSource } from '../utils/videoUtils';

export function Hero() {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);
  const [useLocalVideo, setUseLocalVideo] = useState(false);

  // Video sources in order of preference
  const googleDriveUrl = 'https://drive.google.com/file/d/1-jomah8ImnxGRGCL7DXtYTm7QMqDhZnA/view?usp=sharing';
  const localVideoPath = '/videos/vrisham-intro.mp4';
  const videoSources: VideoSource[] = generateVideoSources(googleDriveUrl, localVideoPath);

  return (
    <div className="relative">
      <div className="px-4 pt-8 pb-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              Fresh from Farm to
              <br />
              Your Doorstep
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Pre-order farm-fresh organic produce harvested specially for you
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/categories')}
                className="px-8 py-4 bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                Shop Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowVideo(true)}
                className="px-8 py-4 bg-secondary/10 text-secondary rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary/20 transition-colors"
              >
                Watch How
                <Play className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden aspect-[16/9] max-w-4xl mx-auto shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1557844352-761f2565b576?auto=format&fit=crop&q=80&w=2940"
              alt="Organic farming"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setShowVideo(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
            >
              <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-primary ml-1" />
              </div>
            </button>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { number: '1000+', label: 'Happy Customers' },
              { number: '50+', label: 'Organic Farmers' },
              { number: '100%', label: 'Organic Certified' },
              { number: '24/7', label: 'Customer Support' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => {
                setShowVideo(false);
                setVideoError(false);
                setUseIframe(false);
                setUseLocalVideo(false);
              }}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden">
              {!useIframe && !useLocalVideo && !videoError ? (
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  playsInline
                  onError={() => {
                    console.log('Direct video failed, trying iframe...');
                    setUseIframe(true);
                  }}
                >
                  <source
                    src={videoSources[0].src}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              ) : useIframe && !useLocalVideo && !videoError ? (
                <iframe
                  className="w-full h-full"
                  src={videoSources[1].src}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  onError={() => {
                    console.log('Iframe failed, trying local video...');
                    setUseIframe(false);
                    setUseLocalVideo(true);
                  }}
                />
              ) : useLocalVideo && !videoError ? (
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  playsInline
                  onError={() => {
                    console.log('Local video failed, showing fallback...');
                    setVideoError(true);
                  }}
                >
                  <source
                    src={videoSources[2].src}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="mb-4">
                      <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    </div>
                    <p className="mb-2 text-lg">Video temporarily unavailable</p>
                    <p className="text-sm text-gray-400 mb-4">
                      The video could not be loaded from any source.
                    </p>
                    <div className="space-y-2 mb-4">
                      <button
                        onClick={() => {
                          setVideoError(false);
                          setUseIframe(false);
                          setUseLocalVideo(false);
                        }}
                        className="block mx-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => {
                          setVideoError(false);
                          setUseIframe(false);
                          setUseLocalVideo(true);
                        }}
                        className="block mx-auto px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
                      >
                        Try Local Video
                      </button>
                    </div>
                    <div className="mt-4">
                      <a
                        href="https://drive.google.com/file/d/1-jomah8ImnxGRGCL7DXtYTm7QMqDhZnA/view?usp=sharing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline text-sm"
                      >
                        View video on Google Drive
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}