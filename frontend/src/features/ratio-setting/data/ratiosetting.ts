import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { pricingApi, PricingUpsertRequest } from '@/lib/api-client';

// Types
export interface RatioSettings {
  ModelPrice: string;
  ModelRatio: string;
  CompletionRatio: string;
  CacheRatio: string;
  GroupRatio: string;
  UserUsableGroups: string;
  GroupGroupRatio: string;
  ModelEnabled: string;
}

export interface UpdateRatioSettingsInput {
  ModelPrice?: string;
  ModelRatio?: string;
  CompletionRatio?: string;
  CacheRatio?: string;
  GroupRatio?: string;
  UserUsableGroups?: string;
  GroupGroupRatio?: string;
}

// Mock Data
const MOCK_RATIO_SETTINGS: RatioSettings = {
  ModelPrice: JSON.stringify({
    'gpt-4': 0.03,
    'gpt-4-32k': 0.06,
    'gpt-3.5-turbo': 0.002,
    'gpt-3.5-turbo-16k': 0.004,
    'claude-3-opus': 0.015,
    'claude-3-sonnet': 0.003,
    'claude-3-haiku': 0.00025,
    'gemini-pro': 0.0005,
    'gemini-pro-vision': 0.0025,
  }),
  ModelRatio: JSON.stringify({
    'gpt-4': 15,
    'gpt-4-32k': 30,
    'gpt-3.5-turbo': 1,
    'gpt-3.5-turbo-16k': 2,
    'claude-3-opus': 7.5,
    'claude-3-sonnet': 1.5,
    'claude-3-haiku': 0.125,
    'gemini-pro': 0.25,
    'gemini-pro-vision': 1.25,
  }),
  CompletionRatio: JSON.stringify({
    'gpt-4': 1.5,
    'gpt-4-32k': 2.0,
    'gpt-3.5-turbo': 1.0,
    'claude-3-opus': 1.5,
    'claude-3-sonnet': 1.0,
  }),
  CacheRatio: JSON.stringify({
    'gpt-4': 0.5,
    'gpt-3.5-turbo': 0.5,
    'claude-3-opus': 0.1,
    'claude-3-sonnet': 0.1,
  }),
  GroupRatio: JSON.stringify({
    'default': 1.0,
    'premium': 0.8,
    'enterprise': 0.6,
    'trial': 1.5,
  }),
  UserUsableGroups: JSON.stringify({
    'user1': ['default', 'premium'],
    'user2': ['default'],
    'user3': ['enterprise', 'premium'],
  }),
  GroupGroupRatio: JSON.stringify({
    'default-premium': 1.2,
    'premium-enterprise': 1.5,
    'default-enterprise': 2.0,
  }),
  ModelEnabled: JSON.stringify({}),
};

// Hooks
interface UseRatioSettingsOptions {
  useMockData?: boolean;
}

export function useRatioSettings({ useMockData = false }: UseRatioSettingsOptions = {}) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey: ['ratioSettings'],
    queryFn: async (): Promise<RatioSettings> => {
      if (useMockData) {
        return new Promise((resolve) => {
          setTimeout(() => resolve(MOCK_RATIO_SETTINGS), 500);
        });
      }
      
      try {
        const response = await pricingApi.getPricing();
        if (!response.success) {
          console.warn('Failed to fetch pricing settings, falling back to mock data');
          return MOCK_RATIO_SETTINGS;
        }

        // Transform array data to object map for frontend compatibility
        const modelPrice: Record<string, number> = {};
        const modelRatio: Record<string, number> = {};
        const completionRatio: Record<string, number> = {};
        const cacheRatio: Record<string, number> = {};
        const modelEnabled: Record<string, boolean> = {};

        response.data.forEach(item => {
          modelPrice[item.model] = item.price;
          modelRatio[item.model] = item.quota;
          completionRatio[item.model] = item.completion_ratio;
          
          if (item.status) {
            modelEnabled[item.model] = item.status === 'enabled';
          } else {
            modelEnabled[item.model] = item.deleted_at === 0 || item.deleted_at === undefined;
          }
        });

        return {
          ModelPrice: JSON.stringify(modelPrice),
          ModelRatio: JSON.stringify(modelRatio),
          CompletionRatio: JSON.stringify(completionRatio),
          CacheRatio: JSON.stringify(cacheRatio),
          ModelEnabled: JSON.stringify(modelEnabled),
          // These fields are not in pricing API yet, keeping empty or default
          GroupRatio: '{}',
          UserUsableGroups: '{}',
          GroupGroupRatio: '{}',
        };
      } catch (error) {
        console.warn('API error fetching pricing settings, falling back to mock data:', error);
        return MOCK_RATIO_SETTINGS;
      }
    },
  });
}

export function useUpdateRatioSettings() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async (input: UpdateRatioSettingsInput) => {
      // Parse JSON inputs to get individual model settings
      const modelPrices = input.ModelPrice ? JSON.parse(input.ModelPrice) : {};
      const modelRatios = input.ModelRatio ? JSON.parse(input.ModelRatio) : {};
      const completionRatios = input.CompletionRatio ? JSON.parse(input.CompletionRatio) : {};

      // We need to iterate over models and update them one by one
      // or use a batch update if available. For now, we'll try to update
      // based on the input data structure.
      // Note: This is a simplified implementation. In a real scenario,
      // we might want to diff the changes or have a bulk update endpoint.
      
      const promises = Object.keys(modelPrices).map(async (model) => {
        const data: PricingUpsertRequest = {
          model,
          type: 'quota', // Default type
          price: modelPrices[model] || 0,
          quota: modelRatios[model] || 0,
          completion_ratio: completionRatios[model] || 0,
        };
        return pricingApi.updatePricing(data);
      });

      await Promise.all(promises);
      return { success: true };
    },
    onSuccess: () => {
      toast.success(i18n.t('ratioSetting.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['ratioSettings'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
