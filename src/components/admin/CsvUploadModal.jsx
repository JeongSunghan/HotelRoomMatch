import { useState, useRef } from 'react';
import { parseCSV, validateUploadData, generateCSVTemplate } from '../../utils/csvParser';
import { roomData } from '../../data/roomData';
import { getGenderLabel } from '../../utils/genderUtils';

/**
 * CSV 일괄 업로드 모달
 */
export default function CsvUploadModal({ onUpload, onClose }) {
    const [step, setStep] = useState('upload'); // 'upload', 'preview', 'result'
    const [csvData, setCsvData] = useState([]);
    const [validData, setValidData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState({ success: 0, failed: 0 });
    const fileInputRef = useRef(null);

    // 파일 선택 처리
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = parseCSV(text);
            setCsvData(parsed);

            const { valid, errors } = validateUploadData(parsed, roomData);
            setValidData(valid);
            setErrors(errors);
            setStep('preview');
        } catch (error) {
            alert('CSV 파싱 오류: ' + error.message);
        }
    };

    // 드래그 앤 드롭
    const handleDrop = async (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('CSV 파일만 업로드 가능합니다.');
            return;
        }

        try {
            const text = await file.text();
            const parsed = parseCSV(text);
            setCsvData(parsed);

            const { valid, errors } = validateUploadData(parsed, roomData);
            setValidData(valid);
            setErrors(errors);
            setStep('preview');
        } catch (error) {
            alert('CSV 파싱 오류: ' + error.message);
        }
    };

    // 일괄 등록 실행
    const handleUpload = async () => {
        setIsUploading(true);
        let success = 0;
        let failed = 0;

        for (const row of validData) {
            try {
                const guestData = {
                    name: row.name,
                    company: row.company || '',
                    gender: row.gender,
                    age: row.age || null,
                    sessionId: `csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    registeredAt: Date.now(),
                    registeredByAdmin: true,
                    uploadedViaCSV: true
                };

                await onUpload(row.roomNumber, guestData);
                success++;
            } catch (error) {
                failed++;
                console.error('업로드 실패:', row.name, error);
            }
        }

        setUploadResult({ success, failed });
        setStep('result');
        setIsUploading(false);
    };

    // 템플릿 다운로드
    const handleDownloadTemplate = () => {
        const template = generateCSVTemplate();
        const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'guest_upload_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        📤 CSV 일괄 업로드
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        ✕
                    </button>
                </div>

                {/* Step 1: 업로드 */}
                {step === 'upload' && (
                    <div>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="text-5xl mb-4">📁</div>
                            <p className="text-gray-600 mb-2">
                                CSV 파일을 드래그하거나 클릭하여 선택
                            </p>
                            <p className="text-sm text-gray-400">
                                필수 열: 성명, 이메일, 성별 / 선택 열: 소속명, 직위, 1인실 여부
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <div className="mt-4 flex justify-center">
                            <button
                                onClick={handleDownloadTemplate}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                📥 템플릿 다운로드
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: 미리보기 */}
                {step === 'preview' && (
                    <div>
                        {/* 요약 */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-green-800 font-bold text-2xl">{validData.length}</p>
                                <p className="text-green-600 text-sm">등록 가능</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-red-800 font-bold text-2xl">{errors.length}</p>
                                <p className="text-red-600 text-sm">오류</p>
                            </div>
                        </div>

                        {/* 오류 목록 */}
                        {errors.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-medium text-red-700 mb-2">⚠️ 오류 항목</h3>
                                <div className="max-h-32 overflow-y-auto bg-red-50 rounded-lg p-3 text-sm">
                                    {errors.map((err, idx) => (
                                        <div key={idx} className="text-red-700 mb-1">
                                            <strong>행 {err.line}:</strong> {err.data.name || '(이름없음)'} - {err.errors.join(', ')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 유효 데이터 미리보기 */}
                        {validData.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-medium text-gray-700 mb-2">✅ 등록 예정</h3>
                                <div className="max-h-48 overflow-y-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left">이름</th>
                                                <th className="px-3 py-2 text-left">이메일</th>
                                                <th className="px-3 py-2 text-left">소속</th>
                                                <th className="px-3 py-2 text-left">직위</th>
                                                <th className="px-3 py-2 text-left">성별</th>
                                                <th className="px-3 py-2 text-left">1인실</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validData.map((row, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="px-3 py-2">{row.name}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-500">{row.email}</td>
                                                    <td className="px-3 py-2 text-gray-500">{row.company || '-'}</td>
                                                    <td className="px-3 py-2 text-gray-500">{row.position || '-'}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={row.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}>
                                                            {getGenderLabel(row.gender)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className={row.singleRoom ? 'text-green-600' : 'text-gray-500'}>
                                                            {row.singleRoom ? '1인실' : '2인실'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 버튼 */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setStep('upload'); setCsvData([]); setValidData([]); setErrors([]); }}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                다시 선택
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={validData.length === 0 || isUploading}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? '업로드 중...' : `${validData.length}명 등록하기`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: 결과 */}
                {step === 'result' && (
                    <div className="text-center py-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">업로드 완료!</h3>
                        <div className="flex justify-center gap-8 mb-6">
                            <div>
                                <p className="text-3xl font-bold text-green-600">{uploadResult.success}</p>
                                <p className="text-sm text-gray-500">성공</p>
                            </div>
                            {uploadResult.failed > 0 && (
                                <div>
                                    <p className="text-3xl font-bold text-red-600">{uploadResult.failed}</p>
                                    <p className="text-sm text-gray-500">실패</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-8 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium"
                        >
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
