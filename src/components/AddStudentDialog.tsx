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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStudent: (student: Omit<Student, 'id' | 'paidAmount' | 'installments'>, installments: Omit<Installment, 'id' | 'isPaid'>[]) => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  onAddStudent,
}: AddStudentDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tariff, setTariff] = useState('');
  const [initialPayment, setInitialPayment] = useState('0');
  
  // Auto calculation fields
  const [totalAmount, setTotalAmount] = useState('0');
  const [monthsCount, setMonthsCount] = useState('3');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  
  // Manual fields
  const [installments, setInstallments] = useState<Omit<Installment, 'id' | 'isPaid'>[]>([
    { amount: 0, dueDate: '' }
  ]);

  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  const handleFocusZero = (value: string, setter: (value: string) => void) => {
    if (value === '0') {
      setter('');
    }
  };

  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const calculateInstallments = () => {
    if (!totalAmount || !monthsCount || !firstPaymentDate) {
      return [];
    }

    const total = parseFloat(totalAmount);
    const months = parseInt(monthsCount);
    
    // Don't calculate if values are not valid
    if (isNaN(total) || total <= 0 || isNaN(months) || months <= 0) {
      return [];
    }

    const monthlyAmount = Math.round((total / months) * 100) / 100;
    const lastMonthAmount = Math.round((total - (monthlyAmount * (months - 1))) * 100) / 100;

    const result: Omit<Installment, 'id' | 'isPaid'>[] = [];
    
    // Parse the date string (YYYY-MM-DD format)
    const dateParts = firstPaymentDate.split('-');
    if (dateParts.length !== 3) return [];
    
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
    const day = parseInt(dateParts[2]);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return [];
    
    const startDate = new Date(year, month, day);
    if (isNaN(startDate.getTime())) return [];

    for (let i = 0; i < months; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      result.push({
        amount: i === months - 1 ? lastMonthAmount : monthlyAmount,
        dueDate: paymentDate.toISOString().split('T')[0],
      });
    }

    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !tariff) {
      return;
    }

    let finalInstallments: Omit<Installment, 'id' | 'isPaid'>[];
    let finalTotalAmount: number;

    if (mode === 'auto') {
      if (!totalAmount || !monthsCount || !firstPaymentDate) {
        return;
      }
      finalInstallments = calculateInstallments();
      finalTotalAmount = parseFloat(totalAmount);
    } else {
      if (installments.length === 0 || installments.some(inst => !inst.dueDate || inst.amount <= 0)) {
        return;
      }
      finalInstallments = installments;
      finalTotalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    }

    onAddStudent({
      name: capitalizeWords(name),
      phone: phone || undefined,
      totalAmount: finalTotalAmount,
      tariff,
      initialPayment: parseFloat(initialPayment) || 0,
      initialPaymentPaid: false,
    }, finalInstallments);

    // Reset form
    setName('');
    setPhone('');
    setTariff('');
    setInitialPayment('0');
    setTotalAmount('0');
    setMonthsCount('3');
    setFirstPaymentDate('');
    setInstallments([{ amount: 0, dueDate: '' }]);
    setMode('auto');
    onOpenChange(false);
  };

  const addInstallment = () => {
    setInstallments([...installments, { amount: 0, dueDate: '' }]);
  };

  const removeInstallment = (index: number) => {
    if (installments.length > 1) {
      setInstallments(installments.filter((_, i) => i !== index));
    }
  };

  const updateInstallment = (index: number, field: 'amount' | 'dueDate', value: string) => {
    const updated = [...installments];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: parseFloat(value) || 0 };
    } else {
      updated[index] = { ...updated[index], dueDate: value };
    }
    setInstallments(updated);
  };

  const manualTotalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Добавить нового ученика</DialogTitle>
          <DialogDescription>
            Заполните информацию об ученике и выберите способ создания графика платежей
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя ученика</Label>
              <Input
                id="name"
                placeholder="Иван Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Номер телефона</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Необязательное поле
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tariff">Тариф</Label>
              <Select value={tariff} onValueChange={setTariff} required>
                <SelectTrigger id="tariff">
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
              <Label htmlFor="initialPayment">Первоначальный взнос - бронь (₽)</Label>
              <Input
                id="initialPayment"
                type="number"
                placeholder="0"
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value)}
                onFocus={(e) => handleFocusZero(e.target.value, setInitialPayment)}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500">
                Сумма, которую нужно внести для бронирования места
              </p>
            </div>

            <div className="border-t pt-4">
              <Tabs value={mode} onValueChange={(value: any) => setMode(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="auto">
                    <Calculator className="h-4 w-4 mr-2" />
                    Автоматический расчет
                  </TabsTrigger>
                  <TabsTrigger value="manual">Ручной ввод</TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="space-y-4 mt-4">
                  <div className="bg-amber-50 p-4 rounded-lg space-y-3">
                    <p className="text-sm text-amber-900">
                      Укажите общую сумму рассрочки и срок — график будет создан автоматически
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="totalAmount">Сумма рассрочки (₽)</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          placeholder="0"
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(e.target.value)}
                          required={mode === 'auto'}
                          min="0"
                          step="0.01"
                          onFocus={(e) => handleFocusZero(e.target.value, setTotalAmount)}
                        />
                        <p className="text-xs text-gray-500">
                          Только сумма рассрочки, без брони
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="monthsCount">Количество месяцев</Label>
                        <Select value={monthsCount} onValueChange={setMonthsCount}>
                          <SelectTrigger id="monthsCount">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 месяц</SelectItem>
                            <SelectItem value="2">2 месяца</SelectItem>
                            <SelectItem value="3">3 месяца</SelectItem>
                            <SelectItem value="4">4 месяца</SelectItem>
                            <SelectItem value="5">5 месяцев</SelectItem>
                            <SelectItem value="6">6 месяцев</SelectItem>
                            <SelectItem value="9">9 месяцев</SelectItem>
                            <SelectItem value="12">12 месяцев</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="firstPaymentDate">Дата первого платежа рассрочки</Label>
                      <DateInput
                        value={firstPaymentDate}
                        onChange={setFirstPaymentDate}
                        required={mode === 'auto'}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <Label>График платежей</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInstallment}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить платеж
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {installments.map((installment, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Сумма (₽)</Label>
                              <Input
                                type="number"
                                placeholder="5000"
                                value={installment.amount || ''}
                                onChange={(e) => updateInstallment(index, 'amount', e.target.value)}
                                required={mode === 'manual'}
                                min="0.01"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Дата платежа</Label>
                              <DateInput
                                value={installment.dueDate}
                                onChange={(date) => updateInstallment(index, 'dueDate', date)}
                                required={mode === 'manual'}
                              />
                            </div>
                          </div>
                        </div>
                        {installments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInstallment(index)}
                            className="text-red-600 hover:text-red-700 mt-5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-amber-700">Первоначальный взнос:</span>
                      <span className="text-amber-700">
                        {formatCurrency(parseFloat(initialPayment || '0'))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-amber-700">Сумма рассрочки:</span>
                      <span className="text-amber-700">
                        {formatCurrency(manualTotalAmount)}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}