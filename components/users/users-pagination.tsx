'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface UsersPaginationProps {
  currentPage: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  isLoading?: boolean
}

export function UsersPagination({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: UsersPaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  const handleFirstPage = () => onPageChange(1)
  const handlePrevPage = () => onPageChange(Math.max(1, currentPage - 1))
  const handleNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1))
  const handleLastPage = () => onPageChange(totalPages)

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Mostrar:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            onPageSizeChange(Number(value))
            onPageChange(1)
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">por página</span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleFirstPage}
          disabled={!canGoPrev || isLoading}
          title="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevPage}
          disabled={!canGoPrev || isLoading}
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Info */}
        <div className="flex items-center gap-2 px-2">
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={!canGoNext || isLoading}
          title="Siguiente página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleLastPage}
          disabled={!canGoNext || isLoading}
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Empty space for alignment */}
      <div className="w-0 sm:w-auto" />
    </div>
  )
}
