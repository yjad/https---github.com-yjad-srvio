import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown, RefreshCw, RotateCcw, Download, ImageIcon } from 'lucide-react';
import { mockApi } from '@/api/mockApi';

type SortConfig = Record<string, { col: string; asc: boolean } | null>;

const collections = ['categories', 'users', 'services', 'bookings', 'reviews', 'transactions', 'payouts', 'disputes', 'systemSettings', 'serviceComments', 'serviceFamilies', 'imageBlobs'];

export default function BrowseDBPage() {
  const [db, setDb] = useState<Record<string, unknown> | null>(null);
  const [sort, setSort] = useState<SortConfig>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const initialSnapshotRef = useRef<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const result: Record<string, unknown> = {};
    for (const col of collections) {
      try {
        const res = await fetch(`/api/${col}`);
        if (res.ok) result[col] = await res.json();
      } catch {}
    }
    setDb(result);
    if (initialSnapshotRef.current === null && Object.keys(result).length > 0) {
      initialSnapshotRef.current = JSON.parse(JSON.stringify(result));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadCSV = (name: string, data: Record<string, unknown>[]) => {
    if (data.length === 0) return;
    const cols = Object.keys(data[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(','), ...data.map(r => cols.map(c => escape(r[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function downloadSeedFile(data: Record<string, unknown>, filename: string) {
    const seedContent = `import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'db.json');

const defaultSeedData = ${JSON.stringify(data, null, 2)};

function seed() {
  let needsSeeding = false;

  if (!fs.existsSync(dbPath)) {
    needsSeeding = true;
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (!data || !data.users || data.users.length === 0) {
        needsSeeding = true;
      }
    } catch (e) {
      needsSeeding = true;
    }
  }

  if (needsSeeding) {
    console.log('Seeding database (db.json) with default data...');
    fs.writeFileSync(dbPath, JSON.stringify(defaultSeedData, null, 2), 'utf8');
    console.log('Database seeded successfully.');
  } else {
    console.log('Database already contains data. Skipping seed.');
  }
}

seed();`;
    const blob = new Blob([seedContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const [migrating, setMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState('');

  const migrateImages = useCallback(async () => {
    setMigrating(true);
    setMigrationProgress('Scanning services...');
    try {
      const services = await mockApi.getAllServices();
      let count = 0;
      for (const s of services) {
        if (s.image && s.image.startsWith('data:image')) {
          setMigrationProgress(`Migrating service #${s.id} image...`);
          const path = await mockApi.saveImage(s.image, 'services');
          await mockApi.updateService(s.id, { image: path });
          count++;
        }
      }
      setMigrationProgress(`Migrated ${count} service images. Scanning comment attachments...`);
      const comments = await mockApi.getAllServiceComments();
      let commentCount = 0;
      for (const c of comments) {
        if (c.attachments) {
          let changed = false;
          const newAttachments = await Promise.all(c.attachments.map(async (att) => {
            if (att.startsWith('data:image')) {
              const path = await mockApi.saveImage(att, 'attachments');
              commentCount++;
              changed = true;
              return path;
            }
            return att;
          }));
          if (changed) {
            await mockApi.updateServiceComment(c.id, { message: c.message, attachments: newAttachments });
          }
        }
      }
      setMigrationProgress(`Done! Migrated ${count} service images and ${commentCount} attachments.`);
      load();
    } catch (e) {
      setMigrationProgress(`Error: ${e}`);
    } finally {
      setMigrating(false);
    }
  }, [load]);

  if (!db || Object.keys(db).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg">No data found. Make sure json-server is running.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">DB Browser (json-server)</h1>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-3 py-1 hover:bg-blue-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        <button
          onClick={async () => {
            await mockApi.resetDatabase();
            load();
          }}
          className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded px-3 py-1 hover:bg-red-50"
        >
          <RotateCcw className="w-4 h-4" /> Hard Refresh (re-seed)
        </button>
        <button
          onClick={() => {
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            if (initialSnapshotRef.current && Object.keys(initialSnapshotRef.current).length > 0) {
              downloadSeedFile(initialSnapshotRef.current, `seed-backup-${ts}.js`);
            }
            downloadSeedFile(db, 'seed.js');
          }}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 border border-emerald-300 rounded px-3 py-1 hover:bg-emerald-50"
        >
          <Download className="w-4 h-4" /> Replace Seed
        </button>
        <button
          onClick={migrateImages}
          disabled={migrating}
          className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded px-3 py-1 hover:bg-purple-50 disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" /> {migrating ? 'Migrating...' : 'Migrate Images'}
        </button>
        {migrationProgress && <span className="text-sm text-gray-500">{migrationProgress}</span>}
      </div>
      {Object.entries(db).map(([key, value]) => {
        const isObj = !Array.isArray(value) && typeof value === 'object' && value !== null;
        const items: Record<string, unknown>[] = isObj ? [value as Record<string, unknown>] : (value as Record<string, unknown>[]);
        const count = isObj ? 1 : items.length;
        const isOpen = open[key];

        return (
          <div key={key}>
            <h2
              onClick={() => setOpen(prev => ({ ...prev, [key]: !prev[key] }))}
              className="text-lg font-semibold text-blue-600 mb-2 cursor-pointer select-none inline-flex items-center gap-1 hover:text-blue-800"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {key} <span className="text-gray-400 text-sm font-normal">({count} items)</span>
            </h2>
            <button
              onClick={() => downloadCSV(key, items)}
              className="ml-3 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 border border-gray-300 rounded px-2 py-0.5 hover:border-blue-300"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            {count > 0 && isOpen && (() => {
              const cols = Object.keys(items[0]);
              const s = sort[key];
              let rows = items;
              if (s && !isObj) {
                rows = [...items].sort((a: any, b: any) => {
                  const av = a[s.col], bv = b[s.col];
                  if (av == null) return 1;
                  if (bv == null) return -1;
                  const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
                  return s.asc ? cmp : -cmp;
                });
              }
              return (
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        {cols.map(c => {
                          const active = s?.col === c;
                          return (
                            <th
                              key={c}
                              onClick={() => {
                                if (isObj) return;
                                setSort(prev => {
                                  const cur = prev[key];
                                  if (cur?.col === c) {
                                    if (cur.asc) return { ...prev, [key]: { col: c, asc: false } };
                                    return { ...prev, [key]: null };
                                  }
                                  return { ...prev, [key]: { col: c, asc: true } };
                                });
                              }}
                              className={`px-4 py-2 font-medium border-b whitespace-nowrap ${isObj ? '' : 'cursor-pointer select-none hover:bg-gray-200'}`}
                            >
                              <span className="inline-flex items-center gap-1">
                                {c}
                                {!isObj && (active ? s!.asc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />)}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: Record<string, unknown>, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {cols.map(c => (
                            <td key={c} className="px-4 py-2 border-b text-gray-700 max-w-xs truncate">{String(row[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
