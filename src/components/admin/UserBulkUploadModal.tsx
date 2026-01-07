/**
 * Firestore User 일괄 업로드 모달
 * 관리자 전용 CSV/JSON 파일 업로드 기능
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
    parseCSVForFirestore,
    parseJSONForFirestore,
    generateCSVTemplateForFirestore,
    type FirestoreUserParseResult
} from '../../utils/csvParser';
import type { FirestoreUserCreateData } from '../../types/firestore';
import { getGenderLabel } from '../../utils/genderUtils';

interface UserBulkUploadModalProps {
    onUpload: (users: FirestoreUserCreateData[]) => Promise<{
        success: number;
        failed: number;
        errors: Array<{ index: number; email: string; error: string }>;
    }>;
    onClose: () => void;
}

type FileType = 'csv' | 'json';
type Step = 'upload' | 'preview' | 'uploading' | 'result';

/**
 * Firestore User 일괄 업로드 모달
 */
export default function UserBulkUploadModal({ onUpload, onClose }: UserBulkUploadModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [fileType, setFileType] = useState<FileType>('csv');
    const [parseResult, setParseResult] = useState<FirestoreUserParseResult | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadResult, setUploadResult] = useState<{
        success: number;
        failed: number;
        errors: Array<{ index: number; email: string; error: string }>;
    } | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // 파일 선택 처리
    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    // 드래그 앤 드롭 처리
    const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (): void => {
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>): Promise<void> => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    // 파일 처리
    const processFile = async (file: File): Promise<void> => {
        try {
            const text = await file.text();
            
            // 파일 확장자로 타입 확인
            const fileName = file.name.toLowerCase();
            const detectedType: FileType = fileName.endsWith('.json') ? 'json' : 'csv';
            setFileType(detectedType);

            // 파일 파싱
            let result: FirestoreUserParseResult;
            if (detectedType === 'json') {
                result = parseJSONForFirestore(text);
            } else {
                result = parseCSVForFirestore(text);
            }

            setParseResult(result);
            setStep('preview');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`${fileType.toUpperCase()} 파싱 오류: ${errorMessage}`);
        }
    };

    // 일괄 등록 실행
    const handleUpload = async (): Promise<void> => {
        if (!parseResult || parseResult.valid.length === 0) {
            alert('등록할 데이터가 없습니다.');
            return;
        }

        setIsUploading(true);
        setStep('uploading');
        setUploadProgress(0);

        try {
            const result = await onUpload(parseResult.valid);
            setUploadResult(result);
            setStep('result');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`업로드 실패: ${errorMessage}`);
            setStep('preview');
        } finally {
            setIsUploading(false);
        }
    };

    // 템플릿 다운로드
    const handleDownloadTemplate = (): void => {
        const template = generateCSVTemplateForFirestore();
        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'user_upload_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 처음으로 돌아가기
    const handleReset = (): void => {
        setStep('upload');
        setParseResult(null);
        setUploadResult(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">유저 일괄 등록</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        aria-label="닫기"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 본문 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* 파일 형식 선택 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    파일 형식 선택
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="fileType"
                                            value="csv"
                                            checked={fileType === 'csv'}
                                            onChange={() => setFileType('csv')}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>CSV</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="fileType"
                                            value="json"
                                            checked={fileType === 'json'}
                                            onChange={() => setFileType('json')}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>JSON</span>
                                    </label>
                                </div>
                            </div>

                            {/* 파일 업로드 영역 */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    border-2 border-dashed rounded-xl p-8 text-center transition-colors
                                    ${isDragging 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-300 hover:border-gray-400'}
                                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={fileType === 'json' ? '.json' : '.csv'}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                
                                <svg
                                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                
                                <p className="text-gray-600 mb-2">
                                    파일을 드래그 앤 드롭하거나
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    파일 선택
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                    {fileType === 'csv' ? 'CSV' : 'JSON'} 파일만 업로드 가능합니다.
                                </p>
                            </div>

                            {/* 템플릿 다운로드 */}
                            {fileType === 'csv' && (
                                <div className="text-center">
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="text-blue-600 hover:text-blue-700 underline text-sm"
                                    >
                                        CSV 템플릿 다운로드
                                    </button>
                                </div>
                            )}

                            {/* 필드 설명 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">필드 순서 (CSV)</h3>
                                <p className="text-sm text-gray-600">
                                    소속 | 이름 | 직위 | 이메일 | 연락처 | 1인실여부 | 성별
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    • 1인실여부: Y/N, true/false, 1/0, 예/아니오
                                    <br />
                                    • 성별: M/F, 남/여, 남성/여성, MALE/FEMALE
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && parseResult && (
                        <div className="space-y-6">
                            {/* 파싱 결과 요약 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{parseResult.valid.length}</p>
                                    <p className="text-sm text-gray-600">유효한 데이터</p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-red-600">{parseResult.errors.length}</p>
                                    <p className="text-sm text-gray-600">오류 데이터</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-600">
                                        {parseResult.valid.length + parseResult.errors.length}
                                    </p>
                                    <p className="text-sm text-gray-600">전체 데이터</p>
                                </div>
                            </div>

                            {/* 유효한 데이터 미리보기 */}
                            {parseResult.valid.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-3">등록 예정 데이터 (최대 10개 표시)</h3>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left border-b">소속</th>
                                                    <th className="px-3 py-2 text-left border-b">이름</th>
                                                    <th className="px-3 py-2 text-left border-b">직위</th>
                                                    <th className="px-3 py-2 text-left border-b">이메일</th>
                                                    <th className="px-3 py-2 text-left border-b">연락처</th>
                                                    <th className="px-3 py-2 text-left border-b">1인실</th>
                                                    <th className="px-3 py-2 text-left border-b">성별</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parseResult.valid.slice(0, 10).map((user, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="px-3 py-2">{user.org}</td>
                                                        <td className="px-3 py-2">{user.name}</td>
                                                        <td className="px-3 py-2">{user.position}</td>
                                                        <td className="px-3 py-2">{user.email}</td>
                                                        <td className="px-3 py-2">{user.phone}</td>
                                                        <td className="px-3 py-2">{user.singleAllowed ? 'Y' : 'N'}</td>
                                                        <td className="px-3 py-2">{getGenderLabel(user.gender)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parseResult.valid.length > 10 && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            외 {parseResult.valid.length - 10}개 더...
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* 오류 데이터 표시 */}
                            {parseResult.errors.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-red-700 mb-3">오류 데이터</h3>
                                    <div className="max-h-60 overflow-y-auto border border-red-200 rounded-lg">
                                        {parseResult.errors.map((error, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 border-b border-red-100 bg-red-50"
                                            >
                                                <p className="font-medium text-red-800 mb-1">
                                                    라인 {error.line}: {error.data.email || error.data.name || '알 수 없음'}
                                                </p>
                                                <ul className="text-sm text-red-700 list-disc list-inside">
                                                    {error.errors.map((err, errIdx) => (
                                                        <li key={errIdx}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'uploading' && (
                        <div className="text-center py-12">
                            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600">등록 중...</p>
                            {uploadProgress > 0 && (
                                <p className="text-sm text-gray-500 mt-2">{uploadProgress}%</p>
                            )}
                        </div>
                    )}

                    {step === 'result' && uploadResult && (
                        <div className="space-y-6">
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">등록 완료</h3>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-2xl font-bold text-green-600">{uploadResult.success}</p>
                                        <p className="text-sm text-gray-600">성공</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                                        <p className="text-sm text-gray-600">실패</p>
                                    </div>
                                </div>
                            </div>

                            {/* 실패 상세 정보 */}
                            {uploadResult.errors.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-red-700 mb-3">실패 상세</h4>
                                    <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg">
                                        {uploadResult.errors.map((error, idx) => (
                                            <div key={idx} className="p-3 border-b border-red-100 bg-red-50">
                                                <p className="text-sm text-red-800">
                                                    {error.email}: {error.error}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    {step === 'upload' && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            닫기
                        </button>
                    )}
                    {step === 'preview' && (
                        <>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                다시 선택
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!parseResult || parseResult.valid.length === 0}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                            >
                                등록하기 ({parseResult?.valid.length || 0}개)
                            </button>
                        </>
                    )}
                    {step === 'result' && (
                        <>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                다시 업로드
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                완료
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

