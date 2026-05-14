import { cn } from '@/utils/cn';
import { useState, useRef, type ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Loader2, Star, X, Check, AlertCircle, Search, ChevronUp, ChevronDown, ChevronsUpDown, Upload } from 'lucide-react';

// ─── Button ────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-400',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
    success: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          error ? 'border-danger-400 bg-danger-50' : 'border-gray-300 hover:border-gray-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ─── Select ────────────────────────────────────────────────
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          error ? 'border-danger-400 bg-danger-50' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}

// ─── Textarea ──────────────────────────────────────────────
interface TextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none',
          error ? 'border-danger-400 bg-danger-50' : 'border-gray-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', onClick && 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────
const badgeStyles: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-600',
  accepted: 'bg-primary-100 text-primary-700',
  'in_progress': 'bg-purple-100 text-purple-700',
  completed: 'bg-accent-100 text-accent-700',
  cancelled: 'bg-danger-100 text-danger-700',
  CUSTOMER: 'bg-blue-100 text-blue-700',
  PROVIDER: 'bg-green-100 text-green-700',
  ADMIN: 'bg-red-100 text-red-700',
  CUSTOMER_SERVICE: 'bg-purple-100 text-purple-700',
};

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  const text = typeof children === 'string' ? children : '';
  const style = badgeStyles[text] || 'bg-gray-100 text-gray-700';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', style, className)}>
      {children}
    </span>
  );
}

// ─── Star Rating ───────────────────────────────────────────
export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(sizeClass, i <= Math.round(rating) ? 'star-filled fill-current' : 'star-empty')} />
      ))}
      <span className="ml-1 text-sm text-gray-600 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-primary-500', 'bg-accent-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-teal-500'];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;

  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', sizeMap[size], colors[colorIndex], className)}>
      {initials}
    </div>
  );
}

// ─── Page Header ───────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Skeleton Loader ───────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function ServiceCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </Card>
  );
}

// ─── Modal ─────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Notification Toast ────────────────────────────────────
export function NotificationToast({ notifications, onRemove }: { notifications: { id: number; message: string; type: string }[]; onRemove: (id: number) => void }) {
  if (notifications.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(n => (
        <div key={n.id} className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in min-w-[280px]',
          n.type === 'success' ? 'bg-accent-600' : n.type === 'error' ? 'bg-danger-600' : 'bg-primary-600'
        )}>
          {n.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : n.type === 'error' ? <X className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{n.message}</span>
          <button onClick={() => onRemove(n.id)} className="p-0.5 hover:bg-white/20 rounded"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Service Image ─────────────────────────────────────────
export function ServiceImage({ image, name, fallback, className }: { image?: string | null; name: string; fallback?: ReactNode; className?: string }) {
  const [hasError, setHasError] = useState(false);
  const prevImage = useRef(image);
  if (prevImage.current !== image) {
    prevImage.current = image;
    if (hasError) setHasError(false);
  }
  if (!image || hasError) {
    return fallback ? <>{fallback}</> : (
      <div className={cn('bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-4xl font-bold text-white', className)}>
        {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
    );
  }
  return (
    <div className={cn('relative overflow-hidden bg-gray-200', className)}>
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

// ─── Image Upload ─────────────────────────────────────────
export function ImageUpload({ value, onChange, label, error }: { value: string; onChange: (dataUrl: string) => void; label?: string; error?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      onChange(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = URL.createObjectURL(file);
  };
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />}
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Upload className="w-4 h-4" />{value ? 'Change' : 'Upload'}
        </button>
        {value && <button type="button" onClick={() => onChange('')} className="text-sm text-danger-600 hover:underline">Remove</button>}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────
export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  sortKey?: string; // Optional key for sorting if accessor is a function
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  isLoading,
  emptyState,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    let key = '';
    if (typeof column.accessor === 'string') {
      key = column.accessor as string;
    } else if (column.sortKey) {
      key = column.sortKey;
    } else {
      return;
    }

    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key, direction });
  };

  const filteredData = (data || []).filter(item => {
    if (!searchQuery) return true;
    return columns.some(col => {
      if (col.searchable === false) return false;
      let value: any;
      if (typeof col.accessor === 'string') {
        value = item[col.accessor];
      } else {
        return Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return String(value).toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Card className="p-0 overflow-hidden">
          <div className="animate-pulse space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: columns.length }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
      </div>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 font-medium text-gray-600 transition-colors',
                    col.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                    col.className
                  )}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <div className="text-gray-400">
                        {sortConfig.key === (typeof col.accessor === 'string' ? col.accessor : col.sortKey) ? (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-primary-600" /> : <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.length > 0 ? (
              sortedData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, j) => (
                    <td key={j} className={cn('px-4 py-3 text-gray-700', col.className)}>
                      {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor as string]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyState || (
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p>No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}


