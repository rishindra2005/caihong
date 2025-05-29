'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import Image from 'next/image';

interface EditProfileDialogProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    credits?: number;
    metadata?: string;
  } | null | undefined;
  onClose: () => void;
}

export default function EditProfileDialog({ user, onClose }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    image: user?.image || '',
    metadata: user?.metadata || ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.image || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Reset form data when user prop changes
    setFormData({
      name: user?.name || '',
      image: user?.image || '',
      metadata: user?.metadata || ''
    });
    setImagePreview(user?.image || null);
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateUploadProgress = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('metadata', formData.metadata);

    if (imageFile) {
      simulateUploadProgress();
      // Convert image to base64
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(imageFile);
      });
      formDataToSend.append('image', base64Image as string);
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: formDataToSend
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <Dialog.Title className="text-xl font-semibold mb-4">Edit Profile</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Profile Picture</label>
              <div className="space-y-3">
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-600">
                    <Image
                      src={imagePreview}
                      alt="Profile Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
                />
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Additional Info</label>
              <textarea
                value={formData.metadata}
                onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600"
                rows={4}
                placeholder="Tell us more about yourself..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isUploading ? 'cursor-wait' : ''
                }`}
              >
                {isUploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 