import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { PhotoIcon, TrashIcon, XMarkIcon } from './icons'; // Assuming XMarkIcon is for closing previews potentially

interface ImageUploadProps {
  initialImages?: string[]; // Can be URLs or base64 strings
  onImagesChange: (base64Images: string[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  initialImages = [],
  onImagesChange,
  maxFiles = 5,
  maxFileSizeMB = 5,
}) => {
  const [images, setImages] = useState<string[]>(initialImages); // Store base64 or URLs
  const [error, setError] = useState<string | null>(null);

  const handleFileProcessing = useCallback((files: FileList | File[]) => {
    setError(null);
    const newImagesPromises: Promise<string>[] = [];
    const currentImageCount = images.length;
    let filesToProcessCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (currentImageCount + filesToProcessCount >= maxFiles) {
        setError(`You can upload a maximum of ${maxFiles} images.`);
        break;
      }
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not a valid image type.`);
        continue;
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds ${maxFileSizeMB}MB size limit.`);
        continue;
      }

      newImagesPromises.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      );
      filesToProcessCount++;
    }

    Promise.all(newImagesPromises)
      .then(newBase64Images => {
        const updatedImages = [...images, ...newBase64Images];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      })
      .catch(err => {
        console.error("Error reading files:", err);
        setError("An error occurred while processing images.");
      });
  }, [images, maxFiles, maxFileSizeMB, onImagesChange]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFileProcessing(event.target.files);
      event.target.value = ''; // Reset file input
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-primary', 'bg-blue-50');
    if (event.dataTransfer.files) {
      handleFileProcessing(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-primary', 'bg-blue-50');
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-primary', 'bg-blue-50');
  };

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-3">
      <div
        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral border-dashed rounded-md transition-colors duration-150 ease-in-out"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-1 text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-neutral-dark" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
            >
              <span>Upload files</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} disabled={images.length >= maxFiles} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to {maxFileSizeMB}MB each. Max {maxFiles} images.</p>
        </div>
      </div>

      {error && <p className="text-sm text-danger mt-2">{error}</p>}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((imageSrc, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={imageSrc}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-md shadow-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75 focus:opacity-100"
                aria-label="Remove image"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
