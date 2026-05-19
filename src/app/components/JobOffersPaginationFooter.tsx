import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

export type VisiblePageItem = number | "...";

function buildVisiblePages(page: number, totalPages: number): VisiblePageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const lastPage = totalPages - 1;
  if (page <= 2) {
    return [0, 1, 2, "...", lastPage];
  }

  if (page >= lastPage - 2) {
    return [0, "...", lastPage - 2, lastPage - 1, lastPage];
  }

  return [0, "...", page - 1, page, page + 1, "...", lastPage];
}

export function JobOffersPaginationFooter({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  onSizeChange,
}: {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  onSizeChange: (nextSize: number) => void;
}) {
  const { t } = useTranslation();
  const safeTotalPages = Math.max(1, totalPages);
  const visiblePages = useMemo(() => buildVisiblePages(page, safeTotalPages), [page, safeTotalPages]);

  return (
    <div className="flex items-center justify-between w-full pt-4 border-t border-gray-200">
      <div className="flex items-center gap-2 text-gray-700" style={{ fontSize: 13 }}>
        <span>{t("common.labels.rowsPerPage")}</span>
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]/20"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-gray-500">{t("common.labels.total", { count: totalElements })}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label={t("common.actions.previous")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {visiblePages.map((pageItem, index) => {
          if (pageItem === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            );
          }

          const isActive = pageItem === page;
          return (
            <button
              key={pageItem}
              onClick={() => onPageChange(pageItem)}
              className={`h-9 min-w-9 rounded-md border px-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#ED1C24] text-white border-[#ED1C24]"
                  : "text-gray-700 hover:bg-gray-50 border-gray-300"
              }`}
            >
              {pageItem + 1}
            </button>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          disabled={page >= safeTotalPages - 1}
          onClick={() => onPageChange(Math.min(safeTotalPages - 1, page + 1))}
          aria-label={t("common.actions.next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
