import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, Check, BookOpen } from 'lucide-react';

interface SynonymRecord {
  id: string;
  keyword: string;
  synonyms: string[];
  is_active: boolean;
}

export default function SynonymsManager() {
  const [records, setRecords] = useState<SynonymRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ keyword: '', synonyms: '' });

  useEffect(() => {
    fetchSynonyms();
  }, []);

  const fetchSynonyms = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('search_synonyms')
      .select('*')
      .order('keyword', { ascending: true });
    if (data) setRecords(data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.keyword.trim() || !formData.synonyms.trim()) return;

    const synonymsArray = formData.synonyms
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      keyword: formData.keyword.trim().toLowerCase(),
      synonyms: synonymsArray,
      is_active: true,
    };

    if (currentId) {
      await supabase.from('search_synonyms').update(payload).eq('id', currentId);
    } else {
      await supabase.from('search_synonyms').insert(payload);
    }

    setFormData({ keyword: '', synonyms: '' });
    setIsEditing(false);
    setCurrentId(null);
    fetchSynonyms();
  };

  const handleEdit = (record: SynonymRecord) => {
    setCurrentId(record.id);
    setFormData({ 
      keyword: record.keyword, 
      synonyms: record.synonyms.join(', ') 
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this synonym map?')) return;
    await supabase.from('search_synonyms').delete().eq('id', id);
    fetchSynonyms();
  };

  const filteredRecords = records.filter(r => 
    r.keyword.includes(searchTerm.toLowerCase()) || 
    r.synonyms.some(s => s.includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink-900 flex items-center gap-2">
            <BookOpen size={20} className="text-brand-600" />
            Search Synonyms Dictionary
          </h2>
          <p className="text-sm text-ink-500">Train the search engine to understand local terms and typos.</p>
        </div>
        <button
          onClick={() => {
            setFormData({ keyword: '', synonyms: '' });
            setCurrentId(null);
            setIsEditing(true);
          }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700"
        >
          <Plus size={16} /> Add Keyword
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-5 rounded-2xl border border-ink-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1">Primary Keyword (e.g., tomato)</label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-500 mb-1">Synonyms (Comma separated)</label>
              <input
                type="text"
                value={formData.synonyms}
                onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                placeholder="tamatar, tomatoes"
                className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-bold text-ink-600 hover:bg-ink-50 rounded-xl">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700">
              <Check size={16} /> Save Mapping
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ink-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-ink-100 relative">
          <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search keywords or synonyms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ink-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        
        <div className="divide-y divide-ink-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-ink-500">Loading dictionary...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-500">No synonyms found.</div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ink-50/50">
                <div>
                  <h4 className="text-sm font-extrabold text-ink-900">{record.keyword}</h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {record.synonyms.map((syn, i) => (
                      <span key={i} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-md uppercase tracking-wide">
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleEdit(record)} className="p-2 text-ink-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(record.id)} className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
