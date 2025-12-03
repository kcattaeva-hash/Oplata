import { Student, Payment } from '../App';
import { Button } from './ui/button';
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
import { Trash2 } from 'lucide-react';
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
import { useState } from 'react';

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  payments: Payment[];
  onDeletePayment: (paymentId: string, studentId: string, amount: number) => void;
}

export function PaymentHistoryDialog({
  open,
  onOpenChange,
  student,
  payments,
  onDeletePayment,
}: PaymentHistoryDialogProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const handleDeleteClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPayment) {
      onDeletePayment(selectedPayment.id, selectedPayment.studentId, selectedPayment.amount);
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>История платежей</DialogTitle>
            <DialogDescription>
              Ученик: {student.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего к оплате:</span>
                <span>{formatCurrency(student.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Уже оплачено:</span>
                <span className="text-green-600">{formatCurrency(student.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Остаток:</span>
                <span className="text-red-600">
                  {formatCurrency(student.totalAmount - student.paidAmount)}
                </span>
              </div>
            </div>

            {sortedPayments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Платежей пока нет
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата и время</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Примечание</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDateTime(payment.date)}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{payment.note || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(payment)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить платеж?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот платеж на сумму{' '}
              {selectedPayment && formatCurrency(selectedPayment.amount)}? 
              Это действие нельзя отменить.
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
