import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export function ImageUploader({
  previewUrl,
  imagePreview,
  onChange,
  onRemove,
  onImageSelect,
  onImageClear,
  label = 'Issue Photo (Camera or Gallery)',
  error,
  className,
}) {
  const fileInputRef = useRef(null);
  const activePreview = previewUrl || imagePreview;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (onChange) onChange(selected);
      if (onImageSelect) {
        const preview = URL.createObjectURL(selected);
        onImageSelect(selected, preview);
      }
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
    if (onImageClear) onImageClear();
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-semibold text-slate-700">{label}</label>

      {activePreview ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-300 group">
          <img src={activePreview} alt="Upload preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer bg-slate-50 transition-colors text-center"
        >
          <div className="p-3 bg-white rounded-full text-emerald-700 border border-slate-200 mb-2 shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-800">
            Take a photo or upload from device
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, or WebP up to 5 MB</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default ImageUploader;
