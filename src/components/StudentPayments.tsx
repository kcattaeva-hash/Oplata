import { useState, useMemo } from 'react';
import { Badge } from './ui/badge';
import { DollarSign, Trash2, Edit, Search, CalendarDays, Check, X, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Student, Payment, Installment } from '../App';
import { EditStudentDialog } from './EditStudentDialog';
import { InstallmentsDialog } from './InstallmentsDialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'motion/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

interface StudentPaymentsProps {
  students: Student[];
  payments: Payment[];
  onAddPayment: (studentId: string, amount: number, note: string) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onDeletePayment: (paymentId: string, studentId: string, amount: number) => void;
  onUpdateInstallment: (studentId: string, installmentId: string, updates: Partial<Installment>) => void;
  onAddInstallment: (studentId: string, installment: Omit<Installment, 'id' | 'isPaid'>) => void;
  onDeleteInstallment: (studentId: string, installmentId: string) => void;
}

export function StudentPayments({
  students,
  payments,
  onAddPayment,
  onUpdateStudent,
  onDeleteStudent,
  onDeletePayment,
  onUpdateInstallment,
  onAddInstallment,
  onDeleteInstallment,
}: StudentPaymentsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [installmentsDialogOpen, setInstallmentsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debt' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'debt'>('name');
  
  // For inline editing
  const [editingCell, setEditingCell] = useState<{studentId: string, type: 'initial' | 'installment', installmentId?: string} | null>(null);
  const [editValue, setEditValue] = useState('');

  const maxInstallments = Math.max(...students.map(s => s.installments.length), 0);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const debt = student.totalAmount - student.paidAmount;
      if (statusFilter === 'debt' && debt <= 0) return false;
      if (statusFilter === 'paid' && debt > 0) return false;

      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        const debtA = a.totalAmount - a.paidAmount;
        const debtB = b.totalAmount - b.paidAmount;
        return debtB - debtA;
      }
    });

    return filtered;
  }, [students, searchQuery, statusFilter, sortBy]);

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditDialogOpen(true);
  };

  const handleViewInstallments = (student: Student) => {
    setSelectedStudent(student);
    setInstallmentsDialogOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedStudent) {
      onDeleteStudent(selectedStudent.id);
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  const toggleInitialPayment = (student: Student) => {
    onUpdateStudent(student.id, {
      initialPaymentPaid: !student.initialPaymentPaid,
      initialPaymentDate: !student.initialPaymentPaid ? new Date().toISOString() : undefined,
    });
  };

  const toggleInstallmentPayment = (student: Student, installmentId: string, currentStatus: boolean) => {
    onUpdateInstallment(student.id, installmentId, {
      isPaid: !currentStatus,
      paidDate: !currentStatus ? new Date().toISOString() : undefined,
    });
  };

  const startEditingInitial = (student: Student) => {
    setEditingCell({ studentId: student.id, type: 'initial' });
    setEditValue(student.initialPayment.toString());
  };

  const startEditingInstallment = (student: Student, installmentId: string, amount: number) => {
    setEditingCell({ studentId: student.id, type: 'installment', installmentId });
    setEditValue(amount.toString());
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const newAmount = parseFloat(editValue);
    if (isNaN(newAmount) || newAmount < 0) {
      setEditingCell(null);
      return;
    }

    const student = students.find(s => s.id === editingCell.studentId);
    if (!student) return;

    if (editingCell.type === 'initial') {
      const oldInitial = student.initialPayment;
      const diff = newAmount - oldInitial;
      onUpdateStudent(student.id, {
        initialPayment: newAmount,
        totalAmount: student.totalAmount + diff,
      });
    } else if (editingCell.type === 'installment' && editingCell.installmentId) {
      const installment = student.installments.find(inst => inst.id === editingCell.installmentId);
      if (installment) {
        const oldAmount = installment.amount;
        const diff = newAmount - oldAmount;
        onUpdateInstallment(student.id, editingCell.installmentId, {
          amount: newAmount,
        });
        onUpdateStudent(student.id, {
          totalAmount: student.totalAmount + diff,
        });
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const getTariffName = (tariff: string) => {
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-slate-400 via-gray-500 to-zinc-500',
      'from-amber-400 via-yellow-500 to-orange-500',
      'from-gray-300 via-slate-400 to-gray-500',
      'from-yellow-400 via-amber-500 to-yellow-600',
      'from-zinc-400 via-gray-500 to-slate-500',
      'from-orange-400 via-amber-500 to-yellow-500',
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  const calculatePaidAmount = (student: Student) => {
    let paid = 0;
    if (student.initialPaymentPaid) {
      paid += student.initialPayment;
    }
    paid += student.installments.filter(inst => inst.isPaid).reduce((sum, inst) => sum + inst.amount, 0);
    return paid;
  };

  const totalDebt = students.reduce((sum, student) => {
    return sum + (student.totalAmount - calculatePaidAmount(student));
  }, 0);

  const totalCollected = students.reduce((sum, student) => {
    return sum + calculatePaidAmount(student);
  }, 0);

  // Calculate expected payments by month
  const getMonthlyExpectations = () => {
    const monthlyData: { [key: string]: number } = {};
    
    students.forEach(student => {
      // Add unpaid initial payment if exists
      if (!student.initialPaymentPaid) {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + student.initialPayment;
      }
      
      // Add unpaid installments
      student.installments.forEach(inst => {
        if (!inst.isPaid) {
          const date = new Date(inst.dueDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + inst.amount;
        }
      });
    });
    
    // Sort by date and return array
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, amount]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          monthKey,
          monthName: date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
          amount,
        };
      });
  };

  const monthlyExpectations = getMonthlyExpectations();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6 rounded-2xl shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm mb-1">Общая задолженность</p>
            <p className="text-white text-2xl mb-3">{formatCurrency(totalDebt)}</p>
            
            {monthlyExpectations.length > 0 && (
              <div className="space-y-1 border-t border-white/20 pt-3">
                <p className="text-xs text-white/80 mb-2">Ожидается по месяцам:</p>
                <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                  {monthlyExpectations.map((item, idx) => (
                    <motion.div 
                      key={item.monthKey} 
                      className="flex justify-between text-xs bg-white/10 rounded-lg px-2 py-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <span className="text-white/90 capitalize">{item.monthName}:</span>
                      <span className="text-white">{formatCurrency(item.amount)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-amber-400 to-yellow-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6 rounded-2xl shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm mb-1">Собрано</p>
            <p className="text-white text-2xl">{formatCurrency(totalCollected)}</p>
          </div>
        </motion.div>

        <motion.div 
          className="relative overflow-hidden group"
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-gray-400 to-zinc-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6 rounded-2xl shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/90 text-sm mb-1">Всего учеников</p>
            <p className="text-white text-2xl">{students.length}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="flex flex-col md:flex-row gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Поиск по имени..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="debt">С задолженностью</SelectItem>
            <SelectItem value="paid">Оплачено полностью</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">По имени</SelectItem>
            <SelectItem value="debt">По задолженности</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">Ученик</TableHead>
                <TableHead className="text-center min-w-[120px]">Бронь</TableHead>
                {Array.from({ length: maxInstallments }).map((_, index) => (
                  <TableHead key={index} className="text-center min-w-[120px]">
                    Платеж {index + 1}
                  </TableHead>
                ))}
                <TableHead className="min-w-[120px]">Всего</TableHead>
                <TableHead className="min-w-[120px]">Оплачено</TableHead>
                <TableHead className="min-w-[120px]">Долг</TableHead>
                <TableHead className="text-right min-w-[200px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={maxInstallments + 6} className="text-center text-gray-500 py-8">
                    Нет учеников. Добавьте первого ученика.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedStudents.map((student) => {
                  const paidAmount = calculatePaidAmount(student);
                  const debt = student.totalAmount - paidAmount;
                  const isPaid = debt <= 0;
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-white z-10">
                        <motion.div 
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <motion.div 
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient(student.name)} flex items-center justify-center shadow-lg`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <span className="text-white text-sm">{getInitials(student.name)}</span>
                          </motion.div>
                          <div>
                            <p className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 bg-clip-text text-transparent text-lg">{student.name}</p>
                            {student.phone && (
                              <p className="text-xs text-gray-500 mt-0.5">📱 {student.phone}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs">
                                {getTariffName(student.tariff)}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                      
                      {/* Initial Payment */}
                      <TableCell>
                        <div className="flex flex-col items-center gap-2">
                          {editingCell?.studentId === student.id && editingCell?.type === 'initial' ? (
                            <div className="flex gap-1">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                                className="w-20 h-8 text-sm"
                                step="0.01"
                              />
                            </div>
                          ) : (
                            <div 
                              className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                              onDoubleClick={() => startEditingInitial(student)}
                            >
                              {formatCurrency(student.initialPayment)}
                            </div>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="lg"
                              variant={student.initialPaymentPaid ? 'default' : 'outline'}
                              onClick={() => toggleInitialPayment(student)}
                              className={`relative overflow-hidden min-w-[100px] ${
                                student.initialPaymentPaid 
                                  ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg border-0 text-white' 
                                  : 'border-2 border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                              } transition-all duration-300`}
                            >
                              {student.initialPaymentPaid ? (
                                <motion.div 
                                  className="flex items-center gap-2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                >
                                  <Check className="h-5 w-5" />
                                  <span>Оплачено</span>
                                </motion.div>
                              ) : (
                                <span className="text-gray-600">Отметить</span>
                              )}
                            </Button>
                          </motion.div>
                          {student.initialPaymentPaid && student.initialPaymentDate && (
                            <motion.span 
                              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              {formatDate(student.initialPaymentDate)}
                            </motion.span>
                          )}
                        </div>
                      </TableCell>

                      {/* Installment Payments */}
                      {Array.from({ length: maxInstallments }).map((_, index) => {
                        const installment = student.installments[index];
                        if (!installment) {
                          return <TableCell key={index}><div className="text-center text-gray-300">—</div></TableCell>;
                        }

                        const isOverdue = !installment.isPaid && new Date(installment.dueDate) < new Date();
                        const isEditingThis = editingCell?.studentId === student.id && 
                                             editingCell?.type === 'installment' && 
                                             editingCell?.installmentId === installment.id;

                        return (
                          <TableCell key={installment.id}>
                            <div className="flex flex-col items-center gap-2">
                              {isEditingThis ? (
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit();
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                    autoFocus
                                    className="w-20 h-8 text-sm"
                                    step="0.01"
                                  />
                                </div>
                              ) : (
                                <div 
                                  className="text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                                  onDoubleClick={() => startEditingInstallment(student, installment.id, installment.amount)}
                                >
                                  {formatCurrency(installment.amount)}
                                </div>
                              )}
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="lg"
                                  variant={installment.isPaid ? 'default' : 'outline'}
                                  onClick={() => toggleInstallmentPayment(student, installment.id, installment.isPaid)}
                                  className={`relative overflow-hidden min-w-[100px] ${
                                    installment.isPaid 
                                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg border-0 text-white' 
                                      : isOverdue 
                                        ? 'border-2 border-red-400 bg-red-50 hover:bg-red-100 text-red-600' 
                                        : 'border-2 border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                                  } transition-all duration-300`}
                                >
                                  {installment.isPaid ? (
                                    <motion.div 
                                      className="flex items-center gap-2"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: "spring", stiffness: 500 }}
                                    >
                                      <Check className="h-5 w-5" />
                                      <span>Оплачено</span>
                                    </motion.div>
                                  ) : (
                                    <span className={isOverdue ? 'text-red-600' : 'text-gray-600'}>
                                      {isOverdue ? 'Просрочен' : 'Отметить'}
                                    </span>
                                  )}
                                </Button>
                              </motion.div>
                              <motion.span 
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isOverdue && !installment.isPaid 
                                    ? 'bg-red-100 text-red-700' 
                                    : installment.isPaid 
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                                }`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                {formatDate(installment.isPaid && installment.paidDate ? installment.paidDate : installment.dueDate)}
                              </motion.span>
                            </div>
                          </TableCell>
                        );
                      })}

                      <TableCell>{formatCurrency(student.totalAmount)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(paidAmount)}
                      </TableCell>
                      <TableCell className={debt > 0 ? 'text-red-600' : 'text-green-600'}>
                        <div className="flex items-center gap-2">
                          {formatCurrency(debt)}
                          {isPaid && <Badge variant="default">✓</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewInstallments(student)}
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-all duration-200 border-amber-200 hover:border-amber-300"
                              title="Управление графиком"
                            >
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStudent(student)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 border-blue-200 hover:border-blue-300"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteStudent(student)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 border-red-200 hover:border-red-300"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      {selectedStudent && (
        <>
          <EditStudentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            student={selectedStudent}
            onUpdateStudent={onUpdateStudent}
          />
          <InstallmentsDialog
            open={installmentsDialogOpen}
            onOpenChange={setInstallmentsDialogOpen}
            student={selectedStudent}
            onUpdateInstallment={onUpdateInstallment}
            onAddInstallment={onAddInstallment}
            onDeleteInstallment={onDeleteInstallment}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить ученика?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedStudent?.name}? Это действие нельзя отменить.
              Вся история платежей также будет удалена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}