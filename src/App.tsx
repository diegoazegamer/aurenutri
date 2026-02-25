/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Leaf, ChevronRight, Phone, Calendar, MapPin, Hash, Building, Landmark, Globe, ArrowLeft, Ruler, Weight, Target, Activity, Plus, X, Check, Sun, Moon, Bell, Camera, Utensils, Pill, FileText, Droplets, Home, MessageCircle, ClipboardList, Settings, CupSoda, GlassWater, Milk, Clock, Trash2, Edit2, Users, Search, Filter, MoreVertical, FilePlus, LogOut, LayoutDashboard, Flame, Printer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';
import { supabase } from './lib/supabase';

interface Patient {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  birth_date?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  uf?: string;
  gender?: string;
  height?: number;
  weight?: number;
  objective?: string;
  activity_level?: string;
  dietary_restrictions?: string;
}

const DIETARY_OPTIONS = ['Sem Glúten', 'Vegano', 'Sem Lactose', 'Sem Açúcar', 'Vegetariano', 'Low Carb'];

export default function App() {
  const [user, setUser] = useState<Patient | null>(null);
  const [step, setStep] = useState<'auth' | 'onboarding' | 'health' | 'dashboard' | 'hydration' | 'doctor-dashboard'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Hydration State
  const [waterIntake, setWaterIntake] = useState(1.2);
  const waterGoal = 2.5;
  const [hydrationHistory, setHydrationHistory] = useState([
    { id: 1, type: 'Chá Verde', amount: 250, time: '08:30', icon: <CupSoda size={18} /> },
    { id: 2, type: 'Água', amount: 200, time: '10:45', icon: <GlassWater size={18} /> },
    { id: 3, type: 'Água Mineral', amount: 500, time: '12:30', icon: <Milk size={18} /> },
  ]);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Manual Hydration Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualType, setManualType] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Doctor Dashboard States
  const [activeTab, setActiveTab] = useState<'start' | 'patients' | 'requests' | 'appointments' | 'patient-details'>('start');
  const [activeSubTab, setActiveSubTab] = useState('Acompanhamento');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [showExamsModal, setShowExamsModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPatientPrescriptionModal, setShowPatientPrescriptionModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [requestPatient, setRequestPatient] = useState('');
  const [requestType, setRequestType] = useState('');

  // Novas consultas states
  const [showNewConsultationModal, setShowNewConsultationModal] = useState(false);
  const [newConsultationDate, setNewConsultationDate] = useState('');
  const [newConsultationNotes, setNewConsultationNotes] = useState('');
  const [newConsultationPlanner, setNewConsultationPlanner] = useState(false);
  const [showConsultationDetailsModal, setShowConsultationDetailsModal] = useState<any>(null);
  const [patientConsultations, setPatientConsultations] = useState<any[]>([]);

  const [patients, setPatients] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const mockAppointments = [
    { id: 1, patient: 'Maria Silva', time: '09:00', duration: 60, day: 'Seg', date: '23/02', color: 'bg-blue-500', type: 'Check-up' },
    { id: 2, patient: 'João Pereira', time: '11:00', duration: 45, day: 'Seg', date: '23/02', color: 'bg-green-500', type: 'Retorno' },
    { id: 3, patient: 'Ana Costa', time: '14:00', duration: 60, day: 'Ter', date: '24/02', color: 'bg-purple-500', type: 'Avaliação' },
    { id: 4, patient: 'Pedro Santos', time: '10:00', duration: 90, day: 'Qua', date: '25/02', color: 'bg-orange-500', type: 'Bioimpedância' },
    { id: 5, patient: 'Maria Silva', time: '16:00', duration: 60, day: 'Qui', date: '26/02', color: 'bg-blue-500', type: 'Check-up' },
  ];

  const addHydration = (type: string, amountMl: number, icon: React.ReactNode) => {
    const amountL = amountMl / 1000;
    setWaterIntake(prev => Math.min(waterGoal, prev + amountL));

    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setHydrationHistory(prev => [
      { id: Date.now(), type, amount: amountMl, time: timeStr, icon },
      ...prev
    ]);
  };

  const deleteHydration = (id: number) => {
    const item = hydrationHistory.find(h => h.id === id);
    if (item) {
      setWaterIntake(prev => Math.max(0, prev - item.amount / 1000));
      setHydrationHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const startEditingHydration = (id: number) => {
    const item = hydrationHistory.find(h => h.id === id);
    if (item) {
      setManualType(item.type);
      setManualAmount(item.amount.toString());
      setEditingId(id);
      setShowManualModal(true);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(manualAmount);
    if (manualType && amount > 0) {
      if (editingId !== null) {
        // Edit existing
        const oldItem = hydrationHistory.find(h => h.id === editingId);
        if (oldItem) {
          const diffL = (amount - oldItem.amount) / 1000;
          setWaterIntake(prev => Math.min(waterGoal, Math.max(0, prev + diffL)));
          setHydrationHistory(prev => prev.map(h =>
            h.id === editingId ? { ...h, type: manualType, amount: amount } : h
          ));
        }
      } else {
        // Add new
        addHydration(manualType, amount, <CupSoda size={18} />);
      }
      setShowManualModal(false);
      setManualType('');
      setManualAmount('');
      setEditingId(null);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (step === 'doctor-dashboard') {
      fetchPatients();
    }
  }, [step]);

  useEffect(() => {
    if (selectedPatient) {
      fetchConsultations(selectedPatient.id);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setPatients(data);
    }
  };

  const fetchConsultations = async (patientId: string) => {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setPatientConsultations(data);
    }
  };

  // Auth States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Onboarding States
  const [birthDate, setBirthDate] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [uf, setUf] = useState('');
  const [age, setAge] = useState<number | null>(null);

  // Health States
  const [gender, setGender] = useState<'Feminino' | 'Masculino' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [objective, setObjective] = useState('');
  const [activityLevel, setActivityLevel] = useState('Moderado');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setWhatsapp(value);
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    let formatted = value;
    if (value.length > 2) {
      formatted = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + value.slice(4);
    }

    setBirthDate(formatted);
  };

  const calculateAge = (dateString: string) => {
    if (!dateString || dateString.length < 10) return null;
    const [day, month, year] = dateString.split('/').map(Number);
    if (!day || !month || !year) return null;

    const today = new Date();
    const birthDate = new Date(year, month - 1, day);

    if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
      return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    if (birthDate) {
      setAge(calculateAge(birthDate));
    }
  }, [birthDate]);

  const handleCepLookup = async (value: string) => {
    const cleanCep = value.replace(/\D/g, '');
    setCep(cleanCep);
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro);
          setNeighborhood(data.bairro);
          setCity(data.localidade);
          setState(data.estado);
          setUf(data.uf);
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setUser({ id: data.user.id as any, name: 'Dra. Aure', email, whatsapp: '' });
        setStep('doctor-dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setUser({ id: data.user?.id as any, name, email, whatsapp });
        setStep('onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('health');
  };

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id,
          birth_date: birthDate,
          cep,
          street,
          number,
          neighborhood,
          city,
          state,
          uf,
          gender,
          height: parseFloat(height),
          weight: parseFloat(weight),
          objective,
          activity_level: activityLevel,
          dietary_restrictions: JSON.stringify(dietaryRestrictions)
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setStep('dashboard');
      }
    } catch (err) {
      setError('Erro ao salvar dados de saúde');
    } finally {
      setLoading(false);
    }
  };

  const toggleDietary = (option: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const weightData = [
    { name: '1 Set', weight: 72 },
    { name: '15 Set', weight: 71.5 },
    { name: '1 Out', weight: 70.8 },
    { name: '15 Out', weight: 70.2 },
    { name: 'Hoje', weight: 69.6 },
  ];

  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] dark:bg-dark-bg transition-colors duration-300 pb-24">
        {/* Header */}
        <header className="p-6 flex justify-between items-center max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-olive dark:border-brand-gold">
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Dra. Aure</p>
              <p className="text-base font-bold text-brand-olive dark:text-brand-gold">Premium</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-2xl bg-white dark:bg-dark-card shadow-sm text-brand-olive dark:text-brand-gold"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-3 rounded-2xl bg-white dark:bg-dark-card shadow-sm text-gray-400 relative">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-dark-card" />
            </button>
          </div>
        </header>

        <main className="px-6 max-w-4xl mx-auto w-full space-y-8">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h2 className="serif text-5xl font-bold text-brand-ink dark:text-dark-ink">
              Bom dia, <br />
              {user?.name.split(' ')[0]}!
            </h2>
            <p className="text-sm text-gray-500">Vamos nutrir seu corpo hoje.</p>
          </motion.div>

          {/* Daily Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-dark-card p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 flex items-center justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Resumo Diário</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-brand-ink dark:text-dark-ink">1.250</span>
                <span className="text-sm text-gray-400 font-medium">kcal</span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold inline-block">
                Restam 550 kcal
              </div>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-100 dark:text-white/5"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - 0.7)}
                  className="text-green-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-green-500">
                <Activity size={24} />
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Ações Rápidas</h3>

            <button className="w-full bg-brand-ink dark:bg-black p-4 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                  <Camera size={24} />
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-white">Analisar Refeição</p>
                  <p className="text-xs text-gray-500">Use IA para escanear seu prato</p>
                </div>
              </div>
              <ChevronRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Utensils size={20} />, label: 'Meu Plano', color: 'text-green-500', bg: 'bg-green-500/10' },
                { icon: <Pill size={20} />, label: 'Receituário', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { icon: <FileText size={20} />, label: 'Exames', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { icon: <Droplets size={20} />, label: 'Hidratação', color: 'text-orange-500', bg: 'bg-orange-500/10' },
              ].map((action, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    if (action.label === 'Hidratação') setStep('hydration');
                    if (action.label === 'Receituário') setShowPatientPrescriptionModal(true);
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-white dark:bg-dark-card p-6 rounded-[24px] border border-white/20 dark:border-white/5 shadow-sm flex flex-col items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center`}>
                    {action.icon}
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Weight Progress */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Progresso de Peso</h3>
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                -2.4kg este mês
              </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-xl border border-brand-olive/10 dark:border-white/5 backdrop-blur-md">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <p className="text-base font-bold text-brand-ink dark:text-dark-ink">
                                {payload[0].value} <span className="text-gray-400 font-medium">kg</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 px-8 py-4 flex justify-between items-center z-50">
          {[
            { icon: <Home size={24} />, label: 'Início', active: true },
            { icon: <MessageCircle size={24} />, label: 'Chat' },
            { icon: <ClipboardList size={24} />, label: 'Plano' },
            { icon: <User size={24} />, label: 'Perfil' },
          ].map((item, i) => (
            <button
              key={i}
              className={`flex flex-col items-center gap-1 ${item.active ? 'text-green-500' : 'text-gray-400'}`}
            >
              {item.icon}
              <span className="text-xs font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Patient Prescription Modal */}
        <AnimatePresence>
          {showPatientPrescriptionModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPatientPrescriptionModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#f5f5f0] dark:bg-dark-bg w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="bg-white dark:bg-dark-card p-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowPatientPrescriptionModal(false)} className="p-2 text-gray-400 hover:text-brand-olive transition-colors">
                      <ArrowLeft size={24} />
                    </button>
                    <div>
                      <h3 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Meus Receituários</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Dra. Aure • Nutricionista</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="p-3 rounded-2xl bg-brand-olive/10 text-brand-olive hover:bg-brand-olive/20 transition-all flex items-center gap-2"
                    >
                      <Printer size={20} />
                      <span className="text-sm font-bold uppercase tracking-widest hidden sm:inline">Exportar PDF</span>
                    </button>
                    <button onClick={() => setShowPatientPrescriptionModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  {/* History Sidebar */}
                  <aside className="w-full md:w-72 bg-white dark:bg-dark-card border-r border-gray-100 dark:border-white/5 overflow-y-auto p-6 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receitas Anteriores</h4>
                    <div className="space-y-2">
                      {[
                        { id: 1, date: '23/02/2026', title: 'Suplementação Atual', active: true },
                        { id: 2, date: '15/01/2026', title: 'Ajuste de Vitaminas', active: false },
                        { id: 3, date: '10/12/2025', title: 'Protocolo Inicial', active: false },
                      ].map((item) => (
                        <button
                          key={item.id}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${item.active
                            ? 'bg-brand-olive/5 border-brand-olive/30 ring-1 ring-brand-olive/30'
                            : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                            }`}
                        >
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.date}</p>
                          <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.title}</p>
                        </button>
                      ))}
                    </div>
                  </aside>

                  {/* Prescription Content */}
                  <main className="flex-1 bg-white dark:bg-dark-card p-8 md:p-12 overflow-y-auto print:p-0">
                    <div className="max-w-4xl mx-auto space-y-10 print:max-w-none">
                      {/* Header for Print */}
                      <div className="flex justify-between items-start border-b-2 border-brand-olive/20 pb-8">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-transparent flex items-center justify-center p-1">
                              <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h2 className="serif text-2xl font-bold text-brand-ink dark:text-dark-ink">Dra. Aure</h2>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nutricionista • CRN 12345</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-brand-ink dark:text-dark-ink">Paciente: {user?.name}</p>
                            <p className="text-xs text-gray-400">Data: 23 de Fevereiro de 2026</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                          Rua das Palmeiras, 123<br />
                          São Paulo - SP<br />
                          (11) 99999-9999
                        </div>
                      </div>

                      {/* Prescription Body */}
                      <div className="space-y-8">
                        <h3 className="serif text-4xl font-bold text-brand-ink dark:text-dark-ink text-center underline decoration-brand-olive/20 underline-offset-8">Receituário</h3>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand-olive" />
                              <h4 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Suplementação Manhã</h4>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Whey Protein Isolado</p>
                                  <p className="text-xs text-gray-500">Tomar 30g diluído em 200ml de água.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">1 scoop</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Creatina Monohidratada</p>
                                  <p className="text-xs text-gray-500">Diluir junto ao Whey Protein.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">5g</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand-olive" />
                              <h4 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Vitaminas</h4>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Vitamina D3</p>
                                  <p className="text-xs text-gray-500">Tomar após o almoço.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">2.000 UI</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Ômega 3</p>
                                  <p className="text-xs text-gray-500">Tomar 1 cápsula após o jantar.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">1.000mg</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-10 space-y-2">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Observações:</p>
                          <p className="text-xs text-gray-500 italic leading-relaxed">
                            Manter a hidratação constante ao longo do dia (mínimo 2.5L).
                            Evitar o consumo de cafeína após as 16h para não prejudicar o sono.
                            Retorno em 45 dias para reavaliação.
                          </p>
                        </div>
                      </div>

                      {/* Footer / Signature */}
                      <div className="pt-16 flex flex-col items-center">
                        <div className="w-48 border-b border-brand-ink/20 mb-2" />
                        <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Dra. Aure</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nutricionista Esportiva</p>
                      </div>
                    </div>
                  </main>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === 'doctor-dashboard') {
    const stats = [
      { label: 'Total Pacientes', value: '124', icon: <Users size={20} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { label: 'Consultas Hoje', value: '8', icon: <Calendar size={20} />, color: 'text-green-500', bg: 'bg-green-500/10' },
      { label: 'Pedidos Pendentes', value: '12', icon: <FileText size={20} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
      { label: 'Faturamento Mês', value: 'R$ 12.4k', icon: <Activity size={20} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
      <div className="min-h-screen bg-[#f5f5f0] dark:bg-dark-bg transition-colors duration-300 flex flex-col md:flex-row">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-dark-card border-r border-gray-100 dark:border-white/5 p-6 h-screen sticky top-0">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-transparent flex items-center justify-center p-1">
              <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink hidden">Dra. Aure</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'start', label: 'Iniciar', icon: <Home size={20} /> },
              { id: 'patients', label: 'Pacientes', icon: <Users size={20} /> },
              { id: 'appointments', label: 'Agenda', icon: <Calendar size={20} /> },
              { id: 'requests', label: 'Pedidos Médicos', icon: <FilePlus size={20} /> },
              { id: 'stats', label: 'Estatísticas', icon: <LayoutDashboard size={20} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                  ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
              >
                {item.icon}
                <span className="text-base font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-100 dark:border-white/5">
            <button
              onClick={() => setStep('auth')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            >
              <LogOut size={20} />
              <span className="text-base font-bold">Sair</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 max-w-[98%] mx-auto w-full space-y-8 pb-24 md:pb-10">
          {/* Mobile Header */}
          <header className="md:hidden flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center p-1">
                <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Dra. Aure</h1>
            </div>

          </header>

          {/* Top Bar (Desktop) */}
          <div className="hidden md:flex justify-between items-center">
            <div>
              <h2 className="serif text-4xl font-bold text-brand-ink dark:text-dark-ink">Painel de Gestão</h2>
              <p className="text-sm text-gray-500">Bem-vinda de volta ao seu consultório digital.</p>
            </div>
            <div className="flex items-center gap-4">

              <div className="flex items-center gap-3 bg-white dark:bg-dark-card p-2 pr-4 rounded-2xl shadow-sm border border-white/20 dark:border-white/5">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=150&h=150" alt="Doctor" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink dark:text-dark-ink">Dra. Aure</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nutricionista</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Only on Start Tab */}
          {activeTab === 'start' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-dark-card p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-white/5"
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-brand-ink dark:text-dark-ink">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Content Area */}
          {activeTab === 'patient-details' && selectedPatient ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('patients')}
                  className="p-3 rounded-2xl bg-white dark:bg-dark-card shadow-sm text-gray-400 hover:text-brand-olive transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Middle Column: Secondary Menu */}
                <div className="w-full lg:w-72 shrink-0">
                  <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 overflow-hidden">
                    <div className="p-2 space-y-1">
                      {[
                        { label: 'Acompanhamento', active: true },
                        { label: 'Perfil do paciente' },
                        { label: 'Histórico de consultas' },
                        { label: 'Anamnese geral' },
                        { label: 'Questionários de saúde' },
                        { label: 'Exames laboratoriais' },
                        { label: 'Evolução fotográfica' },
                        { label: 'Antropometria geral' },
                        { label: 'Acompanhamento gestacional' },
                        { label: 'Cálculo energético' },
                        { label: 'Planejamento alimentar' },
                        { label: 'Suplementos e produtos' },
                        { label: 'Prescrição de metas' },
                        { label: 'Prescrição de manipulados' },
                        { label: 'Orientações nutricionais' },
                        { label: 'Arquivos anexos' },
                        { label: 'Prontuário do paciente' },
                        { label: 'Atestados e receituários' },
                        { label: 'Recibos e financeiro' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveSubTab(item.label)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-base font-bold transition-all flex items-center justify-between ${activeSubTab === item.label
                            ? 'bg-[#00E676] text-white shadow-md shadow-green-500/20'
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Multi-tab Content */}
                <div className="flex-1 space-y-6 min-w-0">
                  {activeSubTab === 'Acompanhamento' ? (
                    <div className="bg-white dark:bg-dark-card p-8 rounded-[40px] shadow-sm border border-white/20 dark:border-white/5">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                          <h5 className="text-xl font-bold text-brand-ink dark:text-dark-ink">Acompanhar paciente</h5>
                          <button className="mt-2 bg-[#5A7A9A] text-white px-4 py-1.5 rounded-lg text-sm font-bold">
                            Visualizar refeições
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4 justify-end mb-1">
                            <button className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400"><ChevronRight className="rotate-180" size={16} /></button>
                            <span className="text-base font-bold text-brand-ink dark:text-dark-ink">23/02/2026</span>
                            <button className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400"><ChevronRight size={16} /></button>
                          </div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Intervalo: 17/02/2026 – 23/02/2026</p>
                        </div>
                      </div>

                      {/* Daily Status Row */}
                      <div className="grid grid-cols-7 gap-2 mb-8">
                        {['17/02', '18/02', '19/02', '20/02', '21/02', '22/02', '23/02'].map((date, i) => (
                          <div key={i} className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl text-center border border-transparent hover:border-gray-200 transition-all">
                            <p className="text-xs font-bold text-brand-ink dark:text-dark-ink mb-1">{date}</p>
                            <div className="flex items-center justify-center gap-1 text-blue-500">
                              <Droplets size={12} />
                              <span className="text-xs font-bold">0 ml</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dados do paciente */}
                        <div className="bg-gray-50/50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                          <h6 className="text-sm font-bold text-brand-ink dark:text-dark-ink mb-4">Dados do paciente</h6>
                          <div className="space-y-3">
                            {[
                              { label: 'Média de consumo de kcal', value: '0.0 Kcal' },
                              { label: 'Média de consumo de proteínas', value: '0.0 g' },
                              { label: 'Média de consumo de carboidrato', value: '0.0 g' },
                              { label: 'Média de consumo de lipídios', value: '0.0 g' },
                            ].map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">{item.label}</span>
                                <span className="font-bold text-brand-ink dark:text-dark-ink">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Registros de peso */}
                        <div className="bg-gray-50/50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                          <h6 className="text-sm font-bold text-brand-ink dark:text-dark-ink mb-4">Registros de peso</h6>
                          <div className="h-24 flex items-end justify-center px-4">
                            <div className="w-full h-px bg-gray-200 dark:bg-white/10 relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                className="absolute bottom-0 left-0 h-0.5 bg-brand-olive/30"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Charts Grid */}
                        {[
                          { label: 'Consumo calórico médio (7 dias)', color: '#00E676' },
                          { label: 'Consumo de proteínas médio (7 dias)', color: '#FF5252' },
                          { label: 'Consumo de lipídios médio (7 dias)', color: '#FFD740' },
                          { label: 'Consumo de carboidratos médio (7 dias)', color: '#448AFF' },
                        ].map((chart, i) => (
                          <div key={i} className="bg-gray-50/50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                            <h6 className="text-sm font-bold text-brand-ink dark:text-dark-ink mb-6">{chart.label}</h6>
                            <div className="h-20 w-full relative">
                              <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 dark:bg-white/10" />
                              <div className="flex justify-between items-end h-full px-2">
                                {[1, 2, 3, 4, 5, 6, 7].map((_, j) => (
                                  <div key={j} className="flex flex-col items-center gap-2">
                                    <div className="w-4 h-1 rounded-full" style={{ backgroundColor: chart.color, opacity: 0.3 }} />
                                    <span className="text-[8px] text-gray-400">{17 + j}/02</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Registros de atividade física */}
                        <div className="md:col-span-2 bg-gray-50/50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                          <h6 className="text-sm font-bold text-brand-ink dark:text-dark-ink">Registros de atividade física</h6>
                        </div>
                      </div>
                    </div>
                  ) : activeSubTab === 'Perfil do paciente' ? (
                    <div className="bg-white dark:bg-dark-card rounded-[40px] shadow-sm border border-white/20 dark:border-white/5 overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h4 className="font-bold text-brand-ink dark:text-dark-ink truncate text-2xl serif">{selectedPatient.name}</h4>
                        <button onClick={() => setActiveSubTab('Acompanhamento')} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-8 space-y-10">
                        {/* Dados Básicos */}
                        <section className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-lg font-bold text-brand-ink dark:text-dark-ink">Dados básicos</h5>
                            <button className="text-sm font-bold text-brand-olive uppercase tracking-widest hover:underline">Editar</button>
                          </div>
                          <div className="bg-gray-50/50 dark:bg-white/5 p-8 rounded-[32px] border border-gray-100 dark:border-white/10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                            <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10 shrink-0">
                              <img
                                src={`https://images.unsplash.com/photo-${selectedPatient.id === 1 ? '1494790108377-be9c29b29330' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&q=80&w=300&h=300`}
                                alt={selectedPatient.name}
                                className="w-full h-full object-cover grayscale"
                              />
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                              <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Nome completo</p>
                                <p className="text-sm font-bold text-brand-ink dark:text-dark-ink">{selectedPatient.name}</p>
                              </div>
                              <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Data de nascimento</p>
                                <p className="text-sm font-bold text-brand-ink dark:text-dark-ink">15/11/1984</p>
                              </div>
                              <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Telefone com DDD</p>
                                <p className="text-sm font-bold text-brand-ink dark:text-dark-ink flex items-center justify-center md:justify-start gap-2">
                                  (11) 96040-1325 <MessageCircle size={14} className="text-green-500" />
                                </p>
                              </div>
                              <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-white/5 lg:col-span-2">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Link do paciente <span className="text-gray-300">?</span></p>
                                <p className="text-sm font-bold text-brand-olive truncate flex items-center gap-2">
                                  https://paciente.me/479994364533 <Edit2 size={12} /> <LogOut className="rotate-180" size={12} />
                                </p>
                              </div>
                              <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Já logou no aplicativo?</p>
                                <p className="text-sm font-bold text-red-500">Não</p>
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Fluxo de consulta */}
                        <section className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-lg font-bold text-brand-ink dark:text-dark-ink">Fluxo de consulta</h5>
                            <button className="text-sm font-bold text-brand-olive uppercase tracking-widest hover:underline">Configurar</button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                            {[
                              { label: 'registrar consulta', icon: <Check size={20} />, color: 'bg-[#1DE9B6]' },
                              { label: 'agendar paciente', icon: <Calendar size={20} />, color: 'bg-[#1DE9B6]' },
                              { label: 'adicionar anamnese', icon: <MessageCircle size={20} />, color: 'bg-[#1DE9B6]' },
                              { label: 'adicionar antropometria', icon: <User size={20} />, color: 'bg-[#1DE9B6]' },
                              { label: 'adicionar planejamento', icon: <Utensils size={20} />, color: 'bg-[#1DE9B6]' },
                              { label: 'adicionar orientação', icon: <FileText size={20} />, color: 'bg-[#1DE9B6]' },
                              { label: 'adicionar manipulados', icon: <Pill size={20} />, color: 'bg-[#1DE9B6]' },
                            ].map((action, i) => (
                              <button key={i} className={`${action.color} hover:brightness-95 transition-all p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2 group`}>
                                <div className="text-white drop-shadow-sm group-hover:scale-110 transition-transform">
                                  {action.icon}
                                </div>
                                <span className="text-[10px] font-bold text-white leading-tight uppercase tracking-tight">{action.label}</span>
                              </button>
                            ))}
                          </div>
                        </section>

                        {/* Ajustes do paciente */}
                        <section className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-lg font-bold text-brand-ink dark:text-dark-ink">Ajustes do paciente</h5>
                          </div>
                          <div className="bg-gray-50/50 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/10 overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
                            {[
                              { label: 'Habilitar acesso ao link do paciente (conteúdos do paciente.me/479994364533)', active: true },
                              { label: 'Habilitar acesso ao aplicativo WebDiet', active: true },
                              { label: 'Habilitar funcionalidade WebDiet+ para o paciente', active: true },
                            ].map((setting, i) => (
                              <div key={i} className="px-6 py-4 flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{setting.label}</span>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${setting.active ? 'bg-[#1DE9B6]' : 'bg-gray-200 dark:bg-white/10'}`}>
                                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${setting.active ? 'translate-x-4' : ''}`} />
                                </div>
                              </div>
                            ))}
                            <div className="px-6 py-4 flex justify-between items-center bg-gray-100/30 dark:bg-white/5">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 italic">Demais ajustes de aplicativo WebDiet</span>
                              <button className="text-[10px] font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Configurar</button>
                            </div>
                          </div>
                        </section>

                        {/* Diário Alimentar Placeholder */}
                        <section className="space-y-4">
                          <h5 className="text-lg font-bold text-brand-ink dark:text-dark-ink">Diário alimentar</h5>
                          <div className="bg-gray-50/50 dark:bg-white/5 p-8 rounded-[32px] border border-gray-100 dark:border-white/10">
                            <p className="text-xs text-gray-500 italic">
                              Nenhuma foto de diário alimentar foi enviada pelo seu paciente. Você pode solicitar que ele use o aplicativo para enviar as fotos e você acompanhar o andamento do plano alimentar.
                            </p>
                          </div>
                        </section>

                        {/* Reações Placeholder */}
                        <section className="space-y-4">
                          <h5 className="text-lg font-bold text-brand-ink dark:text-dark-ink flex items-center gap-2">
                            Reações a refeições <span className="text-xs text-gray-300">?</span>
                          </h5>
                        </section>
                      </div>
                    </div>
                  ) : activeSubTab === 'Histórico de consultas' ? (
                    <div className="bg-white dark:bg-dark-card p-8 rounded-[40px] shadow-sm border border-white/20 dark:border-white/5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                          <h5 className="text-xl font-bold text-brand-ink dark:text-dark-ink">Histórico de consultas</h5>
                          <p className="text-sm text-gray-400 mt-1">Gerencie as consultas deste paciente</p>
                        </div>
                        <button
                          onClick={() => setShowNewConsultationModal(true)}
                          className="bg-[#1DE9B6] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:brightness-95 transition-all"
                        >
                          Nova Consulta
                        </button>
                      </div>

                      <div className="space-y-4">
                        {patientConsultations.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 dark:bg-white/5 rounded-3xl">
                            <p className="text-gray-400 font-medium">Nenhuma consulta registrada ainda.</p>
                          </div>
                        ) : (
                          patientConsultations.map((consult) => (
                            <div key={consult.id} className="p-5 rounded-3xl bg-gray-50 dark:bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100 dark:border-white/5">
                              <div>
                                <p className="font-bold text-brand-ink dark:text-dark-ink">{consult.date}</p>
                                <p className="text-sm text-gray-500 line-clamp-1">{consult.notes || 'Sem observações'}</p>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => setShowConsultationDetailsModal(consult)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-brand-olive hover:bg-gray-50 transition-colors"
                                >
                                  Ver
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Tem certeza que deseja excluir esta consulta?')) {
                                      const { error } = await supabase.from('consultations').delete().eq('id', consult.id);
                                      if (!error) {
                                        setPatientConsultations(prev => prev.filter(c => c.id !== consult.id));
                                      }
                                    }
                                  }}
                                  className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-dark-card p-12 rounded-[40px] shadow-sm border border-white/20 dark:border-white/5 text-center space-y-4">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-300">
                        <ClipboardList size={40} />
                      </div>
                      <h4 className="text-xl font-bold text-brand-ink dark:text-dark-ink">{activeSubTab}</h4>
                      <p className="text-sm text-gray-400 max-w-xs mx-auto">Esta seção está em desenvolvimento e será integrada em breve para oferecer mais recursos ao seu consultório.</p>
                      <button onClick={() => setActiveSubTab('Acompanhamento')} className="text-brand-olive font-bold uppercase tracking-widest text-xs hover:underline mt-4 inline-block">Voltar para Acompanhamento</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'start' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Appointments */}
              <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-brand-ink dark:text-dark-ink">Próximas Consultas</h3>
                  <button onClick={() => setActiveTab('appointments')} className="text-sm font-bold text-brand-olive uppercase tracking-widest hover:underline">Ver Agenda</button>
                </div>
                <div className="p-6 space-y-4">
                  {mockAppointments.slice(0, 4).map((apt, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-brand-olive">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{apt.patient}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{apt.time} • {apt.type}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-olive group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Requests */}
              <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-brand-ink dark:text-dark-ink">Pedidos Recentes</h3>
                  <button onClick={() => setActiveTab('requests')} className="text-sm font-bold text-brand-olive uppercase tracking-widest hover:underline">Ver Todos</button>
                </div>
                <div className="p-6 space-y-4">
                  {requests.slice(0, 4).map((req, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-dark-card shadow-sm flex items-center justify-center text-purple-500">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{req.patient}</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{req.type} • {req.date}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${req.status === 'Concluído' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'appointments' ? (
            <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 overflow-hidden p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="serif text-2xl font-bold text-brand-ink dark:text-dark-ink">Agenda Semanal</h3>
                <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-2xl">
                  <button className="px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest bg-white dark:bg-dark-card shadow-sm text-brand-ink dark:text-dark-ink">Semana</button>
                  <button className="px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest text-gray-400">Mês</button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-8 gap-px bg-gray-100 dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-dark-bg p-4" />
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="bg-gray-50 dark:bg-dark-bg p-4 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{day}</p>
                  </div>
                ))}

                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => (
                  <React.Fragment key={hour}>
                    <div className="bg-white dark:bg-dark-card p-4 text-right border-t border-gray-100 dark:border-white/5">
                      <p className="text-xs font-bold text-gray-400">{hour}:00</p>
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div key={day} className="bg-white dark:bg-dark-card p-2 border-t border-l border-gray-100 dark:border-white/5 min-h-[80px] relative group hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                        {hour === 9 && day === 1 && (
                          <div className="absolute inset-1 bg-brand-olive/10 border-l-4 border-brand-olive p-2 rounded-lg">
                            <p className="text-[8px] font-bold text-brand-olive uppercase">Ana Silva</p>
                            <p className="text-[8px] text-brand-olive/60">Check-up</p>
                          </div>
                        )}
                        {hour === 14 && day === 3 && (
                          <div className="absolute inset-1 bg-blue-500/10 border-l-4 border-blue-500 p-2 rounded-lg">
                            <p className="text-[8px] font-bold text-blue-500 uppercase">Bruno Costa</p>
                            <p className="text-[8px] text-blue-500/60">Retorno</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <h3 className="text-lg font-bold text-brand-ink dark:text-dark-ink">
                    {activeTab === 'patients' ? 'Lista de Pacientes' : activeTab === 'requests' ? 'Pedidos Médicos' : 'Agenda Semanal'}
                  </h3>
                  <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {activeTab === 'patients' ? patients.length : activeTab === 'requests' ? requests.length : 'Fev 2026'}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-[#5A5A40]/20"
                    />
                  </div>
                  <button className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-brand-olive transition-colors">
                    <Filter size={20} />
                  </button>
                  <button
                    onClick={() => {
                      if (activeTab === 'patients') {
                        setShowPatientModal(true);
                      } else if (activeTab === 'requests') {
                        setShowRequestModal(true);
                      }
                    }}
                    className="bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-base font-bold flex items-center gap-2 hover:bg-[#4a4a34] transition-all"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Novo</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {activeTab === 'appointments' ? (
                  <div className="min-w-[800px]">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 dark:border-white/20">
                      <div className="p-4"></div>
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                        <div key={day} className="p-4 text-center border-l border-gray-200 dark:border-white/20">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{day}</p>
                          <p className={`text-lg font-bold ${i === 0 ? 'text-blue-500' : 'text-brand-ink dark:text-dark-ink'}`}>
                            {23 + i}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="relative h-[600px] overflow-y-auto">
                      {/* Time Rows */}
                      {Array.from({ length: 11 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-[80px_repeat(7,1fr)] h-20 border-b border-gray-200 dark:border-white/20">
                          <div className="p-2 text-xs font-bold text-gray-400 text-right pr-4">
                            {8 + i}:00
                          </div>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <div key={j} className="border-l border-gray-200 dark:border-white/20 relative group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                              {/* Drop zone for new appointments */}
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Appointments Overlay */}
                      {mockAppointments.map((apt) => {
                        const dayIndex = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].indexOf(apt.day);
                        const hour = parseInt(apt.time.split(':')[0]);
                        const minute = parseInt(apt.time.split(':')[1]);
                        const top = (hour - 8) * 80 + (minute / 60) * 80;
                        const height = (apt.duration / 60) * 80;

                        return (
                          <motion.div
                            key={apt.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              position: 'absolute',
                              top: `${top}px`,
                              left: `calc(80px + (${dayIndex} * (100% - 80px) / 7))`,
                              width: `calc((100% - 80px) / 7 - 8px)`,
                              marginLeft: '4px',
                              height: `${height}px`,
                            }}
                            className={`${apt.color} rounded-lg p-2 shadow-lg shadow-black/10 border border-white/20 cursor-pointer hover:brightness-110 transition-all z-10`}
                          >
                            <p className="text-xs font-bold text-white/80 uppercase tracking-tighter leading-none mb-1">
                              {apt.time}
                            </p>
                            <p className="text-sm font-bold text-white truncate">
                              {apt.patient}
                            </p>
                          </motion.div>
                        );
                      })}

                      {/* Current Time Indicator */}
                      <div
                        className="absolute left-[80px] right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center"
                        style={{ top: '220px' }} // Mock current time
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-white/5 text-xs font-bold uppercase tracking-widest text-gray-400">
                        <th className="px-6 py-4">Nome / E-mail</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Última Consulta</th>
                        <th className="px-6 py-4">Objetivo</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {(activeTab === 'patients' ? patients : requests).map((item: any, i) => (
                        <tr
                          key={item.id}
                          onClick={() => {
                            if (activeTab === 'patients') {
                              setSelectedPatient(item);
                              if (window.innerWidth < 768) {
                                setShowPatientDetailsModal(true);
                              } else {
                                setActiveTab('patient-details');
                              }
                            }
                          }}
                          className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-olive/10 flex items-center justify-center text-brand-olive font-bold">
                                {item.name ? item.name.charAt(0) : item.patient.charAt(0)}
                              </div>
                              <div>
                                <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.name || item.patient}</p>
                                <p className="text-xs text-gray-400">{item.email || item.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${item.status === 'Ativo' || item.status === 'Enviado'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                              : item.status === 'Pendente'
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'
                                : 'bg-gray-50 dark:bg-white/10 text-gray-400'
                              }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.lastConsult || item.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.objective || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-gray-400 hover:text-brand-olive transition-colors">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 px-8 py-4 flex justify-between items-center z-50">
          {[
            { id: 'patients', icon: <Users size={24} />, label: 'Pacientes' },
            { id: 'appointments', icon: <Calendar size={24} />, label: 'Agenda' },
            { id: 'requests', icon: <FilePlus size={24} />, label: 'Pedidos' },
            { id: 'auth', icon: <LogOut size={24} />, label: 'Sair' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => item.id === 'auth' ? setStep('auth') : setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-[#5A5A40]' : 'text-gray-400'}`}
            >
              {item.icon}
              <span className="text-xs font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* New Request Modal */}
        <AnimatePresence>
          {showRequestModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRequestModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-card w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10 border border-white/20 dark:border-white/5"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-brand-ink dark:text-dark-ink">Novo Pedido Médico</h3>
                  <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setShowRequestModal(false); }}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Paciente</label>
                    <select
                      required
                      value={requestPatient}
                      onChange={(e) => setRequestPatient(e.target.value)}
                      className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200 appearance-none"
                    >
                      <option value="">Selecione um paciente</option>
                      {patients.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Tipo de Pedido</label>
                    <select
                      required
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200 appearance-none"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Exame de Sangue">Exame de Sangue</option>
                      <option value="Suplementação">Suplementação</option>
                      <option value="Bioimpedância">Bioimpedância</option>
                      <option value="Plano Alimentar">Plano Alimentar</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Observações</label>
                    <textarea
                      placeholder="Instruções adicionais..."
                      className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200 min-h-[100px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#5A5A40]/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    Emitir Pedido
                    <Check size={18} />
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Prescription Modal */}
        <AnimatePresence>
          {showPrescriptionModal && selectedPatient && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPrescriptionModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#f5f5f0] dark:bg-dark-bg w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="bg-white dark:bg-dark-card p-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowPrescriptionModal(false)} className="p-2 text-gray-400 hover:text-brand-olive transition-colors">
                      <ArrowLeft size={24} />
                    </button>
                    <div>
                      <h3 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Receituário Médico</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedPatient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="p-3 rounded-2xl bg-brand-olive/10 text-brand-olive hover:bg-brand-olive/20 transition-all flex items-center gap-2"
                    >
                      <Printer size={20} />
                      <span className="text-sm font-bold uppercase tracking-widest hidden sm:inline">Imprimir</span>
                    </button>
                    <button onClick={() => setShowPrescriptionModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  {/* History Sidebar */}
                  <aside className="w-full md:w-72 bg-white dark:bg-dark-card border-r border-gray-100 dark:border-white/5 overflow-y-auto p-6 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Histórico de Receitas</h4>
                    <div className="space-y-2">
                      {[
                        { id: 1, date: '23/02/2026', title: 'Suplementação Base', active: true },
                        { id: 2, date: '15/01/2026', title: 'Ajuste de Vitaminas', active: false },
                        { id: 3, date: '10/12/2025', title: 'Protocolo Inicial', active: false },
                      ].map((item) => (
                        <button
                          key={item.id}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${item.active
                            ? 'bg-brand-olive/5 border-brand-olive/30 ring-1 ring-brand-olive/30'
                            : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                            }`}
                        >
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.date}</p>
                          <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.title}</p>
                        </button>
                      ))}
                    </div>
                  </aside>

                  {/* Prescription Content */}
                  <main className="flex-1 bg-white dark:bg-dark-card p-8 md:p-12 overflow-y-auto print:p-0">
                    <div className="max-w-4xl mx-auto space-y-10 print:max-w-none">
                      {/* Header for Print */}
                      <div className="flex justify-between items-start border-b-2 border-brand-olive/20 pb-8">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-transparent flex items-center justify-center p-1">
                              <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h2 className="serif text-2xl font-bold text-brand-ink dark:text-dark-ink">Dra. Aure</h2>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nutricionista • CRN 12345</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-brand-ink dark:text-dark-ink">Paciente: {selectedPatient.name}</p>
                            <p className="text-xs text-gray-400">Data: 23 de Fevereiro de 2026</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                          Rua das Palmeiras, 123<br />
                          São Paulo - SP<br />
                          (11) 99999-9999
                        </div>
                      </div>

                      {/* Prescription Body */}
                      <div className="space-y-8">
                        <h3 className="serif text-4xl font-bold text-brand-ink dark:text-dark-ink text-center underline decoration-brand-olive/20 underline-offset-8">Receituário</h3>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand-olive" />
                              <h4 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Suplementação Manhã</h4>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Whey Protein Isolado</p>
                                  <p className="text-xs text-gray-500">Tomar 30g diluído em 200ml de água.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">1 scoop</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Creatina Monohidratada</p>
                                  <p className="text-xs text-gray-500">Diluir junto ao Whey Protein.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">5g</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-brand-olive" />
                              <h4 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Vitaminas</h4>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Vitamina D3</p>
                                  <p className="text-xs text-gray-500">Tomar após o almoço.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">2.000 UI</span>
                              </div>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Ômega 3</p>
                                  <p className="text-xs text-gray-500">Tomar 1 cápsula após o jantar.</p>
                                </div>
                                <span className="text-sm font-bold text-brand-olive">1.000mg</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-10 space-y-2">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Observações:</p>
                          <p className="text-xs text-gray-500 italic leading-relaxed">
                            Manter a hidratação constante ao longo do dia (mínimo 2.5L).
                            Evitar o consumo de cafeína após as 16h para não prejudicar o sono.
                            Retorno em 45 dias para reavaliação.
                          </p>
                        </div>
                      </div>

                      {/* Footer / Signature */}
                      <div className="pt-16 flex flex-col items-center">
                        <div className="w-48 border-b border-brand-ink/20 mb-2" />
                        <p className="text-base font-bold text-brand-ink dark:text-dark-ink">Dra. Aure</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Nutricionista Esportiva</p>
                      </div>
                    </div>
                  </main>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Exams Modal */}
        <AnimatePresence>
          {showExamsModal && selectedPatient && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExamsModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#f5f5f0] dark:bg-dark-bg w-full max-w-2xl h-full md:h-auto md:max-h-[85vh] md:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="bg-white dark:bg-dark-card p-6 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowExamsModal(false)} className="p-2 text-gray-400 hover:text-brand-olive transition-colors">
                      <ArrowLeft size={24} />
                    </button>
                    <div>
                      <h3 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Exames</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedPatient.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowExamsModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Request New Exam Section */}
                  <section className="space-y-4">
                    <h4 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Solicitar Novo Exame</h4>
                    <div className="bg-white dark:bg-dark-card p-6 rounded-[32px] shadow-sm border border-white/20 dark:border-white/5">
                      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowExamsModal(false); }}>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Tipo de Exame</label>
                          <select required className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200 appearance-none">
                            <option value="">Selecione o exame</option>
                            <option value="Hemograma Completo">Hemograma Completo</option>
                            <option value="Perfil Lipídico">Perfil Lipídico</option>
                            <option value="Glicemia de Jejum">Glicemia de Jejum</option>
                            <option value="Vitamina D">Vitamina D</option>
                            <option value="Bioimpedância">Bioimpedância</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Urgência</label>
                          <div className="flex gap-4">
                            {['Normal', 'Urgente'].map((level) => (
                              <label key={level} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all has-[:checked]:bg-[#5A5A40]/5 has-[:checked]:border-[#5A5A40]/30">
                                <input type="radio" name="urgency" value={level} className="hidden" defaultChecked={level === 'Normal'} />
                                <span className="text-sm font-bold text-gray-500">{level}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#5A5A40]/20 transition-all flex items-center justify-center gap-2"
                        >
                          Enviar Solicitação
                          <Check size={18} />
                        </button>
                      </form>
                    </div>
                  </section>

                  {/* Requested Exams History */}
                  <section className="space-y-4">
                    <h4 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Exames Solicitados</h4>
                    <div className="space-y-3">
                      {[
                        { id: 1, name: 'Hemograma Completo', date: '22/02/2026', status: 'Pendente', icon: <Activity size={18} /> },
                        { id: 2, name: 'Perfil Lipídico', date: '15/01/2026', status: 'Concluído', icon: <FileText size={18} /> },
                        { id: 3, name: 'Vitamina D', date: '15/01/2026', status: 'Concluído', icon: <FileText size={18} /> },
                      ].map((exam) => (
                        <div key={exam.id} className="bg-white dark:bg-dark-card p-5 rounded-3xl shadow-sm border border-white/20 dark:border-white/5 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-brand-olive">
                              {exam.icon}
                            </div>
                            <div>
                              <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{exam.name}</p>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{exam.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${exam.status === 'Concluído' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                              {exam.status}
                            </span>
                            {exam.status === 'Concluído' && (
                              <button className="p-2 text-brand-olive hover:bg-brand-olive/10 rounded-xl transition-all">
                                <ChevronRight size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showPatientDetailsModal && selectedPatient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPatientDetailsModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bg-[#f5f5f0] dark:bg-dark-bg w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-[40px] shadow-2xl relative z-10 overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="sticky top-0 z-20 bg-[#f5f5f0]/80 dark:bg-dark-bg/80 backdrop-blur-md p-6 flex justify-between items-center border-b border-gray-200 dark:border-white/5">
                  <button onClick={() => setShowPatientDetailsModal(false)} className="p-2 text-gray-400 hover:text-brand-olive transition-colors">
                    <ArrowLeft size={24} />
                  </button>
                  <h3 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Perfil do Paciente</h3>
                  <button className="text-brand-olive dark:text-brand-gold font-bold text-sm">Editar</button>
                </div>

                <div className="p-6 space-y-8">
                  {/* Profile Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 rounded-full border-4 border-white dark:border-dark-card shadow-lg overflow-hidden">
                        <img
                          src={`https://images.unsplash.com/photo-${selectedPatient.id === 1 ? '1494790108377-be9c29b29330' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&q=80&w=200&h=200`}
                          alt={selectedPatient.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    </div>
                    <h4 className="serif text-2xl font-bold text-brand-ink dark:text-dark-ink">{selectedPatient.name}</h4>
                    <p className="text-sm text-gray-400 font-medium">34 anos • {selectedPatient.objective}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'PESO', value: '68', unit: 'kg' },
                      { label: 'ALTURA', value: '1.65', unit: 'm' },
                      { label: 'GORDURA', value: '18', unit: '%' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white dark:bg-dark-card p-4 rounded-3xl text-center shadow-sm border border-white/20 dark:border-white/5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-brand-ink dark:text-dark-ink">
                          {stat.value}<span className="text-xs text-gray-400 font-normal ml-0.5">{stat.unit}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <button className="bg-[#00E676] hover:bg-[#00C853] text-white font-bold py-4 rounded-3xl shadow-lg shadow-green-500/20 transition-all flex flex-col items-center justify-center gap-1 col-span-2">
                    <Utensils size={18} />
                    <span className="text-base uppercase tracking-widest">Plano</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowPatientDetailsModal(false);
                      setActiveTab('appointments');
                    }}
                    className="bg-white dark:bg-dark-card text-brand-ink dark:text-dark-ink font-bold py-4 rounded-3xl shadow-sm border border-white/20 dark:border-white/5 transition-all flex flex-col items-center justify-center gap-1 col-span-2"
                  >
                    <Calendar size={18} className="text-blue-500" />
                    <span className="text-base uppercase tracking-widest">Agendar</span>
                  </button>

                  {/* Evolution Chart */}
                  <div className="bg-white dark:bg-dark-card p-6 rounded-[40px] shadow-sm border border-white/20 dark:border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h5 className="font-bold text-brand-ink dark:text-dark-ink">Evolução</h5>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Últimos 6 meses</p>
                      </div>
                      <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-xl">
                        <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-white dark:bg-dark-card shadow-sm text-brand-ink dark:text-dark-ink">Peso</button>
                        <button className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400">Gordura</button>
                      </div>
                    </div>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { month: 'MAI', weight: 72 },
                          { month: 'JUN', weight: 71 },
                          { month: 'JUL', weight: 70 },
                          { month: 'AGO', weight: 69 },
                          { month: 'SET', weight: 68.5 },
                          { month: 'OUT', weight: 68 },
                        ]}>
                          <defs>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                          <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="weight" stroke="#00E676" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Nutritional Evaluation */}
                  <div className="space-y-4">
                    <h5 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Avaliação Nutricional</h5>
                    <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-sm border border-white/20 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
                      {[
                        { icon: <Activity className="text-green-500" size={18} />, label: 'Taxa Metabólica Basal', sub: 'Harris-Benedict', value: '1.450 kcal' },
                        { icon: <Flame className="text-orange-500" size={18} />, label: 'Gasto Energético Total', sub: 'TDEE (Moderado)', value: '2.300 kcal' },
                        { icon: <Droplets className="text-blue-500" size={18} />, label: 'Hidratação Ideal', sub: '35ml/kg', value: '2.4 Litros' },
                      ].map((item, i) => (
                        <div key={i} className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.label}</p>
                              <p className="text-xs text-gray-400 font-medium">{item.sub}</p>
                            </div>
                          </div>
                          <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan History */}
                  <div className="space-y-4 pb-12">
                    <div className="flex justify-between items-center">
                      <h5 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Histórico de Planos</h5>
                      <button className="text-xs font-bold uppercase tracking-widest text-[#00E676]">Ver todos</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: 'Hipertrofia Limpa v2', date: '24 Out 2023', status: 'ATIVO', color: 'bg-green-500' },
                        { title: 'Manutenção', date: '10 Ago 2023', status: 'ARQUIVADO', color: 'bg-gray-400' },
                      ].map((plan, i) => (
                        <div key={i} className="bg-white dark:bg-dark-card p-5 rounded-3xl shadow-sm border border-white/20 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#00E676]/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-1 h-10 rounded-full ${plan.color}`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{plan.title}</p>
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold ${plan.status === 'ATIVO' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                  {plan.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                <Calendar size={10} />
                                {plan.date}
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-[#00E676] transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showNewConsultationModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNewConsultationModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-card w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
              >
                <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                  <h3 className="serif text-2xl font-bold text-brand-ink dark:text-dark-ink mb-2">Você está realizando uma nova consulta?</h3>
                  <p className="text-sm text-gray-500">Registre a consulta do seu paciente e tenha acesso as métricas completas do seu consultório.</p>
                </div>

                <form className="p-8 space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  if (newConsultationDate && selectedPatient) {
                    const newConsult = {
                      patient_id: selectedPatient.id,
                      date: newConsultationDate,
                      notes: newConsultationNotes,
                      planner: newConsultationPlanner
                    };
                    const { data, error } = await supabase.from('consultations').insert([newConsult]).select();
                    if (!error && data) {
                      setPatientConsultations(prev => [data[0], ...prev]);
                    }
                    setShowNewConsultationModal(false);
                    setNewConsultationDate('');
                    setNewConsultationNotes('');
                    setNewConsultationPlanner(false);
                  }
                }}>
                  <div className="space-y-4">
                    <input
                      required
                      type="text"
                      value={newConsultationDate}
                      onChange={(e) => setNewConsultationDate(e.target.value)}
                      placeholder="25/02/2026"
                      className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 outline-none focus:border-[#1DE9B6] text-center font-bold text-brand-ink dark:text-dark-ink"
                    />
                    <input
                      type="text"
                      value={newConsultationNotes}
                      onChange={(e) => setNewConsultationNotes(e.target.value)}
                      placeholder="Observação desta consulta"
                      className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 outline-none focus:border-[#1DE9B6] text-center text-sm text-gray-400"
                    />
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Criar uma tarefa da consulta no planner</span>
                      <button
                        type="button"
                        onClick={() => setNewConsultationPlanner(!newConsultationPlanner)}
                        className={`shrink-0 w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${newConsultationPlanner ? 'bg-gray-400' : 'bg-gray-200 dark:bg-white/10'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${newConsultationPlanner ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-[#1DE9B6] hover:brightness-95 text-white font-bold py-3.5 rounded-xl transition-all">
                    registrar nova consulta
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {showConsultationDetailsModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConsultationDetailsModal(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-card w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                  <div>
                    <h3 className="serif text-xl font-bold text-brand-ink dark:text-dark-ink">Detalhes da Consulta</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                      {showConsultationDetailsModal.date}
                    </p>
                  </div>
                  <button onClick={() => setShowConsultationDetailsModal(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8">
                  <h4 className="text-sm font-bold text-brand-ink dark:text-dark-ink mb-2">Anotações da consulta:</h4>
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl text-sm text-gray-600 dark:text-gray-300 min-h-[100px]">
                    {showConsultationDetailsModal.notes || 'Nenhuma anotação registrada.'}
                  </div>

                  {showConsultationDetailsModal.planner && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-brand-olive/10 text-brand-olive rounded-full text-xs font-bold uppercase tracking-widest">
                        Tarefa Criada
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
          {showPatientModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPatientModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-[32px] p-8 shadow-2xl relative z-10 border border-white/20 dark:border-white/5 overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-brand-ink dark:text-dark-ink">Cadastrar Novo Paciente</h3>
                  <button onClick={() => setShowPatientModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const newPatient = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    whatsapp: formData.get('whatsapp'),
                    birth_date: formData.get('birthDate'),
                    objective: formData.get('objective'),
                    gender: formData.get('gender'),
                    status: 'Ativo'
                  };

                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    const { data, error } = await supabase.from('patients').insert([{ ...newPatient, doctor_id: user.id }]).select();
                    if (!error && data) {
                      setPatients(prev => [data[0], ...prev]);
                    }
                  }

                  setShowPatientModal(false);
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Nome Completo</label>
                      <input name="name" required type="text" placeholder="Nome do paciente" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
                      <input name="email" required type="email" placeholder="exemplo@email.com" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">WhatsApp</label>
                      <input name="whatsapp" required type="tel" placeholder="(00) 00000-0000" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Data de Nascimento</label>
                      <input name="birthDate" required type="date" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Objetivo</label>
                      <select name="objective" required className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200 appearance-none">
                        <option value="">Selecione o objetivo</option>
                        <option value="Emagrecimento">Emagrecimento</option>
                        <option value="Hipertrofia">Hipertrofia</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Saúde">Saúde</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Gênero</label>
                      <select name="gender" required className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200 appearance-none">
                        <option value="">Selecione</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#5A5A40]/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    Cadastrar Paciente
                    <Check size={18} />
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === 'hydration') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] dark:bg-dark-bg transition-colors duration-300 pb-12">
        {/* Header */}
        <header className="p-6 flex justify-between items-center max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('dashboard')}
              className="p-2 text-gray-400 hover:text-brand-olive dark:hover:text-brand-gold transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Dra. Aure</p>
              <h2 className="text-xl font-bold text-brand-ink dark:text-dark-ink">Hidratação</h2>
            </div>
          </div>
          <button className="p-3 rounded-2xl bg-white dark:bg-dark-card shadow-sm text-gray-400">
            <Settings size={20} />
          </button>
        </header>

        <main className="px-6 max-w-4xl mx-auto w-full space-y-8">
          {/* Circular Progress */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 relative"
          >
            <div className="relative w-72 h-64">
              <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />

              <svg className="w-full h-full transform -rotate-90 relative z-10">
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-white dark:text-dark-card shadow-inner"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={691}
                  strokeDashoffset={691 * (1 - waterIntake / waterGoal)}
                  className="text-blue-500 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-brand-ink dark:text-dark-ink">{waterIntake.toFixed(1)}</span>
                  <span className="text-2xl font-bold text-gray-400">L</span>
                </div>
                <div className="bg-gray-100 dark:bg-white/5 px-4 py-1 rounded-full mt-2">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Meta: {waterGoal}L</p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-[-20px] bg-white dark:bg-dark-card px-6 py-3 rounded-2xl shadow-lg border border-white/20 dark:border-white/5 flex items-center gap-3 z-30"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Droplets size={16} />
              </div>
              <p className="text-base font-bold text-brand-ink dark:text-dark-ink">
                Restam <span className="text-blue-500">{(waterGoal - waterIntake).toFixed(1)}L</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Quick Log */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Registro Rápido</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <GlassWater size={24} />, label: 'Copo', amount: '200ml', value: 200 },
                { icon: <Milk size={24} />, label: 'Garrafa', amount: '500ml', value: 500 },
                { icon: <Plus size={24} />, label: 'Outro', amount: 'Manual', value: 0 },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (item.value > 0) {
                      addHydration(item.label === 'Copo' ? 'Água' : 'Água Mineral', item.value, item.icon);
                    } else {
                      setShowManualModal(true);
                    }
                  }}
                  className="bg-white dark:bg-dark-card p-4 rounded-[24px] border border-white/20 dark:border-white/5 shadow-sm flex flex-col items-center gap-2 transition-all hover:border-blue-500/30"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-brand-ink dark:text-dark-ink">{item.label}</p>
                    <p className="text-xs text-gray-400 font-bold">{item.amount}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* History */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-brand-ink dark:text-dark-ink uppercase tracking-widest">Histórico de Hoje</h3>
              <button className="text-xs font-bold text-blue-500 uppercase tracking-widest">Ver tudo</button>
            </div>
            <div className="space-y-3">
              {hydrationHistory.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-blue-500">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.type}</p>
                      <p className="text-xs text-gray-400 font-bold tracking-widest">{item.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-base font-bold text-brand-ink dark:text-dark-ink">{item.amount}ml</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditingHydration(item.id)}
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteHydration(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Smart Reminders */}
          <section className="bg-blue-600 dark:bg-blue-700 p-6 rounded-[32px] shadow-xl shadow-blue-500/20 text-white space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Lembretes Inteligentes</h3>
                <p className="text-xs text-blue-100">Receba notificações para beber água.</p>
              </div>
              <button
                onClick={() => setRemindersEnabled(!remindersEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${remindersEnabled ? 'bg-white' : 'bg-blue-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${remindersEnabled ? 'right-1 bg-blue-600' : 'left-1 bg-white'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Intervalo</p>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">A cada 2h</span>
                  <Clock size={16} className="text-blue-200" />
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Período</p>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">08:00 - 22:00</span>
                  <Clock size={16} className="text-blue-200" />
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* FAB */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center z-50"
        >
          <Plus size={28} />
        </motion.button>

        {/* Manual Entry Modal */}
        <AnimatePresence>
          {showManualModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowManualModal(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 border border-white/20 dark:border-white/5"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-brand-ink dark:text-dark-ink">
                    {editingId !== null ? 'Editar Registro' : 'Registro Manual'}
                  </h3>
                  <button onClick={() => {
                    setShowManualModal(false);
                    setEditingId(null);
                    setManualType('');
                    setManualAmount('');
                  }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Tipo de Líquido</label>
                    <div className="relative group">
                      <CupSoda className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        required
                        type="text"
                        value={manualType}
                        onChange={(e) => setManualType(e.target.value)}
                        placeholder="Ex: Suco de Laranja, Chá..."
                        className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Quantidade (ml)</label>
                    <div className="relative group">
                      <Droplets className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input
                        required
                        type="number"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        placeholder="Ex: 300"
                        className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-blue-500/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                  >
                    {editingId !== null ? 'Salvar Alterações' : 'Adicionar Registro'}
                    <Check size={18} />
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl bg-white dark:bg-dark-card shadow-lg border border-white/20 dark:border-white/5 text-[#5A5A40] dark:text-brand-gold transition-all hover:scale-110 active:scale-95"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#5A5A40]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`w-full ${step === 'health' ? 'max-w-3xl' : 'max-w-2xl'}`}
      >
        <div className="bg-white dark:bg-dark-card rounded-[32px] shadow-xl shadow-black/5 overflow-hidden border border-white/20 dark:border-white/5 backdrop-blur-sm transition-colors duration-300">
          <div className="p-8 sm:p-10">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8 relative">
              {step !== 'auth' && (
                <button
                  onClick={() => setStep(step === 'health' ? 'onboarding' : 'auth')}
                  className="absolute left-0 top-0 p-2 text-gray-400 hover:text-[#5A5A40] transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              <div className="w-32 h-32 mb-4 relative">
                <img
                  src="/assets/logo.png"
                  alt="Dra. Aure Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <AnimatePresence mode="wait">
                {step === 'auth' ? (
                  <motion.div key="auth-h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <h1 className="serif text-3xl font-semibold text-[#5A5A40]">
                      {isLogin ? 'Bem-vinda de volta' : 'Comece sua jornada'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {isLogin ? 'Acesse seu plano nutricional' : 'Crie sua conta exclusiva'}
                    </p>
                  </motion.div>
                ) : step === 'onboarding' ? (
                  <motion.div key="onb-h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <h1 className="serif text-3xl font-semibold text-[#5A5A40]">
                      Olá, {user?.name.split(' ')[0]}!
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Vamos completar seus dados básicos.</p>
                  </motion.div>
                ) : (
                  <motion.div key="health-h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <h1 className="serif text-3xl font-semibold text-[#5A5A40]">Dados de Saúde</h1>
                    <p className="text-sm text-gray-500 mt-1">Agora, conte-nos sobre seu corpo e objetivos.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 'auth' && (
                <motion.form key="auth-f" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5 max-w-md mx-auto" onSubmit={handleAuth}>
                  {!isLogin && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Nome Completo</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                          <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">WhatsApp</label>
                        <div className="relative group flex items-center">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                          <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">+55</div>
                          <input required type="tel" inputMode="numeric" value={whatsapp} onChange={handleWhatsappChange} placeholder="(00) 00000-0000" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-20 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@email.com" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Senha</label>
                      {isLogin && <button type="button" className="text-xs text-[#5A5A40] dark:text-brand-gold hover:underline font-bold uppercase tracking-widest">Esqueceu?</button>}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                    </div>
                  </div>
                  {isLogin && (
                    <div className="flex items-center ml-1">
                      <label className="flex items-center cursor-pointer group">
                        <input type="checkbox" className="sr-only" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                        <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center ${rememberMe ? 'bg-[#5A5A40] border-[#5A5A40]' : 'border-gray-300 group-hover:border-[#5A5A40]/50'}`}>
                          {rememberMe && <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>}
                        </div>
                        <span className="ml-3 text-xs text-gray-500 group-hover:text-gray-700 transition-colors uppercase tracking-widest font-bold">Lembrar-me</span>
                      </label>
                    </div>
                  )}
                  <button disabled={loading} type="submit" className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-medium py-4 rounded-2xl shadow-lg shadow-[#5A5A40]/20 transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50">
                    {loading ? 'Processando...' : (isLogin ? 'Entrar no Aplicativo' : 'Criar minha Conta')}
                    {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 text-center space-y-4">
                    <p className="text-sm text-gray-500">
                      {isLogin ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
                      <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 font-semibold text-[#5A5A40] dark:text-brand-gold hover:underline">
                        {isLogin ? 'Cadastre-se' : 'Fazer Login'}
                      </button>
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUser({ id: 1, name: 'Maria Silva', email: 'maria@email.com', whatsapp: '11999999999' });
                          setStep('dashboard');
                        }}
                        className="text-xs font-bold uppercase tracking-widest py-3 px-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Acesso Paciente (Demo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('doctor-dashboard')}
                        className="text-xs font-bold uppercase tracking-widest py-3 px-2 rounded-xl border border-brand-olive/20 dark:border-brand-gold/20 text-[#5A5A40] dark:text-brand-gold hover:bg-[#5A5A40]/5 dark:hover:bg-brand-gold/5 transition-colors"
                      >
                        Painel Doutora (Demo)
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}

              {step === 'onboarding' && (
                <motion.form key="onb-f" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6" onSubmit={handleOnboarding}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Data de Nascimento</label>
                      <div className="flex gap-4 items-center">
                        <div className="relative group flex-1">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                          <input required type="tel" inputMode="numeric" value={birthDate} onChange={handleBirthDateChange} placeholder="DD/MM/AAAA" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                        </div>
                        {age !== null && (
                          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-4 rounded-2xl font-bold text-lg border border-[#D4AF37]/20 flex flex-col items-center justify-center min-w-[80px]">
                            <span className="text-2xl">{age}</span>
                            <span className="text-xs uppercase tracking-tighter">anos</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">CEP</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                        <input required type="text" maxLength={9} value={cep} onChange={(e) => handleCepLookup(e.target.value)} placeholder="00000-000" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Rua</label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                        <input required type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Número</label>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                        <input required type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Nº" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Bairro</label>
                      <div className="relative group">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                        <input required type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Cidade</label>
                      <div className="relative group">
                        <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#5A5A40] transition-colors" size={18} />
                        <input required type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="w-full bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Estado / UF</label>
                      <div className="flex gap-2">
                        <input required type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="Estado" className="flex-1 bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-4 outline-none transition-all text-gray-700 dark:text-gray-200" />
                        <input required type="text" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} placeholder="UF" className="w-16 bg-[#f9f9f7] dark:bg-white/5 border border-transparent focus:border-[#5A5A40]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 px-2 text-center outline-none transition-all text-gray-700 dark:text-gray-200" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-medium py-4 rounded-2xl shadow-lg shadow-[#5A5A40]/20 transition-all flex items-center justify-center gap-2 group mt-4">
                    Próximo Passo
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.form>
              )}

              {step === 'health' && (
                <motion.form key="health-f" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8" onSubmit={handleHealthSubmit}>
                  {/* Biological Sex */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Sexo Biológico</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Feminino', 'Masculino'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setGender(opt as any)}
                          className={`py-4 rounded-2xl border-2 transition-all font-medium flex items-center justify-center gap-2 ${gender === opt ? 'bg-[#5A5A40]/5 border-[#5A5A40] text-[#5A5A40]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                        >
                          {gender === opt && <Check size={16} />}
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Measurements */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Medidas Corporais</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#f9f9f7] dark:bg-white/5 p-6 rounded-[24px] border border-transparent focus-within:border-[#5A5A40]/20 transition-all">
                        <div className="flex flex-col items-center gap-2">
                          <Ruler className="text-[#5A5A40]/40" size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Altura</span>
                          <div className="flex items-baseline gap-1">
                            <input
                              type="number"
                              value={height}
                              onChange={(e) => setHeight(e.target.value)}
                              placeholder="0"
                              className="w-16 bg-transparent text-center text-2xl font-bold text-gray-700 dark:text-gray-200 outline-none"
                            />
                            <span className="text-xs text-gray-400">cm</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#f9f9f7] dark:bg-white/5 p-6 rounded-[24px] border border-transparent focus-within:border-[#5A5A40]/20 transition-all">
                        <div className="flex flex-col items-center gap-2">
                          <Weight className="text-[#5A5A40]/40" size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Peso</span>
                          <div className="flex items-baseline gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={weight}
                              onChange={(e) => setWeight(e.target.value)}
                              placeholder="0.0"
                              className="w-16 bg-transparent text-center text-2xl font-bold text-gray-700 dark:text-gray-200 outline-none"
                            />
                            <span className="text-xs text-gray-400">kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Objective */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Objetivo Principal</label>
                    <div className="space-y-3">
                      {[
                        { id: 'Emagrecimento', label: 'Emagrecimento', desc: 'Perder gordura de forma saudável', icon: <Target size={20} /> },
                        { id: 'Hipertrofia', label: 'Hipertrofia', desc: 'Ganhar massa muscular e força', icon: <Activity size={20} /> },
                        { id: 'Manutenção', label: 'Manutenção', desc: 'Manter o peso e melhorar saúde', icon: <Leaf size={20} /> }
                      ].map((obj) => (
                        <button
                          key={obj.id}
                          type="button"
                          onClick={() => setObjective(obj.id)}
                          className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${objective === obj.id ? 'bg-[#5A5A40]/5 border-[#5A5A40]' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${objective === obj.id ? 'bg-[#5A5A40] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {obj.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold text-sm ${objective === obj.id ? 'text-[#5A5A40]' : 'text-gray-700'}`}>{obj.label}</h4>
                            <p className="text-xs text-gray-400">{obj.desc}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${objective === obj.id ? 'border-[#5A5A40] bg-[#5A5A40]' : 'border-gray-200'}`}>
                            {objective === obj.id && <Check size={14} className="text-white" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity Level */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Nível de Atividade</label>
                    <div className="px-2 pt-4">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="1"
                        value={activityLevel === 'Sedentário' ? 0 : activityLevel === 'Moderado' ? 1 : 2}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setActivityLevel(val === 0 ? 'Sedentário' : val === 1 ? 'Moderado' : 'Atleta');
                        }}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        <span className={`text-xs font-bold uppercase tracking-widest ${activityLevel === 'Sedentário' ? 'text-[#5A5A40]' : 'text-gray-300'}`}>Sedentário</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${activityLevel === 'Moderado' ? 'text-[#5A5A40]' : 'text-gray-300'}`}>Moderado</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${activityLevel === 'Atleta' ? 'text-[#5A5A40]' : 'text-gray-300'}`}>Atleta</span>
                      </div>
                    </div>
                  </div>

                  {/* Dietary Restrictions */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Restrições Alimentares</label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleDietary(opt)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${dietaryRestrictions.includes(opt) ? 'bg-[#5A5A40] text-white shadow-md shadow-[#5A5A40]/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {opt}
                          {dietaryRestrictions.includes(opt) ? <X size={14} /> : <Plus size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button disabled={loading} type="submit" className="w-full bg-[#5A5A40] hover:bg-[#4a4a34] text-white font-medium py-4 rounded-2xl shadow-lg shadow-[#5A5A40]/20 transition-all flex items-center justify-center gap-2 group mt-4 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Finalizar Perfil'}
                    {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center mt-8 text-xs text-gray-400 uppercase tracking-[0.2em]">
          Dra. Aure • Nutrição & Bem-estar
        </p>
      </motion.div>
    </div>
  );
}
