import React from "react";
import "./css/SlipPagination.css"

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * SlipPagination
 *
 * Stateless pagination control.
 * Responsible ONLY for:
 * - deciding which page numbers to show
 * - rendering buttons
 * - emitting page changes
 */
const SlipPagination: React.FC<Props> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  // Nothing to render if there is only one page
  if (totalPages <= 1) return null;

  /**
   * Build the list of page "tokens" to render.
   * Tokens can be:
   * - number (page)
   * - "ellipsis"
   */
  const buildPages = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];

    const add = (value: number | "ellipsis") => {
      pages.push(value);
    };

    // Always show first page
    add(1);

    // Left ellipsis
    if (page > 3) {
      add("ellipsis");
    }

    // Pages around current page
    for (let p = page - 1; p <= page + 1; p++) {
      if (p > 1 && p < totalPages) {
        add(p);
      }
    }

    // Right ellipsis
    if (page < totalPages - 2) {
      add("ellipsis");
    }

    // Always show last page
    if (totalPages > 1) {
      add(totalPages);
    }

    return pages;
  };

  const pages = buildPages();

  return (
  <div className="slip-search-pagination">
    {pages.map((p, idx) => {
      if (p === "ellipsis") {
        return (
          <span
            key={`ellipsis-${idx}`}
            className="slip-search-pagination-ellipsis"
          >
            …
          </span>
        );
      }

      const isActive = p === page;

      return (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          disabled={isActive}
          className={`slip-search-pagination-button ${
            isActive ? "active" : ""
          }`}
        >
          {p}
        </button>
      );
    })}
  </div>
);
};

export default SlipPagination;
