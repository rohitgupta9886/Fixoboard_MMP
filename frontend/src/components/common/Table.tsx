import React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyText = 'No records found',
  onRowClick,
  renderMobileCard,
  pagination,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card shadow-soft">
      {/* 1. Mobile Card Stream (< md) */}
      <div className="block md:hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold text-xs">Loading data...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-medium">{emptyText}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {data.map((row, index) => {
              if (renderMobileCard) {
                return (
                  <div
                    key={keyExtractor(row)}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={clsx(
                      'p-3.5 transition-colors',
                      onRowClick && 'active:bg-slate-100/70 dark:active:bg-slate-800/70 cursor-pointer'
                    )}
                  >
                    {renderMobileCard(row, index)}
                  </div>
                );
              }

              // Default automatic responsive mobile card presentation
              return (
                <div
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    'p-3.5 space-y-2 transition-colors',
                    onRowClick && 'active:bg-slate-100/70 dark:active:bg-slate-800/70 cursor-pointer'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      #{index + 1}
                    </span>
                    {columns[0] && (
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 text-right truncate">
                        {columns[0].render ? columns[0].render(row, index) : (row as any)[columns[0].key]}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {columns.slice(1).map((col) => (
                      <div key={col.key} className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate">
                          {col.header}
                        </span>
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate mt-0.5">
                          {col.render ? col.render(row, index) : (row as any)[col.key]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Desktop Tabular Grid (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4.5 py-3.5 whitespace-nowrap font-bold',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold text-xs">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                    <p className="text-sm font-medium">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={clsx(
                    'transition-colors duration-150',
                    onRowClick ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/70' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-4.5 py-3.5 text-slate-800 dark:text-slate-200 font-medium',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, index) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 flex-wrap">
          <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-slate-200">{Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}</span>–<span className="font-bold text-slate-900 dark:text-slate-200">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-200">{pagination.total}</span>
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <span className="text-[11px] sm:text-xs font-num font-bold px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              icon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

