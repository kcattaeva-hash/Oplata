import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Download, Upload, Trash2, AlertTriangle, FileJson, Database, History } from 'lucide-react';
import { Student, Payment, ActivityLog } from '../App';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface DataManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  payments: Payment[];
  activityLog: ActivityLog[];
  onImportData: (students: Student[], payments: Payment[]) => void;
  onClearAllData: () => void;
}

export function DataManagementDialog({
  open,
  onOpenChange,
  students,
  payments,
  activityLog,
  onImportData,
  onClearAllData,
}: DataManagementDialogProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('export');

  const handleExportJSON = () => {
    const data = {
      students,
      payments,
      activityLog,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Данные успешно экспортированы', {
      description: `Файл сохранен: payment-system-backup-${new Date().toISOString().split('T')[0]}.json`,
    });
  };

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push(['Имя', 'Телефон', 'Тариф', 'Общая сумма', 'Оплачено', 'Задолженность', 'Статус'].join(','));

    students.forEach(student => {
      const debt = student.totalAmount - student.paidAmount;
      const status = debt <= 0 ? 'Оплачено' : 'Долг';
      csvRows.push([
        `"${student.name}"`,
        student.phone || '',
        `"${student.tariff}"`,
        student.totalAmount,
        student.paidAmount,
        debt,
        status,
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV файл успешно экспортирован', {
      description: `Экспортировано ${students.length} студентов`,
    });
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.students || !Array.isArray(data.students)) {
          toast.error('Неверный формат файла', {
            description: 'Файл не содержит данных о студентах',
          });
          return;
        }

        onImportData(data.students, data.payments || []);
        toast.success('Данные успешно импортированы', {
          description: `Загружено ${data.students.length} студентов и ${data.payments?.length || 0} платежей`,
        });
        onOpenChange(false);
      } catch (error) {
        toast.error('Ошибка импорта', {
          description: 'Не удалось прочитать файл. Проверьте формат данных.',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        
        if (rows.length < 2) {
          toast.error('Файл пустой или содержит только заголовки');
          return;
        }

        const importedStudents: Student[] = [];
        
        // Пропускаем первую строку (заголовки)
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length >= 4) {
            const student: Student = {
              id: Date.now().toString() + i,
              name: values[0],
              phone: values[1] || undefined,
              tariff: values[2],
              totalAmount: parseFloat(values[3]) || 0,
              paidAmount: parseFloat(values[4]) || 0,
              initialPayment: 0,
              initialPaymentPaid: false,
              installments: [],
            };
            importedStudents.push(student);
          }
        }

        if (importedStudents.length > 0) {
          onImportData(importedStudents, []);
          toast.success('CSV файл успешно импортирован', {
            description: `Загружено ${importedStudents.length} студентов`,
          });
          onOpenChange(false);
        } else {
          toast.error('Не удалось импортировать студентов', {
            description: 'Проверьте формат CSV файла',
          });
        }
      } catch (error) {
        toast.error('Ошибка импорта CSV', {
          description: 'Не удалось прочитать файл. Проверьте формат данных.',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearData = () => {
    setClearDialogOpen(true);
  };

  const confirmClearData = () => {
    onClearAllData();
    setClearDialogOpen(false);
    onOpenChange(false);
    toast.success('Все данные удалены', {
      description: 'База данных очищена полностью',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Добавлен')) return '➕';
    if (action.includes('Удален')) return '🗑️';
    if (action.includes('Изменен') || action.includes('Обновлен')) return '✏️';
    if (action.includes('Платеж')) return '💰';
    return '📝';
  };

  const getActionColor = (action: string) => {
    if (action.includes('Добавлен')) return 'bg-green-100 text-green-700 border-green-300';
    if (action.includes('Удален')) return 'bg-red-100 text-red-700 border-red-300';
    if (action.includes('Изменен') || action.includes('Обновлен')) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (action.includes('Платеж')) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] glass border-slate-300/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-slate-600 via-amber-600 to-gray-700 bg-clip-text text-transparent">
              <Database className="w-6 h-6 text-amber-600" />
              Управление данными
            </DialogTitle>
            <DialogDescription>
              Экспорт, импорт и очистка всех данных системы
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100/50">
              <TabsTrigger value="export" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-400 data-[state=active]:to-amber-400 data-[state=active]:text-white">
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </TabsTrigger>
              <TabsTrigger value="import" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-400 data-[state=active]:to-amber-400 data-[state=active]:text-white">
                <Upload className="w-4 h-4 mr-2" />
                Импорт
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-400 data-[state=active]:to-amber-400 data-[state=active]:text-white">
                <History className="w-4 h-4 mr-2" />
                История ({activityLog.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-4 mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="glass-dark rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <FileJson className="w-5 h-5 text-amber-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-white mb-1">Экспорт в JSON</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        Полная резервная копия всех данных (студенты, платежи, история)
                      </p>
                      <Button
                        onClick={handleExportJSON}
                        className="bg-gradient-to-r from-slate-500 to-amber-500 hover:from-slate-600 hover:to-amber-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать JSON
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="glass-dark rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-amber-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-white mb-1">Экспорт в CSV</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        Таблица студентов для Excel/Google Sheets
                      </p>
                      <Button
                        onClick={handleExportCSV}
                        className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать CSV
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 border-2 border-amber-200/50">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-lg">📊</span>
                    <span>Всего студентов: <strong>{students.length}</strong></span>
                    <span>•</span>
                    <span>Платежей: <strong>{payments.length}</strong></span>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="glass rounded-xl p-4 border-2 border-amber-400/50 bg-amber-50/50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      <strong>Внимание!</strong> Импорт данных добавит новых студентов к существующим. Для полной замены сначала очистите базу данных.
                    </p>
                  </div>
                </div>

                <div className="glass-dark rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <FileJson className="w-5 h-5 text-amber-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-white mb-1">Импорт из JSON</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        Загрузить полную резервную копию данных
                      </p>
                      <label htmlFor="import-json">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-slate-500 to-amber-500 hover:from-slate-600 hover:to-amber-600 text-white cursor-pointer"
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Выбрать JSON файл
                          </span>
                        </Button>
                      </label>
                      <input
                        id="import-json"
                        type="file"
                        accept=".json"
                        onChange={handleImportJSON}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-dark rounded-xl p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-amber-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-white mb-1">Импорт из CSV</h3>
                      <p className="text-gray-300 text-sm mb-3">
                        Загрузить список студентов из таблицы (формат: Имя, Телефон, Тариф, Общая сумма, Оплачено)
                      </p>
                      <label htmlFor="import-csv">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white cursor-pointer"
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Выбрать CSV файл
                          </span>
                        </Button>
                      </label>
                      <input
                        id="import-csv"
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="logs" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ScrollArea className="h-[400px] glass rounded-xl p-4">
                  {activityLog.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>История действий пуста</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...activityLog].reverse().map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`p-3 rounded-lg border ${getActionColor(log.action)} backdrop-blur-sm`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0">{getActionIcon(log.action)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium break-words">{log.action}</p>
                              {log.details && (
                                <p className="text-sm opacity-75 mt-1 break-words">{log.details}</p>
                              )}
                              <p className="text-xs opacity-60 mt-2">{formatDate(log.timestamp)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-slate-300/30">
            <Button
              onClick={handleClearData}
              variant="destructive"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить все данные
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="glass border-slate-300/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Подтверждение удаления
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.
              <br /><br />
              Будет удалено:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>{students.length}</strong> студентов</li>
                <li><strong>{payments.length}</strong> платежей</li>
                <li><strong>{activityLog.length}</strong> записей истории</li>
              </ul>
              <br />
              <strong>Рекомендуется сначала создать резервную копию!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-100 hover:bg-slate-200">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearData}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              Да, удалить все
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
