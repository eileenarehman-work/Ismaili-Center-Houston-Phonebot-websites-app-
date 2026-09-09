import React, { useState } from 'react';
import { VideoItem } from '../types.ts';
import { 
  Tv, 
  Play, 
  ExternalLink, 
  Clock, 
  Film,
  Sparkles
} from 'lucide-react';

export const VideosView: React.FC = () => {
  const videoList: VideoItem[] = [
    {
      id: 'spaces',
      videoId: 'icMun5LPfoE',
      title: 'Ismaili Center Houston Spaces',
      channel: 'The Ismaili',
      duration: '4:46',
      description: 'An inside look at the spaces, architectural verandas, and Persian-inspired gardens of the Ismaili Center Houston.',
      thumbnailUrl: 'https://img.youtube.com/vi/icMun5LPfoE/hqdefault.jpg',
    },
    {
      id: 'inauguration',
      videoId: 'cETRWtn7svc',
      title: 'Inauguration Ceremony & Festivities',
      channel: 'The Ismaili TV',
      duration: '27:22',
      description: 'Complete coverage of the historic inauguration and opening celebrations of the Ismaili Center Houston.',
      thumbnailUrl: 'https://img.youtube.com/vi/cETRWtn7svc/hqdefault.jpg',
    },
    {
      id: 'wishes',
      videoId: 'cF4X-4I4lhw',
      title: 'Well Wishes from Global Centers',
      channel: 'The Ismaili',
      duration: '2:53',
      description: 'Congratulatory messages and greetings from sister Ismaili Centers around the world including London, Lisbon, Dubai, and Toronto.',
      thumbnailUrl: 'https://img.youtube.com/vi/cF4X-4I4lhw/hqdefault.jpg',
    },
    {
      id: 'khou',
      videoId: 'G599oCSvV1U',
      title: 'Houston Broadcast News Feature',
      channel: 'KHOU 11 Broadcast',
      duration: '2:33',
      description: 'Local television broadcast feature highlighting the new cultural and architectural landmark in the heart of Houston.',
      thumbnailUrl: 'https://img.youtube.com/vi/G599oCSvV1U/hqdefault.jpg',
    },
  ];

  const [currentVideo, setCurrentVideo] = useState<VideoItem>(videoList[0]);

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#007ba8] dark:text-teal-400">
              <Film className="w-3.5 h-3.5" />
              <span>Official Video Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white mt-1">
              Videos &amp; Documentaries
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore the design, opening ceremonies, and civic celebrations of the Ismaili Center Houston.
            </p>
          </div>

          <a
            href="https://www.youtube.com/@TheIsmaili"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors self-start sm:self-center"
          >
            <span>The Ismaili Channel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Main Video Cinema Player */}
        <div className="space-y-4">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-200 dark:border-slate-800">
            <iframe
              key={currentVideo.videoId}
              src={`https://www.youtube-nocookie.com/embed/${currentVideo.videoId}?autoplay=1`}
              title={currentVideo.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2">
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-cinzel text-slate-900 dark:text-white">
                {currentVideo.title}
              </h3>
              <p className="text-xs text-[#007ba8] dark:text-teal-400 font-semibold mt-0.5">
                {currentVideo.channel} Official
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              {currentVideo.description}
            </p>
          </div>
        </div>

        {/* Gallery Selector Grid */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#007ba8]" />
            <span>Select Video to Watch</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videoList.map((video) => {
              const isSelected = currentVideo.videoId === video.videoId;
              return (
                <div
                  key={video.id}
                  onClick={() => setCurrentVideo(video)}
                  className={`group cursor-pointer p-3 rounded-xl transition-all duration-200 space-y-2.5 ${
                    isSelected
                      ? 'bg-teal-50/70 dark:bg-teal-950/30 border-2 border-[#007ba8] shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs'
                  }`}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
                      {video.duration}
                    </span>
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-black/20' : 'bg-black/30 group-hover:bg-black/10'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/90 text-[#007ba8] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#007ba8] transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                      <span>{video.channel}</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{video.duration}</span>
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
