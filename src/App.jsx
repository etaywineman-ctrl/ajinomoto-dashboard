import React, { useState, useMemo, useRef } from 'react';
import { 
  Upload, CheckCircle2, XCircle, Clock, BarChart3, 
  MessageSquare, User, Briefcase, FileSpreadsheet,
  AlertCircle, Search, Filter, Download
} from 'lucide-react';

// --- MOCK DATA (Based on the provided screenshot) ---
const initialData = [
  { id: '61', runId: '20260608053219', type: 'FCST_NO_RECENT_HIST', item: '83055-TP-SSE SHRIMP CHOW MEIN 7/9 OZ', dc: '10106-Lineage Logistics Bloomington', qf: '0', override: '1120', forecast: '160430', analystComment: 'Investigated: Item phased out in 2024, forecast driven by legacy baseline.', clientComment: '', status: 'pending' },
  { id: '62', runId: '20260608053219', type: 'FCST_NO_RECENT_HIST', item: '9103012-AJI-RAMEN TONKOTSU 16/8 OZ', dc: '10158-Lineage Logistics Logan', qf: '0', override: '3592', forecast: '7751', analystComment: '', clientComment: '', status: 'pending' },
  { id: '63', runId: '20260608053219', type: 'FCST_NO_RECENT_HIST', item: '83056-TP-SSE VEG CHOW MEIN 7/9 OZ', dc: '10117-Lineage Logist University Park', qf: '0', override: '1397', forecast: '2507', analystComment: 'Check promotion overrides.', clientComment: '', status: 'pending' },
  { id: '72', runId: '20260608053219', type: 'NO_HIST_WITH_OVR_AND_FCST', item: '6440227-AJI-GYOZA HANE CHICKEN 4/10.71', dc: '10158-Lineage Logistics Logan', qf: '0', override: '4374', forecast: '18520', analystComment: 'New product introduction. Pseudo history applied manually by demand planning.', clientComment: 'Approved, this is expected for the NPI launch.', status: 'approved' },
  { id: '73', runId: '20260608053219', type: 'NO_HIST_WITH_OVR_AND_FCST', item: '9912002-TRD-GYOZA BEEF 12 CT/ 20 TRAY', dc: '17103-Portland SE PDX Warehouse', qf: '0', override: '230000', forecast: '376468', analystComment: 'Massive override detected. Needs client confirmation.', clientComment: 'Rejecting this. Override was a typo, should be 23,000.', status: 'rejected' },
  { id: '74', runId: '20260608053219', type: 'NO_HIST_WITH_OVR_AND_FCST', item: '83055-TP-SSE SHRIMP CHOW MEIN 7/9 OZ', dc: '10172-Lineage Logistics McDonough', qf: '0', override: '622', forecast: '865', analystComment: '', clientComment: '', status: 'pending' },
];

