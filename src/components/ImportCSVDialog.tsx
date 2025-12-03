import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { FileUp, Download, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Student } from '../App';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportStudents: (students: Student[]) => void;
}

export function ImportCSVDialog({ open, onOpenChange, onImportStudents }: ImportCSVDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Student[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capitalizeWords = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const normalizeTariff = (tariff: string): string => {
    const normalized = tariff.toLowerCase().trim();
    
    // Mapping of possible tariff names to standard values
    if (normalized.includes('груп') || normalized === 'group') {
      return 'group';
    } else if (normalized.includes('эксперт') || normalized === 'mini-group' || normalized.includes('мини')) {
      return 'mini-group';
    } else if (normalized.includes('вип') || normalized === 'individual' || normalized.includes('индив')) {
      return 'individual';
    }
    
    // If we can't map it, return the original value
    return tariff;
  };

  const getTariffDisplayName = (tariff: string): string => {
    switch (tariff) {
      case 'group':
        return 'Групповой';
      case 'mini-group':
        return 'Эксперт';
      case 'individual':
        return 'ВИП';
      default:
        return tariff;
    }
  };

  const parseCSV = (text: string): Student[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors(['Файл пустой или содержит только заголовки']);
      return [];
    }

    const students: Student[] = [];
    const newErrors: string[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length < 3) {
        newErrors.push(`Строка ${i + 1}: недостаточно данных`);
        continue;
      }

      const name = capitalizeWords(parts[0]);
      const tariff = normalizeTariff(parts[1]);
      const totalAmount = parseFloat(parts[2]);
      const phone = parts[3] || '';
      const initialPayment = parts[4] ? parseFloat(parts[4]) : 0;

      if (!name) {
        newErrors.push(`Строка ${i + 1}: отсутствует имя`);
        continue;
      }

      if (!tariff) {
        newErrors.push(`Строка ${i + 1}: отсутствует тариф`);
        continue;
      }

      if (isNaN(totalAmount) || totalAmount <= 0) {
        newErrors.push(`Строка ${i + 1}: неверная сумма`);
        continue;
      }

      const student: Student = {
        id: `import-${Date.now()}-${i}`,
        name,
        tariff,
        totalAmount,
        phone: phone || undefined,
        paidAmount: 0,
        installments: [],
        initialPayment: initialPayment || 0,
        initialPaymentPaid: false,
      };

      students.push(student);
    }

    setErrors(newErrors);
    return students;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedStudents = parseCSV(text);
        setPreview(parsedStudents);
      } catch (error) {
        setErrors(['Ошибка чтения файла']);
        setPreview([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.error('Нет данных для импорта');
      return;
    }

    onImportStudents(preview);
    toast.success('Ученики импортированы', {
      description: `Добавлено учеников: ${preview.length}`,
    });
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = `Имя,Тариф,Сумма,Телефон,Первоначальный взнос
Иван Иванов,Групповой,50000,+7 900 123-45-67,5000
Мария Петрова,ВИП,80000,+7 900 987-65-43,10000
Алексей Сидоров,Эксперт,60000,+7 900 555-55-55,6000`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-slate-300/50 max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200">
              <FileUp className="h-6 w-6 text-indigo-700" />
            </div>
            <div>
              <DialogTitle className="text-2xl bg-gradient-to-r from-slate-600 via-indigo-600 to-gray-700 bg-clip-text text-transparent">
                Импорт учеников из CSV
              </DialogTitle>
              <DialogDescription>
                Загрузите CSV файл с данными учеников
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <Alert className="glass border-blue-300/50 bg-blue-50/50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Формат CSV:</strong> Имя, Тариф, Сумма, Телефон, Первоначальный взнос
              <br />
              Имена будут автоматически отформатированы (первая буква заглавная)
            </AlertDescription>
          </Alert>

          {/* Download Template */}
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full glass border-slate-300/50 hover:border-indigo-400/50"
          >
            <Download className="mr-2 h-4 w-4" />
            Скачать шаблон CSV
          </Button>

          {/* File Upload */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 glass hover:border-indigo-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileUp className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-3">
              {file ? file.name : 'Выберите CSV файл для загрузки'}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="glass border-slate-300/50"
            >
              Выбрать файл
            </Button>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert className="glass border-red-300/50 bg-red-50/50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-900">
                <strong>Обнаружены ошибки:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="text-lg">Предпросмотр ({preview.length} учеников)</h3>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {preview.map((student, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass rounded-lg p-3 border border-slate-300/50 hover:border-indigo-400/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">{getTariffDisplayName(student.tariff)}</div>
                        {student.phone && (
                          <div className="text-sm text-gray-500">{student.phone}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-amber-700">
                          {student.totalAmount.toLocaleString('ru-RU')} ₽
                        </div>
                        {student.initialPayment > 0 && (
                          <div className="text-sm text-gray-600">
                            Бронь: {student.initialPayment.toLocaleString('ru-RU')} ₽
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline" className="glass border-slate-300/50">
            Отмена
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0}
            className="bg-gradient-to-r from-slate-500 via-indigo-500 to-gray-600 hover:from-slate-600 hover:via-indigo-600 hover:to-gray-700 text-white"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Импортировать ({preview.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}