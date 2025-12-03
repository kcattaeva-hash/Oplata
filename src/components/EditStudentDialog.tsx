import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
}

export function EditStudentDialog({
  open,
  onOpenChange,
  student,
  onUpdateStudent,
}: EditStudentDialogProps) {
  const [name, setName] = useState(student.name);
  const [phone, setPhone] = useState(student.phone || '');
  const [totalAmount, setTotalAmount] = useState(student.totalAmount.toString());
  const [tariff, setTariff] = useState(student.tariff);
  const [initialPayment, setInitialPayment] = useState(student.initialPayment.toString());

  useEffect(() => {
    setName(student.name);
    setPhone(student.phone || '');
    setTotalAmount(student.totalAmount.toString());
    setTariff(student.tariff);
    setInitialPayment(student.initialPayment.toString());
  }, [student]);

  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !totalAmount || !tariff || !initialPayment) {
      return;
    }

    onUpdateStudent(student.id, {
      name: capitalizeWords(name),
      phone: phone || undefined,
      totalAmount: parseFloat(totalAmount),
      tariff,
      initialPayment: parseFloat(initialPayment),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать ученика</DialogTitle>
          <DialogDescription>
            Изменить информацию об ученике
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Имя ученика</Label>
              <Input
                id="edit-name"
                placeholder="Иван Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Номер телефона</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tariff">Тариф</Label>
              <Select value={tariff} onValueChange={setTariff} required>
                <SelectTrigger id="edit-tariff">
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Групповой</SelectItem>
                  <SelectItem value="mini-group">Эксперт</SelectItem>
                  <SelectItem value="individual">ВИП</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-initialPayment">Первоначальный взнос - бронь (₽)</Label>
              <Input
                id="edit-initialPayment"
                type="number"
                placeholder="5000"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-totalAmount">Общая сумма к оплате (₽)</Label>
              <Input
                id="edit-totalAmount"
                type="number"
                placeholder="10000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
              <p className="text-sm text-yellow-600">
                Используйте "Управление графиком" для изменения рассрочки
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}