import { Injectable, signal, computed } from '@angular/core';

export type Project = {
  id: string;
  name: string;
  updatedAt: string; 
  tables: number;
  favorite?: boolean;
};

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly _list = signal<Project[]>([
    { id: crypto.randomUUID(), name: 'Marketing Campaign 2025', updatedAt: new Date().toISOString(), tables: 15, favorite: true },
    { id: crypto.randomUUID(), name: 'Sales Analytics',          updatedAt: new Date().toISOString(), tables: 8,  favorite: false },
  ]);

  /** signal ที่ให้อ่านได้จาก component */
  readonly list = computed(() => this._list());

  add(name: string) {
    const p: Project = { id: crypto.randomUUID(), name, updatedAt: new Date().toISOString(), tables: 0, favorite: false };
    this._list.update(arr => [p, ...arr]);
  }

  remove(id: string) {
    this._list.update(arr => arr.filter(p => p.id !== id));
  }

  removeMany(ids: string[]) {
    const set = new Set(ids);
    this._list.update(arr => arr.filter(p => !set.has(p.id)));
  }

  toggleFavorite(id: string) {
    this._list.update(arr =>
      arr.map(p => (p.id === id ? { ...p, favorite: !p.favorite } : p))
    );
  }

  /** export CSV จาก list ปัจจุบัน */
  downloadCSV(rows: Project[]) {
    const header = ['id','name','updatedAt','tables','favorite'];
    const csv = [
      header.join(','),
      ...rows.map(r => [r.id, this.escape(r.name), r.updatedAt, String(r.tables), String(!!r.favorite)].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'projects.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private escape(s: string) {
    const needs = /[" ,\n]/.test(s);
    return needs ? `"${s.replace(/"/g, '""')}"` : s;
  }

  rename(id: string, name: string) {
  this._list.update(arr =>
    arr.map(p => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p))
  );
}
}
