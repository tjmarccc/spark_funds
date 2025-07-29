import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { Wallet, Plus, Minus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Minimum amount is 0.01 ICP'),
});

export default function WalletPage() {
  const { currentUser, depositFunds, withdrawFunds, transactions } = useApp();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: 0 },
  });

  const handleDeposit = (data: z.infer<typeof transactionSchema>) => {
    depositFunds(data.amount);
    toast.success(`Successfully deposited ${data.amount} ICP`);
    form.reset();
  };

  const handleWithdraw = (data: z.infer<typeof transactionSchema>) => {
    if (withdrawFunds(data.amount)) {
      toast.success(`Successfully withdrew ${data.amount} ICP`);
      form.reset();
    } else {
      toast.error('Insufficient balance');
    }
  };

  if (!currentUser) return null;

  const userTransactions = transactions
    .filter(t => t.userId === currentUser.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your ICP balance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {currentUser.walletBalance.toFixed(2)} ICP
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === 'deposit' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('deposit')}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Deposit
                </Button>
                <Button
                  variant={activeTab === 'withdraw' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('withdraw')}
                  className="flex-1"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(activeTab === 'deposit' ? handleDeposit : handleWithdraw)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (ICP)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {activeTab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userTransactions.length > 0 ? (
              userTransactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} ICP
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}