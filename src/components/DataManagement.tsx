import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Database, Download, Upload, FileUp, Trash2, History, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { ActivityLogDialog } from './ActivityLogDialog';
import { ImportCSVDialog } from './ImportCSVDialog';
import { Student, Log } from '../App';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface DataManagementProps {
  logs: Log[];
  onExportData: () => void;
  onImportData: (data: { students: Student[], payments: any[], logs: Log[] }) => void;
  onImportStudents: (students: Student[]) => void;
  onClearData: () => void;
}

export function DataManagement({
  logs,
  onExportData,
  onImportData,
  onImportStudents,
  onClearData,
}: DataManagementProps) {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    onExportData();
    toast.success('Данные экспортированы', {
      description: 'Файл backup успешно сохранен',
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImportData(data);
        toast.success('Данные импортированы', {
          description: 'Backup успешно восстановлен',
        });
      } catch (error) {
        toast.error('Ошибка импорта', {
          description: 'Неверный формат файла',
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    onClearData();
    setClearDialogOpen(false);
    toast.success('Данные очищены', {
      description: 'Все ученики и платежи удалены',
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              className="glass border-slate-300/50 hover:border-amber-400/50 hover:bg-white/40 transition-all duration-300 group"
            >
              <Database className="mr-2 h-4 w-4 text-slate-600 group-hover:text-amber-600 transition-colors" />
              Управление данными
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass border-slate-300/50">
          <DropdownMenuItem onClick={handleExport} className="cursor-pointer hover:bg-white/60">
            <Download className="mr-2 h-4 w-4 text-green-600" />
            Экспорт данных (JSON)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick} className="cursor-pointer hover:bg-white/60">
            <Upload className="mr-2 h-4 w-4 text-blue-600" />
            Импорт данных (JSON)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCsvDialogOpen(true)} className="cursor-pointer hover:bg-white/60">
            <FileUp className="mr-2 h-4 w-4 text-indigo-600" />
            Импорт учеников (CSV)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setLogsDialogOpen(true)} className="cursor-pointer hover:bg-white/60">
            <History className="mr-2 h-4 w-4 text-amber-600" />
            История действий
            {logs.length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {logs.length}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setClearDialogOpen(true)} 
            className="cursor-pointer hover:bg-red-50 text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Очистить все данные
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="glass border-slate-300/50">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-2xl">
                Подтвердите удаление
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Вы уверены, что хотите удалить все данные? Это действие нельзя отменить. 
              Все ученики, платежи и история будут безвозвратно удалены.
              <br /><br />
              <span className="text-red-600">Рекомендуем сначала создать backup данных.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-slate-300/50">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              Удалить все данные
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ActivityLogDialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
        logs={logs}
      />

      <ImportCSVDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        onImportStudents={onImportStudents}
      />
    </>
  );
}
