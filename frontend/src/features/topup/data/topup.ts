import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/gql/graphql';
import { GET_TOPUP_HISTORY_QUERY, REDEEM_CODE_MUTATION } from '@/gql/topup';
import { topupHistoryConnectionSchema } from './schema';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks/use-error-handler';

export function useTopupHistory(args: {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}) {
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['topupHistory', args],
    queryFn: async () => {
      try {
        const data = await graphqlRequest(GET_TOPUP_HISTORY_QUERY, args);
        return topupHistoryConnectionSchema.parse(data.topupHistory);
      } catch (error) {
        handleError(error, t('topup.history.loadError') || 'Failed to load history');
        throw error;
      }
    },
  });
}

export function useRedeemCode() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (code: string) => {
      return graphqlRequest(REDEEM_CODE_MUTATION, { code });
    },
    onSuccess: (data) => {
      if (data.redeemCode.success) {
        toast.success(t('topup.redeem.success'));
        queryClient.invalidateQueries({ queryKey: ['me'] }); // Refresh user balance
        queryClient.invalidateQueries({ queryKey: ['topupHistory'] });
      } else {
        toast.error(data.redeemCode.message || t('topup.redeem.error'));
      }
    },
    onError: (error: unknown) => {
      toast.error(t('topup.redeem.error'));
      handleError(error);
    },
  });
}
