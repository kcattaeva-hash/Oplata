import { useState } from 'react';
import { Student, Installment } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DateInput } from './DateInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Trash2, Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface InstallmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onUpdateInstallment: (studentId: string, installmentId: string, updates: Partial<Installment>) => void;
  onAddInstallment: (studentId: string, installment: Omit<Installment, 'id' | 'isPaid'>) => void;
  onDeleteInstallment: (studentId: string, installmentId: string) => void;
}

export function InstallmentsDialog({
  open,
  onOpenChange,
  student,
  onUpdateInstallment,
  onAddInstallment,
  onDeleteInstallment,
}: InstallmentsDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAmount || !newDueDate || parseFloat(newAmount) <= 0) {
      return;
    }

    onAddInstallment(student.id, {
      amount: parseFloat(newAmount),
      dueDate: newDueDate,
    });

    setNewAmount('');
    setNewDueDate('');
    setShowAddForm(false);
  };

  const togglePaid = (installmentId: string, currentStatus: boolean, paidDate?: string) => {
    if (currentStatus) {
      // Unpay
      onUpdateInstallment(student.id, installmentId, { isPaid: false, paidDate: undefined });
    } else {
      // Mark as paid
      onUpdateInstallment(student.id, installmentId, { 
        isPaid: true, 
        paidDate: new Date().toISOString() 
      });
    }
  };

  const handleDeleteClick = (installmentId: string) => {
    setInstallmentToDelete(installmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (installmentToDelete) {
      onDeleteInstallment(student.id, installmentToDelete);
      setDeleteDialogOpen(false);
      setInstallmentToDelete(null);
    }
  };

  const sortedInstallments = [...student.installments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const paidInstallments = sortedInstallments.filter(inst => inst.isPaid);
  const unpaidInstallments = sortedInstallments.filter(inst => !inst.isPaid);
  const overdueInstallments = unpaidInstallments.filter(
    inst => new Date(inst.dueDate) < new Date()
  );

  const totalFromInstallments = student.installments.reduce((sum, inst) => sum + inst.amount, 0);
  const paidFromInstallments = student.installments.filter(inst => inst.isPaid).reduce((sum, inst) => sum + inst.amount, 0);
  const remainingFromInstallments = totalFromInstallments - paidFromInstallments;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>График платежей</DialogTitle>
            <DialogDescription>
              Ученик: {student.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Всего платежей</p>
                <p className="text-gray-900">{student.installments.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700 mb-1">Оплачено</p>
                <p className="text-green-900">{paidInstallments.length}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-700 mb-1">Ожидается</p>
                <p className="text-yellow-900">{unpaidInstallments.length}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-700 mb-1">Просрочено</p>
                <p className="text-red-900">{overdueInstallments.length}</p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">Первоначальный взнос:</span>
                <span className="text-amber-700">{formatCurrency(student.initialPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">Сумма рассрочки:</span>
                <span className="text-amber-700">{formatCurrency(totalFromInstallments)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-amber-900">Итого по договору:</span>
                <span className="text-amber-900">{formatCurrency(student.totalAmount)}</span>
              </div>
            </div>

            {/* Add new installment form */}
            {showAddForm ? (
              <form onSubmit={handleAddInstallment} className="bg-amber-50 p-4 rounded-lg space-y-3">
                <h3 className="text-amber-900">Добавить новый платеж</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-amount">Сумма (₽)</Label>
                    <Input
                      id="new-amount"
                      type="number"
                      placeholder="5000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-dueDate">Дата платежа</Label>
                    <DateInput
                      id="new-dueDate"
                      value={newDueDate}
                      onChange={setNewDueDate}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Добавить
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить платеж в график
              </Button>
            )}

            {/* Installments table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата оплаты</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInstallments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Нет платежей в графике
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedInstallments.map((installment) => {
                      const isOverdue = !installment.isPaid && new Date(installment.dueDate) < new Date();
                      
                      return (
                        <TableRow key={installment.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {formatDate(installment.dueDate)}
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Просрочен
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(installment.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={installment.isPaid ? 'default' : 'secondary'}>
                              {installment.isPaid ? 'Оплачено' : 'Ожидается'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {installment.paidDate ? formatDate(installment.paidDate) : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant={installment.isPaid ? 'outline' : 'default'}
                                onClick={() => togglePaid(installment.id, installment.isPaid, installment.paidDate)}
                                className={installment.isPaid ? '' : 'bg-green-600 hover:bg-green-700'}
                              >
                                {installment.isPaid ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              {!installment.isPaid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(installment.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Первоначальный взнос:</span>
                <span className={student.initialPaymentPaid ? 'text-green-600' : 'text-gray-900'}>
                  {formatCurrency(student.initialPayment)}
                  {student.initialPaymentPaid && ' ✓'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Всего по рассрочке:</span>
                <span>{formatCurrency(totalFromInstallments)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Оплачено по рассрочке:</span>
                <span className="text-green-600">
                  {formatCurrency(paidFromInstallments)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Остаток по рассрочке:</span>
                <span className="text-red-600">
                  {formatCurrency(remainingFromInstallments)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить платеж из графика?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот платеж из графика? Это действие нельзя отменить.
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
    </>
  );
}