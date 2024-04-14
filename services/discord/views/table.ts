interface TableBuilderOptions<T> {
  sortBy?: (keyof T)[];
  sortDirection?: 'asc' | 'desc';
}

const defaultOptions: TableBuilderOptions<any> = {
  sortDirection: 'asc',
};

interface IColumn<T> {
  index: number;
  label: string;
  width: number;
  field: keyof T;
  format?: (content: T[keyof T]) => string;
}

export class TableBuilder<T extends Record<string, any>> {
  private readonly _columns: IColumn<T>[];

  private readonly _items: T[];

  private readonly _options: TableBuilderOptions<T>;

  constructor(columns?: IColumn<T>[], options?: TableBuilderOptions<T>) {
    this._columns = [];
    if (columns) {
      this._columns.push(...columns);
    }

    this._items = [];

    this._options = options ? { ...defaultOptions, ...options } : defaultOptions;
  }

  private static _createIndexColumn<T>(): IColumn<T> {
    return {
      index: 0,
      label: '#',
      width: 4,
      field: '#' as keyof T,
    };
  }

  addRows(...rows: T[]): void {
    rows.forEach((row) => this._items.push(row));
  }

  build(): string {
    let result = `\`${this._buildRow(this._createHeader())}\n`;
    result += ''.padEnd(this._totalWidth(), '―');

    if (this._options.sortBy) {
      this._sortRows();
    }

    this._items.forEach((row, index) => {
      result += `\n${this._buildRow(row, index + 1)}`;
    });

    return `${result}\``;
  }

  private _buildRow(data: T, index?: number): string {
    const keys = Object.keys(data).filter((key) => this._columns.find((col) => col.field === key));

    keys.sort((keyA, keyB) => {
      const colA = this._columns.find((col) => col.field === keyA)!;
      const colB = this._columns.find((col) => col.field === keyB)!;
      return colA.index - colB.index;
    });

    let result = ''
    keys.forEach((key) => {
      const column = this._columns.find((col) => col.field === key)!;


      let content = data[key];
      if (column.format && index) {
        content = column.format(data[key]);
      }

      result += String(content).padEnd(column.width);
    });

    return result;
  }

  private _createHeader(): T {
    const header: T = {} as T;

    this._columns.forEach((col) => {
      if (typeof col.field === 'string') {
        header[col.field as keyof T] = col.label as unknown as T[keyof T];
      }
    });

    return header;
  }

  private _totalWidth(): number {
    return this._columns.reduce((total, col) => total + col.width, 0);
  }

  private _sortRows(): void {
    this._items.sort((a, b) => {
      let diff = 0;

      for (const columnField of this._options.sortBy || []) {
        const field = this._columns.find((col) => col.field === columnField)!.field;
        diff = this._compareValues(a[field], b[field]);

        if (diff !== 0) {break;}
      }

      return diff;
    });
  }

  private _compareValues(a: any, b: any): number {
    if (this._options.sortDirection === 'desc') {
      [a, b] = [b, a];
    }

    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    } if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    } if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    return 0;
  }
}
