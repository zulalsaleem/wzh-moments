import { useState, useRef } from 'react';
import { Camera, Loader } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const TEXT_SIZES = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

export default function AvatarUpload({ currentImage, name = 'User', onUploadSuccess, size = 'lg' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage ?? null);
  const fileInputRef = useRef(null);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('profileImage', file);

      const { data } = await api.post('/upload/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Profile picture updated!');
        onUploadSuccess?.(data);
      }
    } catch {
      toast.error('Upload failed');
      setPreview(currentImage ?? null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className={[
          SIZE_CLASSES[size] ?? SIZE_CLASSES.lg,
          'rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500',
          'flex items-center justify-center cursor-pointer relative',
        ].join(' ')}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className={`text-white font-bold ${TEXT_SIZES[size] ?? TEXT_SIZES.lg}`}>
            {initials}
          </span>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
            <Loader className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-9 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white disabled:opacity-60"
      >
        <Camera className="h-4 w-4" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0])}
      />
    </div>
  );
}
