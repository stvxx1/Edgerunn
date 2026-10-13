import React from 'react';

interface GeneratedImageGalleryProps {
  images: { id: string; url: string; prompt: string }[];
}

export const GeneratedImageGallery: React.FC<GeneratedImageGalleryProps> = ({ images }) => {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {images.map((img) => (
        <div key={img.id} className="relative rounded-lg overflow-hidden border border-neutral-700">
          <img src={img.url} alt={img.prompt} className="w-full h-32 object-cover" />
          <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/70 text-[10px] text-neutral-300 truncate font-mono">
            {img.prompt}
          </div>
        </div>
      ))}
    </div>
  );
};
