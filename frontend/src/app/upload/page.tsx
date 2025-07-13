'use client';

import { useState, useRef, useMemo } from 'react';
import useUserStore from '../../store/userStore';
import Loader from '../../components/Loader';
import Navbar from '../../components/Navbar';
import { formatDate } from '../../utils/dateUtils';

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    materials, 
    addMaterial, 
    removeMaterial,
    loading, 
    setLoading 
  } = useUserStore();

  // Function to handle viewing files
  const handleViewFile = (material: any) => {
    console.log('Viewing material:', material);
    
    if (material.id.startsWith('sample-material-')) {
      // For sample materials, show content in a modal or new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${material.title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                h1 { color: #333; }
                .content { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${material.title}</h1>
              <div class="content">${material.content}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      // For uploaded files, check if we have a filename
      if (!material.filename) {
        alert(`This file (${material.title}) was uploaded before the file serving system was implemented. Please re-upload the file to view it.`);
        return;
      }
      
      // Remove /api suffix if present to avoid double /api/api/ in URL
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
      const fileUrl = `${baseUrl}/api/materials/uploads/${material.filename}`;
      console.log('Opening file URL:', fileUrl);
      window.open(fileUrl, '_blank');
    }
  };

  // Function to handle deleting files
  const handleDeleteFile = async (material: any) => {
    if (confirm(`Are you sure you want to delete "${material.title}"?`)) {
      try {
        if (!material.id.startsWith('sample-material-')) {
          // For real files, call API to delete using apiHelper
          const { apiHelper } = await import('../../lib/api');
          await apiHelper.materials.delete(material.id);
        }
        
        // Remove from store
        removeMaterial(material.id);
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Failed to delete material');
      }
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setLoading('materials', { isLoading: true, error: null });
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('subject', 'General');
      formData.append('difficulty', 'intermediate');

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Use apiHelper instead of fetch for better error handling
      const { apiHelper } = await import('../../lib/api');
      const result = await apiHelper.materials.upload(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      const material = result.data.material;
      
      const newMaterial = {
        id: material._id,
        title: material.title,
        content: material.content,
        type: getFileType(material.originalName || material.title),
        uploadedAt: new Date(material.uploadedAt),
        userId: material.userId,
        filename: material.filename
      };
      
      addMaterial(newMaterial);
      setLoading('materials', { isLoading: false, error: null });
      setUploadProgress(0);

    } catch (error: any) {
      setLoading('materials', { isLoading: false, error: error.message || 'Upload failed' });
      setUploadProgress(0);
    }
  };

  const handleYouTubeUrl = async (url: string) => {
    if (!url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    setLoading('materials', { isLoading: true, error: null });

    try {
      const videoTitle = `YouTube Video - ${new Date().toISOString()}`;
      
      // Use apiHelper instead of direct fetch for better error handling
      const { apiHelper } = await import('../../lib/api');
      const result = await apiHelper.materials.youtube({
        url,
        title: videoTitle,
        subject: 'General',
        difficulty: 'intermediate'
      });

      const material = result.data.material;
      
      const newMaterial = {
        id: material._id,
        title: material.title,
        content: material.content,
        type: 'text' as const,
        uploadedAt: new Date(material.uploadedAt),
        userId: material.userId
      };
      
      addMaterial(newMaterial);
      setLoading('materials', { isLoading: false, error: null });

    } catch (error: any) {
      setLoading('materials', { isLoading: false, error: error.message || 'Failed to extract video data' });
    }
  };

  const getFileType = (filename: string): 'pdf' | 'text' | 'video' | 'audio' => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'video';
      case 'mp3':
      case 'wav':
        return 'audio';
      default:
        return 'text';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-purple-900 relative overflow-hidden">
      <Navbar />
      
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="page-header animate-fadeIn">
            <h1 className="text-3xl font-bold text-white mb-2">Upload Knowledge Materials</h1>
            <p className="text-gray-300">
              Upload your documents, videos, or audio files to begin your cosmic learning journey
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8 animate-fadeIn">
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 scale-105' 
                  : 'border-white/20 bg-gradient-to-br from-white/5 to-white/10'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={false}
                onChange={handleChange}                  accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.mp4,.avi,.mov,.mp3,.wav"
                className="hidden"
              />
              
              {loading.materials.isLoading ? (
                <div className="py-12">
                  <Loader size="lg" text="Uploading..." />
                  {uploadProgress > 0 && (
                    <div className="mt-6 max-w-xs mx-auto">
                      <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-cyan-200 mt-3">{uploadProgress}% complete</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {loading.materials.error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300 text-center">
                      {loading.materials.error}
                    </div>
                  )}
                  <div className="text-cyan-300 mb-6">
                    <div className="text-5xl mb-4">🚀</div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Drag and drop your files here
                  </h3>
                  <p className="text-gray-300 mb-6">
                    or click to browse from your storage
                  </p>
                  <button
                    onClick={onButtonClick}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    Choose File
                  </button>
                  <p className="text-sm text-gray-400 mt-6">
                    Supported formats: PDF, TXT, DOC, DOCX, Images (JPG, PNG, GIF, BMP), MP4, AVI, MOV, MP3, WAV
                  </p>
                </>
              )}
            </div>
          </div>

          {/* YouTube URL Section */}
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Add YouTube Video</h2>
            <div className="flex gap-4">
              <input
                type="url"
                placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
                className="flex-1 bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      handleYouTubeUrl(input.value.trim());
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    handleYouTubeUrl(input.value.trim());
                    input.value = '';
                  }
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Extract
              </button>
            </div>
            {loading.materials.error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-300">
                {loading.materials.error}
              </div>
            )}
          </div>

          {/* Materials List */}
          {materials.length > 0 && (
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Your Materials</h2>
              <div className="grid gap-4">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="bg-black/30 border border-white/10 rounded-xl p-6 flex items-center justify-between hover:bg-black/40 transition-all duration-300"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{material.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="capitalize">{material.type}</span>
                        <span>•</span>
                        <span>{formatDate(material.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewFile(material)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteFile(material)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Upload;
