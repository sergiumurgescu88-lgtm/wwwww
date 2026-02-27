/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Home, 
  MapPin, 
  BedDouble, 
  Maximize2, 
  Phone, 
  Mail, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ArrowUpDown,
  Filter,
  Info,
  User,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = 'https://jordy-circuital-caryl.ngrok-free.dev';

// Types
interface Property {
  id: string | number;
  titlu: string;
  pret: number;
  suprafata: number;
  camere: number;
  oras: string;
  zona: string;
  tip: string; // apartament, casa, etc
  tranzactie: string; // vanzare, inchiriere
  imagine_principala: string;
  imagini?: string[];
  descriere?: string;
  lat?: number;
  lng?: number;
  agent?: {
    nume: string;
    telefon: string;
    email: string;
    foto: string;
  };
  data_adaugarii: string;
}

interface Stats {
  total: number;
  vanzare: number;
  inchiriere: number;
}

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    tip: '',
    tranzactie: '',
    oras: '',
    camere: '',
    pretMin: '',
    pretMax: ''
  });
  
  const [sortBy, setSortBy] = useState('newest');

  // Lead Form
  const [leadForm, setLeadForm] = useState({
    nume: '',
    telefon: '',
    email: '',
    mesaj: '',
    propertyId: ''
  });
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchStats();
    fetchProperties();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/statistici`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proprietati`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      // Ensure data is an array. Some APIs wrap the array in an object like { data: [...] } or { properties: [...] }
      if (Array.isArray(data)) {
        setProperties(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        setProperties(data.data);
      } else if (data && typeof data === 'object' && Array.isArray(data.properties)) {
        setProperties(data.properties);
      } else {
        console.error('API did not return an array of properties:', data);
        setProperties([]);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyDetail = async (id: string | number) => {
    setModalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/proprietati/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const data = await res.json();
      setSelectedProperty(data);
    } catch (err) {
      console.error('Error fetching property detail:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/lead`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ ...leadForm, propertyId: selectedProperty?.id })
      });
      if (res.ok) {
        setLeadStatus('success');
        setLeadForm({ nume: '', telefon: '', email: '', mesaj: '', propertyId: '' });
        setTimeout(() => setLeadStatus('idle'), 5000);
      } else {
        setLeadStatus('error');
      }
    } catch (err) {
      setLeadStatus('error');
    }
  };

  const filteredProperties = useMemo(() => {
    if (!Array.isArray(properties)) return [];
    return properties
      .filter(p => {
        if (filters.tip && p.tip !== filters.tip) return false;
        if (filters.tranzactie && p.tranzactie !== filters.tranzactie) return false;
        if (filters.oras && !p.oras.toLowerCase().includes(filters.oras.toLowerCase())) return false;
        if (filters.camere && p.camere.toString() !== filters.camere) return false;
        if (filters.pretMin && p.pret < parseInt(filters.pretMin)) return false;
        if (filters.pretMax && p.pret > parseInt(filters.pretMax)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.pret - b.pret;
        if (sortBy === 'price_desc') return b.pret - a.pret;
        if (sortBy === 'newest') return new Date(b.data_adaugarii).getTime() - new Date(a.data_adaugarii).getTime();
        return 0;
      });
  }, [properties, filters, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 navy-glass border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Home className="text-navy-900" size={24} />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight text-white">
              Imobiliare<span className="text-gold-500">Pro</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
            <a href="#" className="text-gold-500 border-b border-gold-500">Acasă</a>
            <a href="#grid" className="hover:text-gold-500 transition-colors">Proprietăți</a>
            <a href="#contact" className="hover:text-gold-500 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="md:hidden text-white">
              <Filter size={24} />
            </button>
            <a href="tel:0700000000" className="hidden sm:flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-navy-900 px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105">
              <Phone size={18} />
              <span>Sunați-ne</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920" 
              className="w-full h-full object-cover opacity-40"
              alt="Luxury Home"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/80 to-navy-900"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight"
            >
              Găsește <span className="italic text-gold-500">Acasă</span> în <br />
              locul perfect
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto"
            >
              Cele mai exclusiviste proprietăți din România, selectate pentru stilul tău de viață.
            </motion.p>

            {/* QUICK STATS */}
            <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <div className="text-3xl font-bold text-gold-500">{stats?.total || '...'}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Total</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <div className="text-3xl font-bold text-gold-500">{stats?.vanzare || '...'}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Vânzare</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <div className="text-3xl font-bold text-gold-500">{stats?.inchiriere || '...'}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">Chirie</div>
              </div>
            </div>

            {/* SEARCH FORM */}
            <div className="bg-navy-800/90 p-2 rounded-2xl md:rounded-full shadow-2xl border border-gold-500/20 flex flex-col md:flex-row items-center gap-2">
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full px-4">
                <select 
                  className="bg-transparent text-white py-3 outline-none border-b border-white/10 md:border-none cursor-pointer"
                  value={filters.tip}
                  onChange={(e) => setFilters({...filters, tip: e.target.value})}
                >
                  <option value="" className="bg-navy-800">Tip Proprietate</option>
                  <option value="apartament" className="bg-navy-800">Apartament</option>
                  <option value="casa" className="bg-navy-800">Casă</option>
                  <option value="teren" className="bg-navy-800">Teren</option>
                </select>
                <select 
                  className="bg-transparent text-white py-3 outline-none border-b border-white/10 md:border-none cursor-pointer"
                  value={filters.tranzactie}
                  onChange={(e) => setFilters({...filters, tranzactie: e.target.value})}
                >
                  <option value="" className="bg-navy-800">Tranzacție</option>
                  <option value="vanzare" className="bg-navy-800">Vânzare</option>
                  <option value="inchiriere" className="bg-navy-800">Închiriere</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Oraș / Zonă" 
                  className="bg-transparent text-white py-3 outline-none border-b border-white/10 md:border-none"
                  value={filters.oras}
                  onChange={(e) => setFilters({...filters, oras: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Preț Max" 
                  className="bg-transparent text-white py-3 outline-none border-b border-white/10 md:border-none"
                  value={filters.pretMax}
                  onChange={(e) => setFilters({...filters, pretMax: e.target.value})}
                />
              </div>
              <button 
                onClick={() => document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full md:w-auto gold-gradient text-navy-900 px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/40 transition-all"
              >
                <Search size={20} />
                <span>Caută</span>
              </button>
            </div>
          </div>
        </section>

        {/* PROPERTIES GRID SECTION */}
        <section id="grid" className="py-24 bg-navy-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-4xl font-serif font-bold mb-4">Proprietăți <span className="text-gold-500">Disponibile</span></h2>
                <p className="text-slate-400">Am găsit {filteredProperties.length} rezultate pentru căutarea ta.</p>
              </div>
              
              <div className="flex items-center gap-4 bg-navy-800 p-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setSortBy('newest')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${sortBy === 'newest' ? 'bg-gold-500 text-navy-900 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Cele mai noi
                </button>
                <button 
                  onClick={() => setSortBy('price_asc')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${sortBy === 'price_asc' ? 'bg-gold-500 text-navy-900 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Preț crescător
                </button>
                <button 
                  onClick={() => setSortBy('price_desc')}
                  className={`px-4 py-2 rounded-md text-sm transition-all ${sortBy === 'price_desc' ? 'bg-gold-500 text-navy-900 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Preț descrescător
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <Loader2 className="text-gold-500 animate-spin mb-4" size={48} />
                <p className="text-slate-400">Se încarcă proprietățile...</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-40 bg-navy-800 rounded-3xl border border-dashed border-white/10">
                <Info className="mx-auto text-slate-500 mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">Nicio proprietate găsită</h3>
                <p className="text-slate-400">Încearcă să modifici filtrele de căutare.</p>
                <button 
                  onClick={() => setFilters({ tip: '', tranzactie: '', oras: '', camere: '', pretMin: '', pretMax: '' })}
                  className="mt-6 text-gold-500 hover:underline"
                >
                  Resetează toate filtrele
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((p) => (
                  <motion.div 
                    layout
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="property-card group bg-navy-800 rounded-3xl overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all cursor-pointer shadow-xl"
                    onClick={() => fetchPropertyDetail(p.id)}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={p.imagine_principala} 
                        alt={p.titlu}
                        className="property-image w-full h-full object-cover transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-gold-500 text-navy-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                          {p.tranzactie === 'vanzare' ? 'De Vânzare' : 'Închiriere'}
                        </span>
                        <span className="bg-navy-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                          {p.tip}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-navy-900 to-transparent">
                        <div className="text-2xl font-bold text-white">
                          {p.pret.toLocaleString('ro-RO')} €
                          {p.tranzactie === 'inchiriere' && <span className="text-sm font-normal text-slate-300"> / lună</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-1 text-gold-500 text-xs font-bold uppercase tracking-widest mb-2">
                        <MapPin size={12} />
                        <span>{p.oras}, {p.zona}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-4 line-clamp-1 group-hover:text-gold-500 transition-colors">{p.titlu}</h3>
                      
                      <div className="grid grid-cols-3 gap-4 py-4 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <BedDouble size={16} />
                            <span className="text-xs">Camere</span>
                          </div>
                          <span className="font-bold">{p.camere}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Maximize2 size={16} />
                            <span className="text-xs">Suprafață</span>
                          </div>
                          <span className="font-bold">{p.suprafata} m²</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Home size={16} />
                            <span className="text-xs">Etaj</span>
                          </div>
                          <span className="font-bold">P+2</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Adăugat la: {new Date(p.data_adaugarii).toLocaleDateString('ro-RO')}</span>
                        <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-24 bg-navy-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl font-serif font-bold mb-8">Ești gata să faci <br /><span className="text-gold-500">următoarea mutare?</span></h2>
                <p className="text-xl text-slate-400 mb-12">
                  Echipa noastră de experți este aici pentru a te ghida în fiecare pas al procesului de achiziție sau închiriere.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                      <Phone size={28} />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-widest">Telefon</div>
                      <div className="text-xl font-bold">+40 700 000 000</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                      <Mail size={28} />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-widest">Email</div>
                      <div className="text-xl font-bold">contact@imobiliarepro.ro</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-500">
                      <MapPin size={28} />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 uppercase tracking-widest">Birou</div>
                      <div className="text-xl font-bold">Calea Victoriei 100, București</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-navy-900 p-10 rounded-[40px] border border-gold-500/10 shadow-2xl">
                <h3 className="text-2xl font-bold mb-8">Trimite-ne un mesaj</h3>
                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Nume Complet *</label>
                      <input 
                        required
                        type="text" 
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold-500 transition-all"
                        placeholder="Ex: Ion Popescu"
                        value={leadForm.nume}
                        onChange={(e) => setLeadForm({...leadForm, nume: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Telefon *</label>
                      <input 
                        required
                        type="tel" 
                        className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold-500 transition-all"
                        placeholder="Ex: 0722 000 000"
                        value={leadForm.telefon}
                        onChange={(e) => setLeadForm({...leadForm, telefon: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Email</label>
                    <input 
                      type="email" 
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold-500 transition-all"
                      placeholder="Ex: ion@email.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Mesaj</label>
                    <textarea 
                      rows={4}
                      className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold-500 transition-all resize-none"
                      placeholder="Cu ce te putem ajuta?"
                      value={leadForm.mesaj}
                      onChange={(e) => setLeadForm({...leadForm, mesaj: e.target.value})}
                    ></textarea>
                  </div>
                  
                  <button 
                    disabled={leadStatus === 'loading'}
                    type="submit" 
                    className="w-full gold-gradient text-navy-900 font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-gold-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {leadStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Trimite Solicitarea'}
                  </button>

                  {leadStatus === 'success' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-4 rounded-xl">
                      <CheckCircle2 size={20} />
                      <span>Mesajul a fost trimis cu succes! Te vom contacta în curând.</span>
                    </motion.div>
                  )}
                  {leadStatus === 'error' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-4 rounded-xl">
                      <X size={20} />
                      <span>A apărut o eroare. Te rugăm să încerci din nou.</span>
                    </motion.div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-navy-900 border-t border-white/5 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 gold-gradient rounded flex items-center justify-center">
                  <Home className="text-navy-900" size={18} />
                </div>
                <span className="text-xl font-serif font-bold tracking-tight text-white">
                  Imobiliare<span className="text-gold-500">Pro</span>
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Lideri în consultanță imobiliară premium, oferind soluții personalizate pentru clienți exigenți.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Link-uri Rapide</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-gold-500 transition-colors">Acasă</a></li>
                <li><a href="#grid" className="hover:text-gold-500 transition-colors">Proprietăți</a></li>
                <li><a href="#contact" className="hover:text-gold-500 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-gold-500 transition-colors">Termeni și Condiții</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Proprietăți</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-gold-500 transition-colors">Apartamente de vânzare</a></li>
                <li><a href="#" className="hover:text-gold-500 transition-colors">Case de lux</a></li>
                <li><a href="#" className="hover:text-gold-500 transition-colors">Închirieri birouri</a></li>
                <li><a href="#" className="hover:text-gold-500 transition-colors">Terenuri intravilane</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Newsletter</h4>
              <p className="text-slate-400 mb-4 text-sm">Abonează-te pentru a primi cele mai noi oferte.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="bg-navy-800 border border-white/10 rounded-lg px-4 py-2 w-full outline-none focus:border-gold-500" />
                <button className="bg-gold-500 text-navy-900 p-2 rounded-lg hover:bg-gold-600 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>© 2024 Imobiliare Pro. Toate drepturile rezervate.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">Politica de Confidențialitate</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* PROPERTY DETAIL MODAL */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 modal-overlay"
              onClick={() => setSelectedProperty(null)}
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-navy-900 rounded-[40px] overflow-hidden shadow-2xl border border-gold-500/20 flex flex-col"
            >
              <button 
                onClick={() => setSelectedProperty(null)}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-navy-900/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-gold-500 hover:text-navy-900 transition-all"
              >
                <X size={24} />
              </button>

              <div className="overflow-y-auto flex-grow">
                {modalLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <Loader2 className="text-gold-500 animate-spin" size={48} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Side: Images & Info */}
                    <div className="lg:col-span-8 p-8 sm:p-12">
                      <div className="mb-8 rounded-3xl overflow-hidden h-[400px] relative group">
                        <img 
                          src={selectedProperty.imagine_principala} 
                          className="w-full h-full object-cover"
                          alt={selectedProperty.titlu}
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                          <div className="flex gap-4">
                            <button className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-gold-500 hover:text-navy-900 transition-all">
                              <ChevronLeft size={24} />
                            </button>
                            <button className="bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-gold-500 hover:text-navy-900 transition-all">
                              <ChevronRight size={24} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className="bg-gold-500/10 text-gold-500 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                          {selectedProperty.tranzactie}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <MapPin size={16} />
                          <span>{selectedProperty.oras}, {selectedProperty.zona}</span>
                        </div>
                      </div>

                      <h2 className="text-4xl font-serif font-bold mb-6">{selectedProperty.titlu}</h2>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12 p-8 bg-navy-800 rounded-3xl border border-white/5">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Preț</div>
                          <div className="text-2xl font-bold text-gold-500">{selectedProperty.pret.toLocaleString('ro-RO')} €</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Camere</div>
                          <div className="text-2xl font-bold">{selectedProperty.camere}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Suprafață</div>
                          <div className="text-2xl font-bold">{selectedProperty.suprafata} m²</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Tip</div>
                          <div className="text-2xl font-bold capitalize">{selectedProperty.tip}</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-2xl font-bold border-b border-white/5 pb-4">Descriere</h3>
                        <p className="text-slate-400 leading-relaxed text-lg">
                          {selectedProperty.descriere || "Această proprietate exclusivistă oferă un stil de viață modern și confortabil. Situată într-o zonă liniștită, beneficiază de finisaje de înaltă calitate și spații generoase. Ideală pentru familii sau investiție pe termen lung."}
                        </p>
                      </div>

                      <div className="mt-12 space-y-6">
                        <h3 className="text-2xl font-bold border-b border-white/5 pb-4">Locație</h3>
                        <div className="h-64 bg-navy-800 rounded-3xl flex items-center justify-center border border-white/5 overflow-hidden">
                           {/* Placeholder for Map */}
                           <div className="text-center p-8">
                             <MapPin className="mx-auto text-gold-500 mb-4" size={40} />
                             <p className="text-slate-400">Harta este disponibilă pentru vizualizare. <br /> Lat: {selectedProperty.lat || '44.4268'}, Lng: {selectedProperty.lng || '26.1025'}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Agent & Form */}
                    <div className="lg:col-span-4 bg-navy-800 p-8 sm:p-12 border-l border-white/5">
                      <div className="sticky top-0">
                        <div className="mb-12 text-center">
                          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gold-500 p-1">
                            <img 
                              src={selectedProperty.agent?.foto || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200"} 
                              className="w-full h-full object-cover rounded-full"
                              alt="Agent"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <h4 className="text-xl font-bold">{selectedProperty.agent?.nume || "Alexandru Ionescu"}</h4>
                          <p className="text-gold-500 text-sm font-bold uppercase tracking-widest">Agent Imobiliar Senior</p>
                        </div>

                        <div className="space-y-6 mb-12">
                          <a href={`tel:${selectedProperty.agent?.telefon || '0700000000'}`} className="flex items-center gap-4 p-4 bg-navy-900 rounded-2xl border border-white/5 hover:border-gold-500/50 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-all">
                              <Phone size={20} />
                            </div>
                            <span className="font-bold">{selectedProperty.agent?.telefon || "0700 000 000"}</span>
                          </a>
                          <a href={`mailto:${selectedProperty.agent?.email || 'agent@imobiliarepro.ro'}`} className="flex items-center gap-4 p-4 bg-navy-900 rounded-2xl border border-white/5 hover:border-gold-500/50 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-all">
                              <Mail size={20} />
                            </div>
                            <span className="font-bold">{selectedProperty.agent?.email || "agent@imobiliarepro.ro"}</span>
                          </a>
                        </div>

                        <div className="bg-navy-900 p-8 rounded-3xl border border-white/5">
                          <h5 className="font-bold mb-6">Solicită o vizionare</h5>
                          <form onSubmit={handleLeadSubmit} className="space-y-4">
                            <input 
                              required
                              type="text" 
                              placeholder="Nume" 
                              className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold-500"
                              value={leadForm.nume}
                              onChange={(e) => setLeadForm({...leadForm, nume: e.target.value})}
                            />
                            <input 
                              required
                              type="tel" 
                              placeholder="Telefon" 
                              className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold-500"
                              value={leadForm.telefon}
                              onChange={(e) => setLeadForm({...leadForm, telefon: e.target.value})}
                            />
                            <button 
                              disabled={leadStatus === 'loading'}
                              className="w-full gold-gradient text-navy-900 font-bold py-4 rounded-xl hover:shadow-lg transition-all"
                            >
                              Trimite
                            </button>
                            {leadStatus === 'success' && <p className="text-emerald-500 text-xs text-center">Trimis!</p>}
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
