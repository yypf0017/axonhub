import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TopupHistoryTable } from './topup-history-table';
import { createColumns } from './topup-history-columns';
import { useTopupHistory } from '../data/topup';
import { usePaginationSearch } from '@/hooks/use-pagination-search';

interface TopupHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopupHistory({ open, onOpenChange }: TopupHistoryProps) {
  const { t } = useTranslation();
  const { pageSize, setCursors, setPageSize, paginationArgs } = usePaginationSearch({
    defaultPageSize: 10,
    pageSizeStorageKey: 'topup-history-page-size',
  });

  const { data, isLoading } = useTopupHistory(paginationArgs);

  const columns = useMemo(() => createColumns(t), [t]);

  const handleNextPage = () => {
    if (data?.pageInfo?.hasNextPage && data?.pageInfo?.endCursor) {
      setCursors(data.pageInfo.startCursor ?? undefined, data.pageInfo.endCursor ?? undefined, 'after');
    }
  };

  const handlePreviousPage = () => {
    if (data?.pageInfo?.hasPreviousPage) {
      setCursors(data.pageInfo.startCursor ?? undefined, data.pageInfo.endCursor ?? undefined, 'before');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('topup.history.title')}</DialogTitle>
          <DialogDescription>{t('topup.history.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <TopupHistoryTable
            data={data?.edges?.map((edge) => edge.node) || []}
            columns={columns}
            loading={isLoading}
            pageInfo={data?.pageInfo}
            pageSize={pageSize}
            totalCount={data?.totalCount}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
