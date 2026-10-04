import React, { forwardRef } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

// ─── Table Container ─────────────────────────────────────────────────────────
export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  wrapper?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className = "", containerClassName = "", wrapper = true, children, ...props }, ref) => {
    const tableElement = (
      <table
        ref={ref}
        className={`ll-table ${className}`}
        {...props}
      >
        {children}
      </table>
    );

    if (!wrapper) {
      return tableElement;
    }

    return (
      <div className={`ll-table-wrap ${containerClassName}`}>
        {tableElement}
      </div>
    );
  },
);
Table.displayName = "Table";

// ─── TableHeader ─────────────────────────────────────────────────────────────
export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = "", children, ...props }, ref) => (
    <thead ref={ref} className={className} {...props}>
      {children}
    </thead>
  ),
);
TableHeader.displayName = "TableHeader";

// ─── TableBody ───────────────────────────────────────────────────────────────
export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = "", children, ...props }, ref) => (
    <tbody ref={ref} className={className} {...props}>
      {children}
    </tbody>
  ),
);
TableBody.displayName = "TableBody";

// ─── TableFooter ─────────────────────────────────────────────────────────────
export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className = "", children, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={`border-t border-[var(--border)] bg-[var(--surface-hover)] font-medium ${className}`}
      {...props}
    >
      {children}
    </tfoot>
  ),
);
TableFooter.displayName = "TableFooter";

// ─── TableRow ────────────────────────────────────────────────────────────────
export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
  selected?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = "", interactive = true, selected = false, children, ...props }, ref) => (
    <tr
      ref={ref}
      className={[
        interactive ? "interactive" : "",
        selected ? "!bg-[var(--primary-soft)]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </tr>
  ),
);
TableRow.displayName = "TableRow";

// ─── TableHead ───────────────────────────────────────────────────────────────
export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      className = "",
      sortable = false,
      sortDirection = null,
      onSort,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <th
        ref={ref}
        onClick={sortable ? onSort : undefined}
        className={[
          sortable ? "sortable" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <div className="flex items-center gap-1.5">
          <span>{children}</span>
          {sortable && (
            <span className="inline-flex shrink-0">
              {sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-[var(--primary)]" />
              ) : sortDirection === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5 text-[var(--primary)]" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
              )}
            </span>
          )}
        </div>
      </th>
    );
  },
);
TableHead.displayName = "TableHead";

// ─── TableCell ───────────────────────────────────────────────────────────────
export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  mono?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = "", mono = false, children, ...props }, ref) => (
    <td
      ref={ref}
      className={[
        mono ? "mono" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </td>
  ),
);
TableCell.displayName = "TableCell";

// ─── TableCaption ────────────────────────────────────────────────────────────
export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className = "", children, ...props }, ref) => (
    <caption
      ref={ref}
      className={`mt-4 text-sm text-[var(--text-muted)] ${className}`}
      {...props}
    >
      {children}
    </caption>
  ),
);
TableCaption.displayName = "TableCaption";

// ─── TableEmpty ──────────────────────────────────────────────────────────────
export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = "Không có dữ liệu",
  icon,
}) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-12 text-center text-[var(--text-muted)]"
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          {icon && <div className="text-[var(--text-subtle)]">{icon}</div>}
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
};
TableEmpty.displayName = "TableEmpty";

export default Table;