export default function App() {
  const [data, setData] = useState(initialData);
  const [viewMode, setViewMode] = useState('analyst'); // 'analyst' or 'planner'
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  // --- CSV PARSING LOGIC ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) return; // Need at least header and one row

      // Simple CSV parser (assumes standard format without complex quoted commas for this prototype)
      const parsedData = rows.slice(1).map((row, index) => {
        const cols = row.split(',').map(col => col.replace(/^"|"$/g, '').trim());
        return {
          id: `uploaded-${index}`,
          runId: cols[0] || 'N/A',
          type: cols[1] || 'UNKNOWN',
          item: cols[2] || 'Unknown Item',
          dc: cols[3] || 'Unknown DC',
          qf: cols[4] || '0',
          override: cols[5] || '0',
          forecast: cols[6] || '0',
          analystComment: '',
          clientComment: '',
          status: 'pending'
        };
      });
      setData(parsedData);
    };
    reader.readAsText(file);
  };

  // --- DATA UPDATES ---
  const updateRow = (id, field, value) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // --- DERIVED STATE (KPIs & Charts) ---
  const filteredData = useMemo(() => {
    return data.filter(row => 
      row.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const total = data.length;
    const approved = data.filter(d => d.status === 'approved').length;
    const rejected = data.filter(d => d.status === 'rejected').length;
    const pending = total - approved - rejected;
    
    // Group by Exception Type
    const byType = data.reduce((acc, curr) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1;
      return acc;
    }, {});

    return { total, approved, rejected, pending, byType };
  }, [data]);

  // --- UI COMPONENTS ---
  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Ajinomoto Logo */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Ajinomoto_logo.svg" 
              alt="Ajinomoto Logo" 
              className="h-7 w-auto object-contain"
            />
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-slate-800">Post-Forecast Analysis</h1>
              <p className="text-xs text-slate-500 font-medium">Demantra Data Integrity Framework</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Persona Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setViewMode('analyst')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'analyst' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Briefcase className="w-4 h-4" /> Analyst
              </button>
              <button 
                onClick={() => setViewMode('planner')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'planner' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <User className="w-4 h-4" /> Demand Planner
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              {viewMode === 'analyst' && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-500" /> Upload CSV
                </button>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total Exceptions</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Approved</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Rejected / Fix</p>
              <p className="text-3xl font-bold text-rose-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* DISTRIBUTION CHART ROW */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> Exceptions by Type
            </h2>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, count]) => {
              const percentage = Math.round((count / stats.total) * 100);
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{type}</span>
                    <span className="text-slate-500">{count} items ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DATA WORKSPACE */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-500" /> Validation Workspace
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Item or Type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Scrollable Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-32">Exception Type</th>
                  <th className="py-3 px-4 min-w-[250px]">Item Description</th>
                  <th className="py-3 px-4 min-w-[200px]">DC / Location</th>
                  <th className="py-3 px-4 text-right">History (QF)</th>
                  <th className="py-3 px-4 text-right">Override</th>
                  <th className="py-3 px-4 text-right border-r border-slate-200">Forecast</th>
                  <th className="py-3 px-4 w-64 bg-indigo-50/50">Analyst Comments</th>
                  <th className="py-3 px-4 w-64 bg-emerald-50/50">Demand Planner Comments</th>
                  <th className="py-3 px-4 w-32 text-center">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200">{row.type}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 truncate max-w-[250px]" title={row.item}>{row.item}</td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]" title={row.dc}>{row.dc}</td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">{row.qf || '-'}</td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">{row.override}</td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-600 font-mono border-r border-slate-200">
                      {Number(row.forecast).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    
                    {/* Analyst Comment Field */}
                    <td className="py-2 px-3 bg-indigo-50/20">
                      {viewMode === 'analyst' ? (
                        <textarea 
                          className="w-full text-sm p-2 border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                          rows="2"
                          placeholder="Add analysis..."
                          value={row.analystComment}
                          onChange={(e) => updateRow(row.id, 'analystComment', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm text-slate-700 whitespace-pre-wrap flex gap-2">
                          {row.analystComment ? (
                            <>
                              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="italic">{row.analystComment}</span>
                            </>
                          ) : <span className="text-slate-400 italic">No comments</span>}
                        </div>
                      )}
                    </td>

                    {/* Demand Planner Comment Field */}
                    <td className="py-2 px-3 bg-emerald-50/20">
                      {viewMode === 'planner' ? (
                        <textarea 
                          className="w-full text-sm p-2 border border-slate-200 rounded-md bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                          rows="2"
                          placeholder="Add feedback..."
                          value={row.clientComment}
                          onChange={(e) => updateRow(row.id, 'clientComment', e.target.value)}
                        />
                      ) : (
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">
                          {row.clientComment ? row.clientComment : <span className="text-slate-400 italic">No feedback yet</span>}
                        </div>
                      )}
                    </td>

                    {/* Status / Action */}
                    <td className="py-3 px-4 text-center">
                      {viewMode === 'planner' ? (
                        <select 
                          className={`w-full text-xs font-medium rounded-md p-1.5 border cursor-pointer focus:outline-none focus:ring-2
                            ${row.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500' : ''}
                            ${row.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-rose-500' : ''}
                            ${row.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500' : ''}
                          `}
                          value={row.status}
                          onChange={(e) => updateRow(row.id, 'status', e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approve</option>
                          <option value="rejected">Reject</option>
                        </select>
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-500">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium">No results found</p>
                      <p className="text-sm">Try adjusting your search terms.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}