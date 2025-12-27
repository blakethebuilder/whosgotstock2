'use client';

import { useState, useRef } from 'react';

interface ImportResult {
  totalProcessed: number;
  newItems: number;
  updatedItems: number;
  errors: string[];
  categories: string[];
}

export default function DistributorImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadController, setUploadController] = useState<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setError('Please select an Excel (.xlsx) file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setUploadController(controller);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/ingest-manual', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data.result);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Upload cancelled by user');
      } else {
        setError(err.message);
      }
    } finally {
      setIsUploading(false);
      setUploadController(null);
    }
  };

  const cancelUpload = () => {
    if (uploadController) {
      uploadController.abort();
      setUploadController(null);
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetUpload = () => {
    setResult(null);
    setError(null);
    setUploadController(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manual Product Import</h2>
          <p className="text-sm text-gray-600">Upload Excel files to separate manual products table (Even Flow, etc.)</p>
        </div>
      </div>

      {!result && !error && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Processing Excel File...</p>
                <p className="text-sm text-gray-500">Parsing sheets, mapping columns, and updating database</p>
              </div>
              <button
                onClick={cancelUpload}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel Import
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">Drop your Excel file here</p>
                <p className="text-sm text-gray-500 mb-4">
                  Stores in separate table - won't mix with your main stock data
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Choose File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-900">Import Successful!</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-2xl font-black text-green-700">{result.totalProcessed.toLocaleString()}</p>
              <p className="text-sm text-green-600">Products Processed</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-2xl font-black text-blue-700">{result.newItems.toLocaleString()}</p>
              <p className="text-sm text-blue-600">New Items Added</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <p className="text-2xl font-black text-orange-700">{result.updatedItems.toLocaleString()}</p>
              <p className="text-sm text-orange-600">Prices Updated</p>
            </div>
          </div>

          {result.categories.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-green-800 mb-2">Categories Processed:</p>
              <div className="flex flex-wrap gap-2">
                {result.categories.map(category => (
                  <span key={category} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-red-800 mb-2">Warnings:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {result.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={resetUpload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Upload Another File
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-900">Upload Failed</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={resetUpload}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}