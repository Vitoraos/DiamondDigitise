"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";

interface ImageUploadProps {
  existingUrls?: string[];
  onUpload: (urls: string[]) => void;
}

export function ImageUpload({ existingUrls = [], onUpload }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (previews.length + files.length > 5) {
      alert("You can only upload up to 5 images per room.");
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const fileName = `rooms/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error, data } = await supabase.storage
        .from("hotel-docs")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) {
        alert(`Upload failed for ${file.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("hotel-docs")
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    const newUrls = [...previews, ...uploadedUrls];
    setPreviews(newUrls);
    onUpload(newUrls);
    setUploading(false);
  };

  const removeImage = (url: string) => {
    const newUrls = previews.filter((u) => u !== url);
    setPreviews(newUrls);
    onUpload(newUrls);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-wrap gap-2">
        {previews.map((url) => (
          <div key={url} className="relative w-20 h-20 rounded overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {previews.length < 5 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-20 h-20"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-6 w-6 text-navy-500" />
          </Button>
        )}
      </div>
      {uploading && <p className="text-xs text-navy-600">Uploading...</p>}
    </div>
  );
}