import 'server-only';
import { getAccountsSafe, getCurrencies } from '@/server/firefly/queries';

/** Everything the recurrence form's pickers need, fetched once. */
export async function loadRecurrenceFormData() {
  const [assets, expenses, revenues, currencies] = await Promise.all([
    getAccountsSafe({ type: 'asset', limit: 200 }),
    getAccountsSafe({ type: 'expense', limit: 200 }),
    getAccountsSafe({ type: 'revenue', limit: 200 }),
    getCurrencies(),
  ]);

  const map = (list: typeof assets.data) =>
    list.map((account) => ({
      id: account.id,
      name: account.attributes.name,
      type: account.attributes.type,
    }));

  return {
    assetAccounts: map(assets.data),
    expenseAccounts: map(expenses.data),
    revenueAccounts: map(revenues.data),
    currencies: currencies.data
      .filter((currency) => currency.attributes.enabled)
      .map((currency) => ({ code: currency.attributes.code, name: currency.attributes.name })),
  };
}
