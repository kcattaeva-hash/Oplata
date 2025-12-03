import { useState, useEffect } from 'react';
import { StudentPayments } from './components/StudentPayments';
import { AddStudentDialog } from './components/AddStudentDialog';
import { DataManagement } from './components/DataManagement';
import { Button } from './components/ui/button';
import { UserPlus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from './components/ui/sonner';

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export interface Student {
  id: string;
  name: string;
  phone?: string;
  totalAmount: number;
  paidAmount: number;
  installments: Installment[];
  tariff: string;
  initialPayment: number;
  initialPaymentPaid: boolean;
  initialPaymentDate?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  note: string;
}

export interface Log {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user?: string;
}

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    const savedPayments = localStorage.getItem('payments');
    const savedLogs = localStorage.getItem('logs');
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
    if (savedPayments) {
      setPayments(JSON.parse(savedPayments));
    }
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save students to localStorage
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
    }
  }, [students]);

  // Save payments to localStorage
  useEffect(() => {
    if (payments.length > 0) {
      localStorage.setItem('payments', JSON.stringify(payments));
    }
  }, [payments]);

  // Save logs to localStorage
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('logs', JSON.stringify(logs));
    }
  }, [logs]);

  // Add log entry
  const addLog = (action: string, details: string) => {
    const newLog: Log = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  const addStudent = (student: Omit<Student, 'id' | 'paidAmount' | 'installments'>, installments: Omit<Installment, 'id' | 'isPaid'>[]) => {
    const newStudent: Student = {
      ...student,
      id: Date.now().toString(),
      paidAmount: 0,
      installments: installments.map((inst, idx) => ({
        ...inst,
        id: `${Date.now()}-${idx}`,
        isPaid: false,
      })),
    };
    setStudents([...students, newStudent]);
    addLog('Добавлен ученик', `${student.name} - Тариф: ${student.tariff}, Сумма: ${student.totalAmount} ₽`);
  };

  const addPayment = (studentId: string, amount: number, note: string) => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      studentId,
      amount,
      date: new Date().toISOString(),
      note,
    };
    setPayments([...payments, newPayment]);

    const student = students.find(s => s.id === studentId);
    // Update student's paid amount
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, paidAmount: student.paidAmount + amount }
        : student
    ));
    
    if (student) {
      addLog('Добавлен платеж', `${student.name} - ${amount} ₽. ${note ? `Примечание: ${note}` : ''}`);
    }
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const student = students.find(s => s.id === id);
    setStudents(students.map(student =>
      student.id === id ? { ...student, ...updates } : student
    ));
    
    if (student) {
      const changes = Object.keys(updates).map(key => `${key}: ${updates[key as keyof Student]}`).join(', ');
      addLog('Изменен ученик', `${student.name} - ${changes}`);
    }
  };

  const deleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(students.filter(student => student.id !== id));
    setPayments(payments.filter(payment => payment.studentId !== id));
    
    if (student) {
      addLog('Удален ученик', `${student.name} - Тариф: ${student.tariff}`);
    }
  };

  const deletePayment = (paymentId: string, studentId: string, amount: number) => {
    const student = students.find(s => s.id === studentId);
    setPayments(payments.filter(payment => payment.id !== paymentId));
    
    // Update student's paid amount
    setStudents(students.map(student => 
      student.id === studentId 
        ? { ...student, paidAmount: student.paidAmount - amount }
        : student
    ));
    
    if (student) {
      addLog('Удален платеж', `${student.name} - ${amount} ₽`);
    }
  };

  const updateInstallment = (studentId: string, installmentId: string, updates: Partial<Installment>) => {
    const student = students.find(s => s.id === studentId);
    setStudents(students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          installments: student.installments.map(inst =>
            inst.id === installmentId ? { ...inst, ...updates } : inst
          ),
        };
      }
      return student;
    }));
    
    if (student) {
      const installment = student.installments.find(i => i.id === installmentId);
      if (installment && updates.isPaid !== undefined) {
        addLog(
          updates.isPaid ? 'Отмечен платеж рассрочки' : 'Снята отметка с платежа',
          `${student.name} - ${installment.amount} ₽`
        );
      }
    }
  };

  const addInstallment = (studentId: string, installment: Omit<Installment, 'id' | 'isPaid'>) => {
    const student = students.find(s => s.id === studentId);
    setStudents(students.map(student => {
      if (student.id === studentId) {
        const newInstallment: Installment = {
          ...installment,
          id: `${Date.now()}`,
          isPaid: false,
        };
        return {
          ...student,
          installments: [...student.installments, newInstallment],
          totalAmount: student.totalAmount + installment.amount,
        };
      }
      return student;
    }));
    
    if (student) {
      addLog('Добавлена рассрочка', `${student.name} - ${installment.amount} ₽`);
    }
  };

  const deleteInstallment = (studentId: string, installmentId: string) => {
    const student = students.find(s => s.id === studentId);
    setStudents(students.map(student => {
      if (student.id === studentId) {
        const installment = student.installments.find(inst => inst.id === installmentId);
        if (installment && installment.isPaid) {
          return student; // Don't delete paid installments
        }
        const deletedInstallment = student.installments.find(inst => inst.id === installmentId);
        
        if (student && deletedInstallment) {
          addLog('Удалена рассрочка', `${student.name} - ${deletedInstallment.amount} ₽`);
        }
        
        return {
          ...student,
          installments: student.installments.filter(inst => inst.id !== installmentId),
          totalAmount: student.totalAmount - (deletedInstallment?.amount || 0),
        };
      }
      return student;
    }));
  };

  const importStudents = (importedStudents: Student[]) => {
    setStudents(prevStudents => [...prevStudents, ...importedStudents]);
    addLog('Импортированы ученики', `Добавлено учеников: ${importedStudents.length}`);
  };

  const exportAllData = () => {
    const data = {
      students,
      payments,
      logs,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('Экспортированы данные', 'Создан полный backup системы');
  };

  const importAllData = (data: { students: Student[], payments: Payment[], logs: Log[] }) => {
    setStudents(data.students || []);
    setPayments(data.payments || []);
    setLogs(data.logs || []);
    localStorage.setItem('students', JSON.stringify(data.students || []));
    localStorage.setItem('payments', JSON.stringify(data.payments || []));
    localStorage.setItem('logs', JSON.stringify(data.logs || []));
    addLog('Импортированы данные', 'Восстановлен backup системы');
  };

  const clearAllData = () => {
    setStudents([]);
    setPayments([]);
    localStorage.removeItem('students');
    localStorage.removeItem('payments');
    addLog('Очищены все данные', 'Удалены все ученики и ��латежи');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-100 to-amber-100 p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-40 right-10 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-25"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-20 left-1/2 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-300/50"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-8 h-8 text-amber-600" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-slate-600 via-amber-600 to-gray-700 bg-clip-text text-transparent">
                  Отчетность по оплатам учеников
                </h1>
              </div>
              <p className="text-gray-600">
                Отслеживайте платежи и задолженности
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex gap-3"
            >
              <DataManagement
                logs={logs}
                onExportData={exportAllData}
                onImportData={importAllData}
                onImportStudents={importStudents}
                onClearData={clearAllData}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-slate-500 via-amber-500 to-gray-600 hover:from-slate-600 hover:via-amber-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 group"
                >
                  <UserPlus className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  Добавить ученика
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <StudentPayments
            students={students}
            payments={payments}
            onAddPayment={addPayment}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
            onDeletePayment={deletePayment}
            onUpdateInstallment={updateInstallment}
            onAddInstallment={addInstallment}
            onDeleteInstallment={deleteInstallment}
          />
        </motion.div>
      </div>

      <AddStudentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddStudent={addStudent}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}