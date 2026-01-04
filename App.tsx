import React, { useState, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultTable from './components/ResultTable';
import { analyzeImage } from './services/geminiService';
import { generateExcel } from './services/excelService';
import { CourseRecord, AppState } from './types';
import { Loader2, FileSpreadsheet, Sparkles, AlertCircle, ImagePlus } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [records, setRecords] = useState<CourseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Deduplicates an array of course records based on all fields.
   */
  const deduplicateRecords = (data: CourseRecord[]): CourseRecord[] => {
    const seen = new Set();
    return data.filter(record => {
      // Create a unique key for the record
      const key = `${record.date}|${record.time}|${record.studentName}|${record.courseName}|${record.teacherName}`.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const processImages = async (base64Images: string[], append: boolean) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    setProcessedCount(0);
    setTotalCount(base64Images.length);

    // If not appending, clear existing records immediately
    if (!append) {
      setRecords([]);
    }

    try {
      const results: CourseRecord[] = [];
      const errors: string[] = [];

      // Process images in parallel
      const promises = base64Images.map(async (img, index) => {
          try {
              const data = await analyzeImage(img);
              return { status: 'fulfilled', value: data };
          } catch (e: any) {
              return { status: 'rejected', reason: `图片 ${index + 1}: ${e.message}` };
          } finally {
              setProcessedCount(prev => prev + 1);
          }
      });

      const outcomes = await Promise.all(promises);

      outcomes.forEach((outcome) => {
          // @ts-ignore - simple types for outcome
          if (outcome.status === 'fulfilled' && outcome.value) {
              // @ts-ignore
              results.push(...outcome.value);
          // @ts-ignore
          } else if (outcome.status === 'rejected') {
              // @ts-ignore
              errors.push(outcome.reason as string);
          }
      });

      if (results.length === 0 && errors.length > 0) {
          throw new Error("无法从图片中提取数据。\n" + errors.join("\n"));
      }

      setRecords(prev => {
        const combined = append ? [...prev, ...results] : results;
        return deduplicateRecords(combined);
      });
      
      setAppState(AppState.SUCCESS);
      
      if (errors.length > 0) {
         setError(`处理过程中出现部分错误: ${errors.join("; ")}`);
      }

    } catch (err: any) {
      setError(err.message || "发生未知错误。");
      setAppState(AppState.ERROR);
    }
  };

  const handleImagesSelected = (base64Images: string[]) => {
    processImages(base64Images, false);
  };

  const handleAddMoreImages = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length > 0) {
        const promises = validFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        });
        const images = await Promise.all(promises);
        processImages(images, true);
      }
    }
    // Reset value so same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    if (records.length > 0) {
      generateExcel(records);
    }
  };

  const progressPercentage = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* Hidden Input for Adding More Images */}
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={onFileInputChange} 
        className="hidden" 
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">智能课程表提取助手</h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Powered by Gemini AI
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            图片转 Excel 课程表
          </h2>
          <p className="text-lg text-gray-600">
            上传课程表截图，自动提取日期、学生、老师和时间信息，一键导出 Excel。
          </p>
        </div>

        {/* Upload Section */}
        <ImageUploader 
          onImageSelected={handleImagesSelected} 
          isLoading={appState === AppState.PROCESSING} 
        />

        {/* State: Processing */}
        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-in fade-in zoom-in duration-300">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>正在分析课程表...</span>
                <span>{progressPercentage}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner border border-gray-300">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <p className="text-xs text-center text-gray-500">
                已处理 {processedCount} / {totalCount} 张图片
              </p>
            </div>
          </div>
        )}

        {/* State: Error */}
        {appState === AppState.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex items-start gap-4 animate-in slide-in-from-bottom-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-900 mb-1">提取失败</h3>
              <p className="text-red-700 whitespace-pre-wrap">{error}</p>
              <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="mt-3 text-sm font-semibold text-red-800 hover:text-red-900 hover:underline"
              >
                重新上传
              </button>
            </div>
          </div>
        )}

        {/* State: Success */}
        {appState === AppState.SUCCESS && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
             {error && (
               <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                 <p className="text-yellow-800 text-sm">{error}</p>
               </div>
             )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">提取结果</h3>
                <p className="text-sm text-gray-500">
                  共找到 {records.length} 条记录 (已去重)
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleAddMoreImages}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-3 rounded-lg font-medium shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600"
                >
                  <ImagePlus size={20} />
                  添加更多图片
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <FileSpreadsheet size={20} />
                  导出 Excel
                </button>
              </div>
            </div>

            <ResultTable data={records} />

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex items-start gap-3">
              <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                <strong>提示:</strong> 系统会自动合并多张图片的记录并去除重复项。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;