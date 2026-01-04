import React, { useCallback, useState } from 'react';
import { Upload, FileImage, X, Images } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64Images: string[]) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const promises = validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(images => {
      setPreviews(images);
      onImageSelected(images);
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (isLoading) return;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [isLoading]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const clearImages = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviews([]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out text-center cursor-pointer
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${previews.length > 0 ? 'border-solid border-indigo-200' : ''}
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleChange}
          disabled={isLoading}
        />

        {previews.length > 0 ? (
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
              {previews.map((src, idx) => (
                 <img
                  key={idx}
                  src={src}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-100"
                />
              ))}
            </div>
            {!isLoading && (
              <button
                onClick={clearImages}
                className="absolute -top-4 -right-4 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors z-10"
                title="清除所有"
              >
                <X size={16} />
              </button>
            )}
            <p className="mt-4 text-sm text-gray-500 font-medium">
                已选择 {previews.length} 张图片。点击或拖拽可添加/替换。
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Images className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">上传课程表图片</h3>
            <p className="text-gray-500 mb-4 max-w-xs mx-auto">
              拖拽图片到这里，或点击选择文件
            </p>
            <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full flex items-center gap-1">
              <FileImage size={12} />
              支持 JPG, PNG, WEBP 格式
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;