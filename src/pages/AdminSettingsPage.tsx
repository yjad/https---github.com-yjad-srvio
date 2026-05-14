import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/api/mockApi';
import { Card, PageHeader, Button } from '@/components/shared';
import { Settings, Save, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => mockApi.getSystemSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => mockApi.updateSystemSettings(data),
    onSuccess: () => {
      mockApi.addNotification?.('System settings updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded mb-8"></div>
        <div className="h-96 bg-gray-100 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader 
        title="System Parameters" 
        subtitle="Manage platform-wide financial and operational settings" 
      />

      <div className="grid gap-6">
        <Card className="p-0 overflow-hidden border-primary-100">
          <div className="bg-primary-50 p-4 border-b border-primary-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">Financial Configuration</h3>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              reservationPercentage: Number(formData.get('reservationPercentage')),
              commissionTaxPercentage: Number(formData.get('commissionTaxPercentage')),
              platformCommissionPercentage: Number(formData.get('platformCommissionPercentage')),
              payoutDelayDays: Number(formData.get('payoutDelayDays')),
              customerFreeCancellationHours: Number(formData.get('customerFreeCancellationHours')),
              vendorFreeCancellationHours: Number(formData.get('vendorFreeCancellationHours')),
              customerLateCancellationFee: Number(formData.get('customerLateCancellationFee')),
              vendorLateCancellationFee: Number(formData.get('vendorLateCancellationFee')),
            };
            updateSettingsMutation.mutate(data);
          }} className="p-6">
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Reservation Percentage (%)</label>
                <div className="relative">
                  <input name="reservationPercentage" type="number" step="0.1" defaultValue={systemSettings?.reservationPercentage} className="w-full border rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500">Upfront payment required from customer upon acceptance.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Commission Tax Percentage (%)</label>
                <div className="relative">
                  <input name="commissionTaxPercentage" type="number" step="0.1" defaultValue={systemSettings?.commissionTaxPercentage} className="w-full border rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500">Tax applied to the platform commission (paid by provider).</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Platform Commission (%)</label>
                <div className="relative">
                  <input name="platformCommissionPercentage" type="number" step="0.1" defaultValue={systemSettings?.platformCommissionPercentage} className="w-full border rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-500">Fee deducted by the platform from each completed job.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payout Delay (Days)</label>
                <div className="relative">
                  <input name="payoutDelayDays" type="number" defaultValue={systemSettings?.payoutDelayDays} className="w-full border rounded-lg pl-3 pr-14 py-2 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">DAYS</span>
                </div>
                <p className="text-xs text-gray-500">Holding period before funds become available for provider payout.</p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 mb-8">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">Cancellation Policy</p>
                <p className="text-xs text-amber-700 mt-1">Changes to cancellation windows will affect new bookings only.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Free Cancel (Hours)</label>
                <input name="customerFreeCancellationHours" type="number" defaultValue={systemSettings?.customerFreeCancellationHours} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Provider Free Cancel (Hours)</label>
                <input name="vendorFreeCancellationHours" type="number" defaultValue={systemSettings?.vendorFreeCancellationHours} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Late Cancel Fee ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input name="customerLateCancellationFee" type="number" defaultValue={systemSettings?.customerLateCancellationFee} className="w-full border rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Provider Late Cancel Fee ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input name="vendorLateCancellationFee" type="number" defaultValue={systemSettings?.vendorLateCancellationFee} className="w-full border rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t pt-6">
              <Button type="submit" loading={updateSettingsMutation.isPending} icon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 bg-gray-50 border-dashed border-2 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Need to reset everything?</h4>
            <p className="text-sm text-gray-500 mt-1">This will restore all parameters to their original factory defaults.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            if (confirm('Are you sure you want to reset all system parameters?')) {
              updateSettingsMutation.mutate({
                reservationPercentage: 20,
                commissionTaxPercentage: 13,
                platformCommissionPercentage: 10,
                payoutDelayDays: 7,
                customerFreeCancellationHours: 24,
                vendorFreeCancellationHours: 48,
                customerLateCancellationFee: 50,
                vendorLateCancellationFee: 50,
              });
            }
          }}>
            Reset Defaults
          </Button>
        </Card>
      </div>
    </div>
  );
}
