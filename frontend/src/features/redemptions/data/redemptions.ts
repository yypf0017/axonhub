import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { redemptionApi, RedemptionGenerateResponse, RedemptionCode } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/use-error-handler';
import {
  Redemption,
  RedemptionList,
  CreateRedemptionInput,
  redemptionListSchema,
} from './schema';

// Mock Data
const MOCK_REDEMPTIONS: RedemptionList = {
  success: true,
  data: [
    {
      id: 99901,
      code: 'NEWYEAR2026-DEMO-001',
      quota: 1000,
      status: 'active',
      expires_at: new Date(Date.now() + 86400 * 30 * 1000).toISOString(),
      max_uses: 1,
      used_times: 0,
      voided: false,
      used_by: null,
      used_at: null,
      created_at: new Date(Date.now() - 86400 * 7 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 86400 * 7 * 1000).toISOString(),
      deleted_at: 0,
    },
    {
      id: 99902,
      code: 'BETA-TESTER-2026-002',
      quota: 500,
      status: 'used',
      expires_at: null,
      max_uses: 1,
      used_times: 1,
      voided: false,
      used_by: 1001,
      used_at: new Date(Date.now() - 86400 * 5 * 1000).toISOString(),
      created_at: new Date(Date.now() - 86400 * 30 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 86400 * 5 * 1000).toISOString(),
      deleted_at: 0,
    },
  ],
};

// Query hooks
export function useRedemptions(
  params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
  },
  options?: {
    disableAutoFetch?: boolean;
    useMockData?: boolean;
  }
) {
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  // Check localStorage for mock data preference
  const useMock = typeof window !== 'undefined'
    ? localStorage.getItem('USE_MOCK_REDEMPTION_DATA') === 'true' || options?.useMockData
    : options?.useMockData ?? false;

  return useQuery({
    queryKey: ['redemptions', params, useMock],
    queryFn: async () => {
      // Return mock data if requested
      if (useMock) {
        console.log('Using mock redemptions data');
        return MOCK_REDEMPTIONS;
      }

      try {
        const data = await redemptionApi.getRedemptions(params);
        console.log('Redemptions API response:', data);
        return redemptionListSchema.parse(data);
      } catch (error) {
        console.warn('Failed to fetch redemptions, falling back to mock data', error);
        handleError(error, t('redemptions.messages.loadError'));
        // Return mock data as fallback
        return MOCK_REDEMPTIONS;
      }
    },
    enabled: !options?.disableAutoFetch,
  });
}

// Mutation hooks
export function useCreateRedemption() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRedemptionInput) => {
      return await redemptionApi.generate(input);
    },
    onSuccess: (data: RedemptionGenerateResponse) => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success(t('redemptions.messages.createSuccess'));
      // Show generated codes?
      if (data.data && data.data.length > 0) {
        // Maybe copy to clipboard or show in a dialog
        // For now just toast
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`${t('redemptions.messages.createError')}: ${errorMessage}`);
    },
  });
}

export function useVoidRedemption() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return await redemptionApi.void(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success(t('redemptions.messages.updateSuccess'));
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`${t('redemptions.messages.updateError')}: ${errorMessage}`);
    },
  });
}

export function useDeleteRedemption() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await redemptionApi.delete([id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success(t('redemptions.messages.deleteSuccess'));
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`${t('redemptions.messages.deleteError')}: ${errorMessage}`);
    },
  });
}
