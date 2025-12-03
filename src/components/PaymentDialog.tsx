import { useState } from 'react';
import { Student } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onAddPayment: (studentId: string, amount: number, note: string) => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  student,
  onAddPayment,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const remainingDebt = student.totalAmount - student.paidAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    onAddPayment(student.id, parseFloat(amount), note);

    // Reset form
    setAmount('');
    setNote('');
    onOpenChange(false);
  };

  const handleFullPayment = () => {
    setAmount(remainingDebt.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Внести оплату</DialogTitle>
          <DialogDescription>
            Ученик: {student.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего к оплате:</span>
                <span>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(student.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Уже оплачено:</span>
                <span className="text-green-600">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(student.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Остаток:</span>
                <span className="text-red-600">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(remainingDebt)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Сумма платежа (₽)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullPayment}
                  className="text-amber-600"
                >
                  Оплатить полностью
                </Button>
              </div>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
                max={remainingDebt}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Примечание (опционально)</Label>
              <Textarea
                id="note"
                placeholder="Оплата за январь..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Внести оплату
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}