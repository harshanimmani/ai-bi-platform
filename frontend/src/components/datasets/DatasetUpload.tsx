import { useState, useRef } from 'react';
import { UploadCloud, FileType, X } from 'lucide-react';
import { datasetsApi } from '../../api/datasets';
import { toast } from 'sonner';
import type { Dataset } from '../../api/datasets';

export const DatasetUpload = ({ onUploadSuccess, existingDatasets = [] }: { onUploadSuccess: () => void, existingDatasets?: Dataset[] }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      toast.error("Invalid file type. Please upload a CSV or Excel file.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    // Check for duplicates
    const isDuplicate = existingDatasets.some(
      (d) => d.filename === file.name && d.file_size === file.size
    );

    if (isDuplicate) {
      toast.error('A dataset with the same name and size already exists.');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);
      
      await datasetsApi.uploadDataset(file, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      toast.success("Dataset uploaded successfully!");
      setFile(null);
      setProgress(0);
      onUploadSuccess();
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      let errorMessage = "Failed to upload dataset.";
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
        errorMessage = detail[0].msg;
      }
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setProgress(0);
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Upload Dataset</h3>
      
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
          }`}
        >
          <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
            Click or drag file to this area to upload
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supports CSV or Excel (.xlsx) up to 50MB
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileType className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {!isUploading && (
              <button onClick={clearFile} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {!isUploading && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
