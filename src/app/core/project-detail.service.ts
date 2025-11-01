import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type ProjectDto = { projectId: number; name: string; createdAt: string; tables: number; };
export type TableDto   = { tableId: number; projectId: number; name: string; createdAt: string; };
export type ColumnDto  = { columnId: number; tableId: number; name: string; dataType: string; isPrimary: boolean; isNullable: boolean; };
export type RowDto     = { rowId: number; tableId: number; data: string; createdAt: string; };

@Injectable({ providedIn: 'root' })
export class ProjectDetailService {
  private readonly base = '/api';

  /**
   * Keep @Optional so the app runs even if HttpClient isn't provided.
   * You have provideHttpClient() in app.config.ts, so it's already ready for backend.
   */
  constructor(@Optional() private http: HttpClient) {}

  // ===== MOCK REGION =======================================================
  // TODO(WIRE_BACKEND): Remove this whole region when wiring ASP.NET Core.
  private MOCK_PROJECT: ProjectDto = {
    projectId: 1, name: 'Sales Analytics', createdAt: new Date().toISOString(), tables: 2,
  };
  private MOCK_TABLES: TableDto[] = [
    { tableId: 101, projectId: 1, name: 'Products', createdAt: new Date().toISOString() },
    { tableId: 102, projectId: 1, name: 'Orders',   createdAt: new Date().toISOString() },
  ];
  private MOCK_COLUMNS_BY_TABLE: Record<number, ColumnDto[]> = {
    101: [
      { columnId: 1, tableId: 101, name: 'ProductId', dataType: 'int',    isPrimary: true,  isNullable: false },
      { columnId: 2, tableId: 101, name: 'Name',      dataType: 'text',   isPrimary: false, isNullable: false },
      { columnId: 3, tableId: 101, name: 'Price',     dataType: 'number', isPrimary: false, isNullable: false },
    ],
    102: [
      { columnId: 4, tableId: 102, name: 'OrderId',   dataType: 'int',    isPrimary: true,  isNullable: false },
      { columnId: 5, tableId: 102, name: 'ProductId', dataType: 'int',    isPrimary: false, isNullable: false },
      { columnId: 6, tableId: 102, name: 'Qty',       dataType: 'number', isPrimary: false, isNullable: false },
    ],
  };
  private MOCK_ROWS_BY_TABLE: Record<number, RowDto[]> = {
    101: [
      { rowId: 11, tableId: 101, data: JSON.stringify({ ProductId: 1, Name: 'Pen',  Price: 15 }), createdAt: new Date().toISOString() },
      { rowId: 12, tableId: 101, data: JSON.stringify({ ProductId: 2, Name: 'Book', Price: 80 }), createdAt: new Date().toISOString() },
    ],
    102: [
      { rowId: 21, tableId: 102, data: JSON.stringify({ OrderId: 9001, ProductId: 1, Qty: 2 }), createdAt: new Date().toISOString() },
    ],
  };
  // ========================================================================

  // PROJECTS
  getProject(projectId: number) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.get<ProjectDto>(`${this.base}/projects/${projectId}`);
    return of(this.MOCK_PROJECT).pipe(delay(150));
  }

  // TABLES
  listTables(projectId: number) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.get<TableDto[]>(`${this.base}/projects/${projectId}/tables`);
    return of(this.MOCK_TABLES).pipe(delay(150));
  }

  createTable(projectId: number, name: string) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.post<TableDto>(`${this.base}/tables`, { projectId, name });
    const dto: TableDto = {
      tableId: Math.floor(Math.random() * 1e9),
      projectId, name, createdAt: new Date().toISOString(),
    };
    this.MOCK_TABLES = [dto, ...this.MOCK_TABLES];
    this.MOCK_COLUMNS_BY_TABLE[dto.tableId] = [];
    this.MOCK_ROWS_BY_TABLE[dto.tableId] = [];
    return of(dto).pipe(delay(200));
  }

  renameTable(tableId: number, name: string) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.put<TableDto>(`${this.base}/tables/${tableId}`, { name });
    const idx = this.MOCK_TABLES.findIndex(t => t.tableId === tableId);
    if (idx >= 0) this.MOCK_TABLES[idx] = { ...this.MOCK_TABLES[idx], name };
    return of(this.MOCK_TABLES[idx]).pipe(delay(150));
  }

  deleteTable(tableId: number) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.delete<void>(`${this.base}/tables/${tableId}`);
    this.MOCK_TABLES = this.MOCK_TABLES.filter(t => t.tableId !== tableId);
    delete this.MOCK_COLUMNS_BY_TABLE[tableId];
    delete this.MOCK_ROWS_BY_TABLE[tableId];
    return of(void 0).pipe(delay(150));
  }

  // COLUMNS
  listColumns(tableId: number) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.get<ColumnDto[]>(`${this.base}/tables/${tableId}/columns`);
    return of(this.MOCK_COLUMNS_BY_TABLE[tableId] ?? []).pipe(delay(120));
  }

  // ROWS
  listRows(tableId: number, top = 5) {
    // TODO(WIRE_BACKEND): enable and delete mock
    // return this.http!.get<RowDto[]>(`${this.base}/tables/${tableId}/rows?take=${top}`);
    const rows = (this.MOCK_ROWS_BY_TABLE[tableId] ?? []).slice(0, top);
    return of(rows).pipe(delay(120));
  }


  
}
