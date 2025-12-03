import { useState, useEffect } from 'react';
import { Student } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { AlertCircle } from 'lucide-react';

interface EditPaidAmountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
}

export function EditPaidAmountDialog({
  open,
  onOpenChange,
  student,
  onUpdateStudent,
}: EditPaidAmountDialogProps) {
  const [paidAmount, setPaidAmount] = useState(student.paidAmount.toString());

  useEffect(() => {
    setPaidAmount(student.paidAmount.toString());
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPaidAmount = parseFloat(paidAmount);
    
    if (isNaN(newPaidAmount) || newPaidAmount < 0) {
      return;
    }

    onUpdateStudent(student.id, {
      paidAmount: newPaidAmount,
    });

    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать оплаченную сумму</DialogTitle>
          <DialogDescription>
            Ученик: {student.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-50 p-4 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p>Прямое редактирование оплаченной суммы.</p>
                <p className="mt-1">Рекомендуется использовать график платежей для точного учета.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего к оплате:</span>
                <span>{formatCurrency(student.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Текущая сумма оплаты:</span>
                <span className="text-green-600">{formatCurrency(student.paidAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Новая оплаченная сумма (₽)</Label>
              <Input
                id="paidAmount"
                type="number"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-500">
                Остаток после изменения: {formatCurrency(student.totalAmount - parseFloat(paidAmount || '0'))}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
