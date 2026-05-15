import { useState, useRef } from 'react';
import { Upload, Image, Loader } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ASPECT_CLASSES = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
};

export default function ImageUpload({
  currentImage,
  onUploadSuccess,
  uploadEndpoint,
  fieldName = 'coverImage',
  aspectRatio = 'video',
  label = 'Upload Image',
  hint = 'JPG, PNG, WebP up to 5MB',
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage ?? null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
      formData.append(fieldName, file);

      const { data } = await api.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        toast.success('Image uploaded successfully!');
        onUploadSuccess(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
      setPreview(currentImage ?? null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={[
          'relative w-full border-2 border-dashed rounded-2xl overflow-hidden cursor-pointer transition-all',
          ASPECT_CLASSES[aspectRatio] ?? ASPECT_CLASSES.video,
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
        ].join(' ')}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Image className="h-6 w-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">Click or drag image here</p>
              <p className="text-xs text-gray-400 mt-1">{hint}</p>
            </div>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}

        {preview && !uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2">
              <Upload className="h-4 w-4 text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Change Image</span>
            </div>
          </div>
        )}
      </div>

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
