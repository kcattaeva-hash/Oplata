import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Log } from '../App';
import { History, UserPlus, Edit, Trash2, DollarSign, Calendar, Download, Upload, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface ActivityLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: Log[];
}

export function ActivityLogDialog({ open, onOpenChange, logs }: ActivityLogDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} д назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Добавлен ученик')) return <UserPlus className="h-4 w-4" />;
    if (action.includes('Изменен')) return <Edit className="h-4 w-4" />;
    if (action.includes('Удален')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('платеж')) return <DollarSign className="h-4 w-4" />;
    if (action.includes('рассрочк')) return <Calendar className="h-4 w-4" />;
    if (action.includes('Экспорт')) return <Download className="h-4 w-4" />;
    if (action.includes('Импорт')) return <Upload className="h-4 w-4" />;
    if (action.includes('Очищены')) return <AlertTriangle className="h-4 w-4" />;
    return <History className="h-4 w-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('Добавлен')) return 'bg-green-100 text-green-700 border-green-200';
    if (action.includes('Изменен')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (action.includes('Удален')) return 'bg-red-100 text-red-700 border-red-200';
    if (action.includes('платеж') && !action.includes('Удален')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (action.includes('рассрочк')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (action.includes('Экспорт') || action.includes('Импорт')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (action.includes('Очищены')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-slate-300/50 max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
              <History className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <DialogTitle className="text-2xl bg-gradient-to-r from-slate-600 via-amber-600 to-gray-700 bg-clip-text text-transparent">
                История действий
              </DialogTitle>
              <DialogDescription>
                Лог всех операций в системе
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск в логах..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-slate-300/50"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 border border-slate-300/50">
              <div className="text-sm text-gray-600">Всего записей</div>
              <div className="text-2xl bg-gradient-to-r from-slate-600 to-amber-600 bg-clip-text text-transparent">
                {logs.length}
              </div>
            </div>
            <div className="glass rounded-xl p-3 border border-slate-300/50">
              <div className="text-sm text-gray-600">Сегодня</div>
              <div className="text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp);
                  const today = new Date();
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </div>
            </div>
            <div className="glass rounded-xl p-3 border border-slate-300/50">
              <div className="text-sm text-gray-600">Найдено</div>
              <div className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {filteredLogs.length}
              </div>
            </div>
          </div>

          {/* Logs List */}
          <ScrollArea className="h-[400px] pr-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет записей в логах</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="glass rounded-xl p-4 border border-slate-300/50 hover:border-amber-400/50 transition-all duration-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`${getActionColor(log.action)} border`}
                            >
                              {log.action}
                            </Badge>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 break-words">{log.details}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
