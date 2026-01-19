import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, History } from 'lucide-react';
import { useRedeemCode } from '../data/topup';
import { useMe } from '@/features/auth/data/auth';
import { toast } from 'sonner';

interface RechargeCardProps {
  onOpenHistory: () => void;
}

export function RechargeCard({ onOpenHistory }: RechargeCardProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const { mutate: redeem, isPending } = useRedeemCode();
  const { data: user } = useMe();

  const handleRedeem = () => {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      toast.error(t('topup.redeem.emptyCode') || 'Please enter a redeem code');
      return;
    }

    // Basic format validation - adjust based on your actual code format
    if (trimmedCode.length < 6) {
      toast.error(t('topup.redeem.invalidFormat') || 'Invalid code format');
      return;
    }

    redeem(trimmedCode, {
      onSuccess: () => {
        setCode('');
      },
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <Button variant="outline" size="sm" onClick={onOpenHistory} className="gap-2">
          <History className="h-4 w-4" />
          {t('topup.history.title')}
        </Button>
        </div>
        
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">{t('topup.balance')}</Label>
            <div className="text-3xl font-bold tracking-tight">
              ${(user as any)?.quota?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redeem-code">{t('topup.redeem.title')}</Label>
            <div className="flex space-x-2">
              <Input
                id="redeem-code"
                placeholder={t('topup.redeem.placeholder')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code && !isPending) {
                    handleRedeem();
                  }
                }}
                disabled={isPending}
                aria-label={t('topup.redeem.inputLabel') || 'Redeem code'}
              />
              <Button onClick={handleRedeem} disabled={isPending || !code}>
                {isPending ? t('common.processing') : t('topup.redeem.button')}
              </Button>
            </div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
