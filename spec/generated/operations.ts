/* eslint-disable */
// Generated from spec/firefly-iii-v1.yaml (v6.5.5).
// Run `pnpm spec:codegen` to regenerate. Do not edit.

export const FIREFLY_SPEC_VERSION = "v6.5.5" as const;

export type FireflyHttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type FireflyTag = "about" | "accounts" | "attachments" | "autocomplete" | "available_budgets" | "bills" | "budgets" | "categories" | "charts" | "configuration" | "currencies" | "currency_exchange_rates" | "data" | "insight" | "links" | "object_groups" | "piggy_banks" | "preferences" | "recurrences" | "rule_groups" | "rules" | "search" | "summary" | "tags" | "transactions" | "user_groups" | "users" | "webhooks";

export interface FireflyOperation {
  readonly path: string;
  readonly method: FireflyHttpMethod;
  readonly operationId: string;
  readonly tag: FireflyTag;
  readonly summary: string;
  /** Anchored regex matching a concrete request path. */
  readonly pattern: string;
  /** Denied by the proxy unless explicitly enabled (docs/PROJECT_PLAN.md §4.3). */
  readonly guarded: boolean;
}

export const FIREFLY_TAGS = [
  "about",
  "accounts",
  "attachments",
  "autocomplete",
  "available_budgets",
  "bills",
  "budgets",
  "categories",
  "charts",
  "configuration",
  "currencies",
  "currency_exchange_rates",
  "data",
  "insight",
  "links",
  "object_groups",
  "piggy_banks",
  "preferences",
  "recurrences",
  "rule_groups",
  "rules",
  "search",
  "summary",
  "tags",
  "transactions",
  "user_groups",
  "users",
  "webhooks"
] as const;

export const FIREFLY_OPERATIONS: readonly FireflyOperation[] = [
  {
    "path": "/v1/about",
    "method": "get",
    "operationId": "getAbout",
    "tag": "about",
    "summary": "System information end point.",
    "pattern": "^/v1/about$",
    "guarded": false
  },
  {
    "path": "/v1/about/user",
    "method": "get",
    "operationId": "getCurrentUser",
    "tag": "about",
    "summary": "Currently authenticated user endpoint.",
    "pattern": "^/v1/about/user$",
    "guarded": false
  },
  {
    "path": "/v1/accounts",
    "method": "get",
    "operationId": "listAccount",
    "tag": "accounts",
    "summary": "List all accounts.",
    "pattern": "^/v1/accounts$",
    "guarded": false
  },
  {
    "path": "/v1/accounts",
    "method": "post",
    "operationId": "storeAccount",
    "tag": "accounts",
    "summary": "Create new account.",
    "pattern": "^/v1/accounts$",
    "guarded": false
  },
  {
    "path": "/v1/accounts/{id}",
    "method": "delete",
    "operationId": "deleteAccount",
    "tag": "accounts",
    "summary": "Permanently delete account.",
    "pattern": "^/v1/accounts/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/accounts/{id}",
    "method": "get",
    "operationId": "getAccount",
    "tag": "accounts",
    "summary": "Get single account.",
    "pattern": "^/v1/accounts/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/accounts/{id}",
    "method": "put",
    "operationId": "updateAccount",
    "tag": "accounts",
    "summary": "Update existing account.",
    "pattern": "^/v1/accounts/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/accounts/{id}/attachments",
    "method": "get",
    "operationId": "listAttachmentByAccount",
    "tag": "accounts",
    "summary": "Lists all attachments.",
    "pattern": "^/v1/accounts/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/accounts/{id}/piggy-banks",
    "method": "get",
    "operationId": "listPiggyBankByAccount",
    "tag": "accounts",
    "summary": "List all piggy banks related to the account.",
    "pattern": "^/v1/accounts/[^/]+/piggy-banks$",
    "guarded": false
  },
  {
    "path": "/v1/accounts/{id}/transactions",
    "method": "get",
    "operationId": "listTransactionByAccount",
    "tag": "accounts",
    "summary": "List all transactions related to the account.",
    "pattern": "^/v1/accounts/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/attachments",
    "method": "get",
    "operationId": "listAttachment",
    "tag": "attachments",
    "summary": "List all attachments.",
    "pattern": "^/v1/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/attachments",
    "method": "post",
    "operationId": "storeAttachment",
    "tag": "attachments",
    "summary": "Store a new attachment.",
    "pattern": "^/v1/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/attachments/{id}",
    "method": "delete",
    "operationId": "deleteAttachment",
    "tag": "attachments",
    "summary": "Delete an attachment.",
    "pattern": "^/v1/attachments/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/attachments/{id}",
    "method": "get",
    "operationId": "getAttachment",
    "tag": "attachments",
    "summary": "Get a single attachment.",
    "pattern": "^/v1/attachments/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/attachments/{id}",
    "method": "put",
    "operationId": "updateAttachment",
    "tag": "attachments",
    "summary": "Update existing attachment.",
    "pattern": "^/v1/attachments/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/attachments/{id}/download",
    "method": "get",
    "operationId": "downloadAttachment",
    "tag": "attachments",
    "summary": "Download a single attachment.",
    "pattern": "^/v1/attachments/[^/]+/download$",
    "guarded": false
  },
  {
    "path": "/v1/attachments/{id}/upload",
    "method": "post",
    "operationId": "uploadAttachment",
    "tag": "attachments",
    "summary": "Upload an attachment.",
    "pattern": "^/v1/attachments/[^/]+/upload$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/accounts",
    "method": "get",
    "operationId": "getAccountsAC",
    "tag": "autocomplete",
    "summary": "Returns all accounts of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/accounts$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/bills",
    "method": "get",
    "operationId": "getBillsAC",
    "tag": "autocomplete",
    "summary": "Returns all bills of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/bills$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/budgets",
    "method": "get",
    "operationId": "getBudgetsAC",
    "tag": "autocomplete",
    "summary": "Returns all budgets of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/budgets$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/categories",
    "method": "get",
    "operationId": "getCategoriesAC",
    "tag": "autocomplete",
    "summary": "Returns all categories of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/categories$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/currencies",
    "method": "get",
    "operationId": "getCurrenciesAC",
    "tag": "autocomplete",
    "summary": "Returns all currencies of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/currencies$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/currencies-with-code",
    "method": "get",
    "operationId": "getCurrenciesCodeAC",
    "tag": "autocomplete",
    "summary": "Returns all currencies of the user returned in a basic auto-complete array. This endpoint is DEPRECATED and I suggest you DO NOT use it.",
    "pattern": "^/v1/autocomplete/currencies-with-code$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/object-groups",
    "method": "get",
    "operationId": "getObjectGroupsAC",
    "tag": "autocomplete",
    "summary": "Returns all object groups of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/object-groups$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/piggy-banks",
    "method": "get",
    "operationId": "getPiggiesAC",
    "tag": "autocomplete",
    "summary": "Returns all piggy banks of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/piggy-banks$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/piggy-banks-with-balance",
    "method": "get",
    "operationId": "getPiggiesBalanceAC",
    "tag": "autocomplete",
    "summary": "Returns all piggy banks of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/piggy-banks-with-balance$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/recurring",
    "method": "get",
    "operationId": "getRecurringAC",
    "tag": "autocomplete",
    "summary": "Returns all recurring transactions of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/recurring$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/rule-groups",
    "method": "get",
    "operationId": "getRuleGroupsAC",
    "tag": "autocomplete",
    "summary": "Returns all rule groups of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/rule-groups$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/rules",
    "method": "get",
    "operationId": "getRulesAC",
    "tag": "autocomplete",
    "summary": "Returns all rules of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/rules$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/subscriptions",
    "method": "get",
    "operationId": "getSubscriptionsAC",
    "tag": "autocomplete",
    "summary": "Returns all subscriptions of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/subscriptions$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/tags",
    "method": "get",
    "operationId": "getTagAC",
    "tag": "autocomplete",
    "summary": "Returns all tags of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/tags$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/transaction-types",
    "method": "get",
    "operationId": "getTransactionTypesAC",
    "tag": "autocomplete",
    "summary": "Returns all transaction types returned in a basic auto-complete array. English only.",
    "pattern": "^/v1/autocomplete/transaction-types$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/transactions",
    "method": "get",
    "operationId": "getTransactionsAC",
    "tag": "autocomplete",
    "summary": "Returns all transaction descriptions of the user returned in a basic auto-complete array.",
    "pattern": "^/v1/autocomplete/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/autocomplete/transactions-with-id",
    "method": "get",
    "operationId": "getTransactionsIDAC",
    "tag": "autocomplete",
    "summary": "Returns all transactions, complemented with their ID, of the user returned in a basic auto-complete array. This endpoint is DEPRECATED and I suggest you DO NOT use it.",
    "pattern": "^/v1/autocomplete/transactions-with-id$",
    "guarded": false
  },
  {
    "path": "/v1/available-budgets",
    "method": "get",
    "operationId": "listAvailableBudgets",
    "tag": "available_budgets",
    "summary": "List all available budget amounts.",
    "pattern": "^/v1/available-budgets$",
    "guarded": false
  },
  {
    "path": "/v1/available-budgets/{id}",
    "method": "get",
    "operationId": "getAvailableBudget",
    "tag": "available_budgets",
    "summary": "Get a single available budget.",
    "pattern": "^/v1/available-budgets/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/batch/finish",
    "method": "post",
    "operationId": "finishBatch",
    "tag": "about",
    "summary": "Finish a batch of unprocessed transactions.",
    "pattern": "^/v1/batch/finish$",
    "guarded": false
  },
  {
    "path": "/v1/bills",
    "method": "get",
    "operationId": "listBill",
    "tag": "bills",
    "summary": "List all bills.",
    "pattern": "^/v1/bills$",
    "guarded": false
  },
  {
    "path": "/v1/bills",
    "method": "post",
    "operationId": "storeBill",
    "tag": "bills",
    "summary": "Store a new bill",
    "pattern": "^/v1/bills$",
    "guarded": false
  },
  {
    "path": "/v1/bills/{id}",
    "method": "delete",
    "operationId": "deleteBill",
    "tag": "bills",
    "summary": "Delete a bill.",
    "pattern": "^/v1/bills/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/bills/{id}",
    "method": "get",
    "operationId": "getBill",
    "tag": "bills",
    "summary": "Get a single bill.",
    "pattern": "^/v1/bills/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/bills/{id}",
    "method": "put",
    "operationId": "updateBill",
    "tag": "bills",
    "summary": "Update existing bill.",
    "pattern": "^/v1/bills/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/bills/{id}/attachments",
    "method": "get",
    "operationId": "listAttachmentByBill",
    "tag": "bills",
    "summary": "List all attachments uploaded to the bill.",
    "pattern": "^/v1/bills/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/bills/{id}/rules",
    "method": "get",
    "operationId": "listRuleByBill",
    "tag": "bills",
    "summary": "List all rules associated with the bill.",
    "pattern": "^/v1/bills/[^/]+/rules$",
    "guarded": false
  },
  {
    "path": "/v1/bills/{id}/transactions",
    "method": "get",
    "operationId": "listTransactionByBill",
    "tag": "bills",
    "summary": "List all transactions associated with the bill.",
    "pattern": "^/v1/bills/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/budget-limits",
    "method": "get",
    "operationId": "listBudgetLimit",
    "tag": "budgets",
    "summary": "Get list of budget limits by date",
    "pattern": "^/v1/budget-limits$",
    "guarded": false
  },
  {
    "path": "/v1/budgets",
    "method": "get",
    "operationId": "listBudget",
    "tag": "budgets",
    "summary": "List all budgets.",
    "pattern": "^/v1/budgets$",
    "guarded": false
  },
  {
    "path": "/v1/budgets",
    "method": "post",
    "operationId": "storeBudget",
    "tag": "budgets",
    "summary": "Store a new budget",
    "pattern": "^/v1/budgets$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}",
    "method": "delete",
    "operationId": "deleteBudget",
    "tag": "budgets",
    "summary": "Delete a budget.",
    "pattern": "^/v1/budgets/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}",
    "method": "get",
    "operationId": "getBudget",
    "tag": "budgets",
    "summary": "Get a single budget.",
    "pattern": "^/v1/budgets/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}",
    "method": "put",
    "operationId": "updateBudget",
    "tag": "budgets",
    "summary": "Update existing budget.",
    "pattern": "^/v1/budgets/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/attachments",
    "method": "get",
    "operationId": "listAttachmentByBudget",
    "tag": "budgets",
    "summary": "Lists all attachments of a budget.",
    "pattern": "^/v1/budgets/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/limits",
    "method": "get",
    "operationId": "listBudgetLimitByBudget",
    "tag": "budgets",
    "summary": "Get all limits for a budget.",
    "pattern": "^/v1/budgets/[^/]+/limits$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/limits",
    "method": "post",
    "operationId": "storeBudgetLimit",
    "tag": "budgets",
    "summary": "Store new budget limit.",
    "pattern": "^/v1/budgets/[^/]+/limits$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/limits/{limitId}",
    "method": "delete",
    "operationId": "deleteBudgetLimit",
    "tag": "budgets",
    "summary": "Delete a budget limit.",
    "pattern": "^/v1/budgets/[^/]+/limits/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/limits/{limitId}",
    "method": "get",
    "operationId": "getBudgetLimit",
    "tag": "budgets",
    "summary": "Get single budget limit.",
    "pattern": "^/v1/budgets/[^/]+/limits/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/limits/{limitId}",
    "method": "put",
    "operationId": "updateBudgetLimit",
    "tag": "budgets",
    "summary": "Update existing budget limit.",
    "pattern": "^/v1/budgets/[^/]+/limits/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/limits/{limitId}/transactions",
    "method": "get",
    "operationId": "listTransactionByBudgetLimit",
    "tag": "budgets",
    "summary": "List all transactions by a budget limit ID.",
    "pattern": "^/v1/budgets/[^/]+/limits/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/{id}/transactions",
    "method": "get",
    "operationId": "listTransactionByBudget",
    "tag": "budgets",
    "summary": "All transactions to a budget.",
    "pattern": "^/v1/budgets/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/budgets/transactions-without-budget",
    "method": "get",
    "operationId": "listTransactionWithoutBudget",
    "tag": "budgets",
    "summary": "All transactions without a budget.",
    "pattern": "^/v1/budgets/transactions-without-budget$",
    "guarded": false
  },
  {
    "path": "/v1/categories",
    "method": "get",
    "operationId": "listCategory",
    "tag": "categories",
    "summary": "List all categories.",
    "pattern": "^/v1/categories$",
    "guarded": false
  },
  {
    "path": "/v1/categories",
    "method": "post",
    "operationId": "storeCategory",
    "tag": "categories",
    "summary": "Store a new category",
    "pattern": "^/v1/categories$",
    "guarded": false
  },
  {
    "path": "/v1/categories/{id}",
    "method": "delete",
    "operationId": "deleteCategory",
    "tag": "categories",
    "summary": "Delete a category.",
    "pattern": "^/v1/categories/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/categories/{id}",
    "method": "get",
    "operationId": "getCategory",
    "tag": "categories",
    "summary": "Get a single category.",
    "pattern": "^/v1/categories/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/categories/{id}",
    "method": "put",
    "operationId": "updateCategory",
    "tag": "categories",
    "summary": "Update existing category.",
    "pattern": "^/v1/categories/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/categories/{id}/attachments",
    "method": "get",
    "operationId": "listAttachmentByCategory",
    "tag": "categories",
    "summary": "Lists all attachments.",
    "pattern": "^/v1/categories/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/categories/{id}/transactions",
    "method": "get",
    "operationId": "listTransactionByCategory",
    "tag": "categories",
    "summary": "List all transactions in a category.",
    "pattern": "^/v1/categories/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/chart/account/overview",
    "method": "get",
    "operationId": "getChartAccountOverview",
    "tag": "charts",
    "summary": "Dashboard chart with asset account balance information.",
    "pattern": "^/v1/chart/account/overview$",
    "guarded": false
  },
  {
    "path": "/v1/chart/balance/balance",
    "method": "get",
    "operationId": "getChartBalance",
    "tag": "charts",
    "summary": "Dashboard chart with balance information.",
    "pattern": "^/v1/chart/balance/balance$",
    "guarded": false
  },
  {
    "path": "/v1/chart/budget/overview",
    "method": "get",
    "operationId": "getChartBudgetOverview",
    "tag": "charts",
    "summary": "Dashboard chart with budget information.",
    "pattern": "^/v1/chart/budget/overview$",
    "guarded": false
  },
  {
    "path": "/v1/chart/category/overview",
    "method": "get",
    "operationId": "getChartCategoryOverview",
    "tag": "charts",
    "summary": "Dashboard chart with category information.",
    "pattern": "^/v1/chart/category/overview$",
    "guarded": false
  },
  {
    "path": "/v1/configuration",
    "method": "get",
    "operationId": "getConfiguration",
    "tag": "configuration",
    "summary": "Get Firefly III system configuration values.",
    "pattern": "^/v1/configuration$",
    "guarded": false
  },
  {
    "path": "/v1/configuration/{name}",
    "method": "get",
    "operationId": "getSingleConfiguration",
    "tag": "configuration",
    "summary": "Get a single Firefly III system configuration value",
    "pattern": "^/v1/configuration/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/configuration/{name}",
    "method": "put",
    "operationId": "setConfiguration",
    "tag": "configuration",
    "summary": "Update configuration value",
    "pattern": "^/v1/configuration/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/cron/{cliToken}",
    "method": "get",
    "operationId": "getCron",
    "tag": "about",
    "summary": "Cron job endpoint",
    "pattern": "^/v1/cron/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/currencies",
    "method": "get",
    "operationId": "listCurrency",
    "tag": "currencies",
    "summary": "List all currencies.",
    "pattern": "^/v1/currencies$",
    "guarded": false
  },
  {
    "path": "/v1/currencies",
    "method": "post",
    "operationId": "storeCurrency",
    "tag": "currencies",
    "summary": "Store a new currency",
    "pattern": "^/v1/currencies$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}",
    "method": "delete",
    "operationId": "deleteCurrency",
    "tag": "currencies",
    "summary": "Delete a currency.",
    "pattern": "^/v1/currencies/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}",
    "method": "get",
    "operationId": "getCurrency",
    "tag": "currencies",
    "summary": "Get a single currency.",
    "pattern": "^/v1/currencies/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}",
    "method": "put",
    "operationId": "updateCurrency",
    "tag": "currencies",
    "summary": "Update existing currency.",
    "pattern": "^/v1/currencies/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/accounts",
    "method": "get",
    "operationId": "listAccountByCurrency",
    "tag": "currencies",
    "summary": "List all accounts with this currency.",
    "pattern": "^/v1/currencies/[^/]+/accounts$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/available-budgets",
    "method": "get",
    "operationId": "listAvailableBudgetByCurrency",
    "tag": "currencies",
    "summary": "List all available budgets with this currency.",
    "pattern": "^/v1/currencies/[^/]+/available-budgets$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/bills",
    "method": "get",
    "operationId": "listBillByCurrency",
    "tag": "currencies",
    "summary": "List all bills with this currency.",
    "pattern": "^/v1/currencies/[^/]+/bills$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/budget-limits",
    "method": "get",
    "operationId": "listBudgetLimitByCurrency",
    "tag": "currencies",
    "summary": "List all budget limits with this currency",
    "pattern": "^/v1/currencies/[^/]+/budget-limits$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/disable",
    "method": "post",
    "operationId": "disableCurrency",
    "tag": "currencies",
    "summary": "Disable a currency.",
    "pattern": "^/v1/currencies/[^/]+/disable$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/enable",
    "method": "post",
    "operationId": "enableCurrency",
    "tag": "currencies",
    "summary": "Enable a single currency.",
    "pattern": "^/v1/currencies/[^/]+/enable$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/primary",
    "method": "post",
    "operationId": "primaryCurrency",
    "tag": "currencies",
    "summary": "Make currency primary currency.",
    "pattern": "^/v1/currencies/[^/]+/primary$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/recurrences",
    "method": "get",
    "operationId": "listRecurrenceByCurrency",
    "tag": "currencies",
    "summary": "List all recurring transactions with this currency.",
    "pattern": "^/v1/currencies/[^/]+/recurrences$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/rules",
    "method": "get",
    "operationId": "listRuleByCurrency",
    "tag": "currencies",
    "summary": "List all rules with this currency.",
    "pattern": "^/v1/currencies/[^/]+/rules$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/{code}/transactions",
    "method": "get",
    "operationId": "listTransactionByCurrency",
    "tag": "currencies",
    "summary": "List all transactions with this currency.",
    "pattern": "^/v1/currencies/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/currencies/primary",
    "method": "get",
    "operationId": "getPrimaryCurrency",
    "tag": "currencies",
    "summary": "Get the primary currency of the current administration.",
    "pattern": "^/v1/currencies/primary$",
    "guarded": false
  },
  {
    "path": "/v1/data/bulk/transactions",
    "method": "post",
    "operationId": "bulkUpdateTransactions",
    "tag": "data",
    "summary": "Bulk update transaction properties. For more information, see https://docs.firefly-iii.org/references/firefly-iii/api/specials/",
    "pattern": "^/v1/data/bulk/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/data/destroy",
    "method": "delete",
    "operationId": "destroyData",
    "tag": "data",
    "summary": "Endpoint to destroy user data",
    "pattern": "^/v1/data/destroy$",
    "guarded": true
  },
  {
    "path": "/v1/data/export/accounts",
    "method": "get",
    "operationId": "exportAccounts",
    "tag": "data",
    "summary": "Export account data from Firefly III",
    "pattern": "^/v1/data/export/accounts$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/bills",
    "method": "get",
    "operationId": "exportBills",
    "tag": "data",
    "summary": "Export bills from Firefly III",
    "pattern": "^/v1/data/export/bills$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/budgets",
    "method": "get",
    "operationId": "exportBudgets",
    "tag": "data",
    "summary": "Export budgets and budget amount data from Firefly III",
    "pattern": "^/v1/data/export/budgets$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/categories",
    "method": "get",
    "operationId": "exportCategories",
    "tag": "data",
    "summary": "Export category data from Firefly III",
    "pattern": "^/v1/data/export/categories$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/piggy-banks",
    "method": "get",
    "operationId": "exportPiggies",
    "tag": "data",
    "summary": "Export piggy banks from Firefly III",
    "pattern": "^/v1/data/export/piggy-banks$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/recurring",
    "method": "get",
    "operationId": "exportRecurring",
    "tag": "data",
    "summary": "Export recurring transaction data from Firefly III",
    "pattern": "^/v1/data/export/recurring$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/rules",
    "method": "get",
    "operationId": "exportRules",
    "tag": "data",
    "summary": "Export rule groups and rule data from Firefly III",
    "pattern": "^/v1/data/export/rules$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/tags",
    "method": "get",
    "operationId": "exportTags",
    "tag": "data",
    "summary": "Export tag data from Firefly III",
    "pattern": "^/v1/data/export/tags$",
    "guarded": false
  },
  {
    "path": "/v1/data/export/transactions",
    "method": "get",
    "operationId": "exportTransactions",
    "tag": "data",
    "summary": "Export transaction data from Firefly III",
    "pattern": "^/v1/data/export/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/data/purge",
    "method": "delete",
    "operationId": "purgeData",
    "tag": "data",
    "summary": "Endpoint to purge user data",
    "pattern": "^/v1/data/purge$",
    "guarded": true
  },
  {
    "path": "/v1/exchange-rates",
    "method": "get",
    "operationId": "listCurrencyExchangeRates",
    "tag": "currency_exchange_rates",
    "summary": "List all exchange rates that Firefly III knows.",
    "pattern": "^/v1/exchange-rates$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates",
    "method": "post",
    "operationId": "storeCurrencyExchangeRate",
    "tag": "currency_exchange_rates",
    "summary": "Store a new currency exchange rate.",
    "pattern": "^/v1/exchange-rates$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{from}/{to}",
    "method": "delete",
    "operationId": "deleteSpecificCurrencyExchangeRates",
    "tag": "currency_exchange_rates",
    "summary": "Deletes ALL currency exchange rates from 'from' to 'to'.",
    "pattern": "^/v1/exchange-rates/[^/]+/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{from}/{to}",
    "method": "get",
    "operationId": "listSpecificCurrencyExchangeRates",
    "tag": "currency_exchange_rates",
    "summary": "List all exchange rates from/to the mentioned currencies.",
    "pattern": "^/v1/exchange-rates/[^/]+/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{from}/{to}/{date}",
    "method": "delete",
    "operationId": "deleteSpecificCurrencyExchangeRateOnDate",
    "tag": "currency_exchange_rates",
    "summary": "Delete the currency exchange rate from 'from' to 'to' on the specified date.",
    "pattern": "^/v1/exchange-rates/[^/]+/[^/]+/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{from}/{to}/{date}",
    "method": "get",
    "operationId": "listSpecificCurrencyExchangeRateOnDate",
    "tag": "currency_exchange_rates",
    "summary": "List the exchange rate for the from and to-currency on the requested date.",
    "pattern": "^/v1/exchange-rates/[^/]+/[^/]+/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{from}/{to}/{date}",
    "method": "put",
    "operationId": "updateCurrencyExchangeRateByDate",
    "tag": "currency_exchange_rates",
    "summary": "Update existing currency exchange rate.",
    "pattern": "^/v1/exchange-rates/[^/]+/[^/]+/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{id}",
    "method": "delete",
    "operationId": "deleteSpecificCurrencyExchangeRate",
    "tag": "currency_exchange_rates",
    "summary": "Delete a specific currency exchange rate.",
    "pattern": "^/v1/exchange-rates/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{id}",
    "method": "get",
    "operationId": "listSpecificCurrencyExchangeRate",
    "tag": "currency_exchange_rates",
    "summary": "List a single specific exchange rate.",
    "pattern": "^/v1/exchange-rates/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/{id}",
    "method": "put",
    "operationId": "updateCurrencyExchangeRate",
    "tag": "currency_exchange_rates",
    "summary": "Update existing currency exchange rate.",
    "pattern": "^/v1/exchange-rates/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/by-currencies/{from}/{to}",
    "method": "post",
    "operationId": "storeCurrencyExchangeRatesByPair",
    "tag": "currency_exchange_rates",
    "summary": "Store new currency exchange rates under this from/to pair.",
    "pattern": "^/v1/exchange-rates/by-currencies/[^/]+/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/exchange-rates/by-date/{date}",
    "method": "post",
    "operationId": "storeCurrencyExchangeRatesByDate",
    "tag": "currency_exchange_rates",
    "summary": "Store new currency exchange rates under this date",
    "pattern": "^/v1/exchange-rates/by-date/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/asset",
    "method": "get",
    "operationId": "insightExpenseAsset",
    "tag": "insight",
    "summary": "Insight into expenses, grouped by asset account.",
    "pattern": "^/v1/insight/expense/asset$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/bill",
    "method": "get",
    "operationId": "insightExpenseBill",
    "tag": "insight",
    "summary": "Insight into expenses, grouped by bill.",
    "pattern": "^/v1/insight/expense/bill$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/budget",
    "method": "get",
    "operationId": "insightExpenseBudget",
    "tag": "insight",
    "summary": "Insight into expenses, grouped by budget.",
    "pattern": "^/v1/insight/expense/budget$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/category",
    "method": "get",
    "operationId": "insightExpenseCategory",
    "tag": "insight",
    "summary": "Insight into expenses, grouped by category.",
    "pattern": "^/v1/insight/expense/category$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/expense",
    "method": "get",
    "operationId": "insightExpenseExpense",
    "tag": "insight",
    "summary": "Insight into expenses, grouped by expense account.",
    "pattern": "^/v1/insight/expense/expense$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/no-bill",
    "method": "get",
    "operationId": "insightExpenseNoBill",
    "tag": "insight",
    "summary": "Insight into expenses, without bill.",
    "pattern": "^/v1/insight/expense/no-bill$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/no-budget",
    "method": "get",
    "operationId": "insightExpenseNoBudget",
    "tag": "insight",
    "summary": "Insight into expenses, without budget.",
    "pattern": "^/v1/insight/expense/no-budget$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/no-category",
    "method": "get",
    "operationId": "insightExpenseNoCategory",
    "tag": "insight",
    "summary": "Insight into expenses, without category.",
    "pattern": "^/v1/insight/expense/no-category$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/no-tag",
    "method": "get",
    "operationId": "insightExpenseNoTag",
    "tag": "insight",
    "summary": "Insight into expenses, without tag.",
    "pattern": "^/v1/insight/expense/no-tag$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/tag",
    "method": "get",
    "operationId": "insightExpenseTag",
    "tag": "insight",
    "summary": "Insight into expenses, grouped by tag.",
    "pattern": "^/v1/insight/expense/tag$",
    "guarded": false
  },
  {
    "path": "/v1/insight/expense/total",
    "method": "get",
    "operationId": "insightExpenseTotal",
    "tag": "insight",
    "summary": "Insight into total expenses.",
    "pattern": "^/v1/insight/expense/total$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/asset",
    "method": "get",
    "operationId": "insightIncomeAsset",
    "tag": "insight",
    "summary": "Insight into income, grouped by asset account.",
    "pattern": "^/v1/insight/income/asset$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/category",
    "method": "get",
    "operationId": "insightIncomeCategory",
    "tag": "insight",
    "summary": "Insight into income, grouped by category.",
    "pattern": "^/v1/insight/income/category$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/no-category",
    "method": "get",
    "operationId": "insightIncomeNoCategory",
    "tag": "insight",
    "summary": "Insight into income, without category.",
    "pattern": "^/v1/insight/income/no-category$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/no-tag",
    "method": "get",
    "operationId": "insightIncomeNoTag",
    "tag": "insight",
    "summary": "Insight into income, without tag.",
    "pattern": "^/v1/insight/income/no-tag$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/revenue",
    "method": "get",
    "operationId": "insightIncomeRevenue",
    "tag": "insight",
    "summary": "Insight into income, grouped by revenue account.",
    "pattern": "^/v1/insight/income/revenue$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/tag",
    "method": "get",
    "operationId": "insightIncomeTag",
    "tag": "insight",
    "summary": "Insight into income, grouped by tag.",
    "pattern": "^/v1/insight/income/tag$",
    "guarded": false
  },
  {
    "path": "/v1/insight/income/total",
    "method": "get",
    "operationId": "insightIncomeTotal",
    "tag": "insight",
    "summary": "Insight into total income.",
    "pattern": "^/v1/insight/income/total$",
    "guarded": false
  },
  {
    "path": "/v1/insight/transfer/asset",
    "method": "get",
    "operationId": "insightTransfers",
    "tag": "insight",
    "summary": "Insight into transfers, grouped by account.",
    "pattern": "^/v1/insight/transfer/asset$",
    "guarded": false
  },
  {
    "path": "/v1/insight/transfer/category",
    "method": "get",
    "operationId": "insightTransferCategory",
    "tag": "insight",
    "summary": "Insight into transfers, grouped by category.",
    "pattern": "^/v1/insight/transfer/category$",
    "guarded": false
  },
  {
    "path": "/v1/insight/transfer/no-category",
    "method": "get",
    "operationId": "insightTransferNoCategory",
    "tag": "insight",
    "summary": "Insight into transfers, without category.",
    "pattern": "^/v1/insight/transfer/no-category$",
    "guarded": false
  },
  {
    "path": "/v1/insight/transfer/no-tag",
    "method": "get",
    "operationId": "insightTransferNoTag",
    "tag": "insight",
    "summary": "Insight into expenses, without tag.",
    "pattern": "^/v1/insight/transfer/no-tag$",
    "guarded": false
  },
  {
    "path": "/v1/insight/transfer/tag",
    "method": "get",
    "operationId": "insightTransferTag",
    "tag": "insight",
    "summary": "Insight into transfers, grouped by tag.",
    "pattern": "^/v1/insight/transfer/tag$",
    "guarded": false
  },
  {
    "path": "/v1/insight/transfer/total",
    "method": "get",
    "operationId": "insightTransferTotal",
    "tag": "insight",
    "summary": "Insight into total transfers.",
    "pattern": "^/v1/insight/transfer/total$",
    "guarded": false
  },
  {
    "path": "/v1/link-types",
    "method": "get",
    "operationId": "listLinkType",
    "tag": "links",
    "summary": "List all types of links.",
    "pattern": "^/v1/link-types$",
    "guarded": false
  },
  {
    "path": "/v1/link-types",
    "method": "post",
    "operationId": "storeLinkType",
    "tag": "links",
    "summary": "Create a new link type",
    "pattern": "^/v1/link-types$",
    "guarded": false
  },
  {
    "path": "/v1/link-types/{id}",
    "method": "delete",
    "operationId": "deleteLinkType",
    "tag": "links",
    "summary": "Permanently delete link type.",
    "pattern": "^/v1/link-types/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/link-types/{id}",
    "method": "get",
    "operationId": "getLinkType",
    "tag": "links",
    "summary": "Get single a link type.",
    "pattern": "^/v1/link-types/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/link-types/{id}",
    "method": "put",
    "operationId": "updateLinkType",
    "tag": "links",
    "summary": "Update existing link type.",
    "pattern": "^/v1/link-types/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/link-types/{id}/transactions",
    "method": "get",
    "operationId": "listTransactionByLinkType",
    "tag": "links",
    "summary": "List all transactions under this link type.",
    "pattern": "^/v1/link-types/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/object-groups",
    "method": "get",
    "operationId": "listObjectGroups",
    "tag": "object_groups",
    "summary": "List all object groups.",
    "pattern": "^/v1/object-groups$",
    "guarded": false
  },
  {
    "path": "/v1/object-groups/{id}",
    "method": "delete",
    "operationId": "deleteObjectGroup",
    "tag": "object_groups",
    "summary": "Delete a object group.",
    "pattern": "^/v1/object-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/object-groups/{id}",
    "method": "get",
    "operationId": "getObjectGroup",
    "tag": "object_groups",
    "summary": "Get a single object group.",
    "pattern": "^/v1/object-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/object-groups/{id}",
    "method": "put",
    "operationId": "updateObjectGroup",
    "tag": "object_groups",
    "summary": "Update existing object group.",
    "pattern": "^/v1/object-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/object-groups/{id}/bills",
    "method": "get",
    "operationId": "listBillByObjectGroup",
    "tag": "object_groups",
    "summary": "List all bills with this object group.",
    "pattern": "^/v1/object-groups/[^/]+/bills$",
    "guarded": false
  },
  {
    "path": "/v1/object-groups/{id}/piggy-banks",
    "method": "get",
    "operationId": "listPiggyBankByObjectGroup",
    "tag": "object_groups",
    "summary": "List all piggy banks related to the object group.",
    "pattern": "^/v1/object-groups/[^/]+/piggy-banks$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks",
    "method": "get",
    "operationId": "listPiggyBank",
    "tag": "piggy_banks",
    "summary": "List all piggy banks.",
    "pattern": "^/v1/piggy-banks$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks",
    "method": "post",
    "operationId": "storePiggyBank",
    "tag": "piggy_banks",
    "summary": "Store a new piggy bank",
    "pattern": "^/v1/piggy-banks$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks/{id}",
    "method": "delete",
    "operationId": "deletePiggyBank",
    "tag": "piggy_banks",
    "summary": "Delete a piggy bank.",
    "pattern": "^/v1/piggy-banks/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks/{id}",
    "method": "get",
    "operationId": "getPiggyBank",
    "tag": "piggy_banks",
    "summary": "Get a single piggy bank.",
    "pattern": "^/v1/piggy-banks/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks/{id}",
    "method": "put",
    "operationId": "updatePiggyBank",
    "tag": "piggy_banks",
    "summary": "Update existing piggy bank.",
    "pattern": "^/v1/piggy-banks/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks/{id}/attachments",
    "method": "get",
    "operationId": "listAttachmentByPiggyBank",
    "tag": "piggy_banks",
    "summary": "Lists all attachments.",
    "pattern": "^/v1/piggy-banks/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/piggy-banks/{id}/events",
    "method": "get",
    "operationId": "listEventByPiggyBank",
    "tag": "piggy_banks",
    "summary": "List all events linked to a piggy bank.",
    "pattern": "^/v1/piggy-banks/[^/]+/events$",
    "guarded": false
  },
  {
    "path": "/v1/preferences",
    "method": "get",
    "operationId": "listPreference",
    "tag": "preferences",
    "summary": "List all users preferences.",
    "pattern": "^/v1/preferences$",
    "guarded": false
  },
  {
    "path": "/v1/preferences",
    "method": "post",
    "operationId": "storePreference",
    "tag": "preferences",
    "summary": "Store a new preference for this user.",
    "pattern": "^/v1/preferences$",
    "guarded": false
  },
  {
    "path": "/v1/preferences/{name}",
    "method": "get",
    "operationId": "getPreference",
    "tag": "preferences",
    "summary": "Return a single preference.",
    "pattern": "^/v1/preferences/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/preferences/{name}",
    "method": "put",
    "operationId": "updatePreference",
    "tag": "preferences",
    "summary": "Update preference",
    "pattern": "^/v1/preferences/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences",
    "method": "get",
    "operationId": "listRecurrence",
    "tag": "recurrences",
    "summary": "List all recurring transactions.",
    "pattern": "^/v1/recurrences$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences",
    "method": "post",
    "operationId": "storeRecurrence",
    "tag": "recurrences",
    "summary": "Store a new recurring transaction",
    "pattern": "^/v1/recurrences$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences/{id}",
    "method": "delete",
    "operationId": "deleteRecurrence",
    "tag": "recurrences",
    "summary": "Delete a recurring transaction.",
    "pattern": "^/v1/recurrences/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences/{id}",
    "method": "get",
    "operationId": "getRecurrence",
    "tag": "recurrences",
    "summary": "Get a single recurring transaction.",
    "pattern": "^/v1/recurrences/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences/{id}",
    "method": "put",
    "operationId": "updateRecurrence",
    "tag": "recurrences",
    "summary": "Update existing recurring transaction.",
    "pattern": "^/v1/recurrences/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences/{id}/transactions",
    "method": "get",
    "operationId": "listTransactionByRecurrence",
    "tag": "recurrences",
    "summary": "List all transactions created by a recurring transaction.",
    "pattern": "^/v1/recurrences/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/recurrences/{id}/trigger",
    "method": "post",
    "operationId": "triggerRecurrenceRecurrence",
    "tag": "recurrences",
    "summary": "Trigger the creation of a transaction for a specific recurring transaction",
    "pattern": "^/v1/recurrences/[^/]+/trigger$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups",
    "method": "get",
    "operationId": "listRuleGroup",
    "tag": "rule_groups",
    "summary": "List all rule groups.",
    "pattern": "^/v1/rule-groups$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups",
    "method": "post",
    "operationId": "storeRuleGroup",
    "tag": "rule_groups",
    "summary": "Store a new rule group.",
    "pattern": "^/v1/rule-groups$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups/{id}",
    "method": "delete",
    "operationId": "deleteRuleGroup",
    "tag": "rule_groups",
    "summary": "Delete a rule group.",
    "pattern": "^/v1/rule-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups/{id}",
    "method": "get",
    "operationId": "getRuleGroup",
    "tag": "rule_groups",
    "summary": "Get a single rule group.",
    "pattern": "^/v1/rule-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups/{id}",
    "method": "put",
    "operationId": "updateRuleGroup",
    "tag": "rule_groups",
    "summary": "Update existing rule group.",
    "pattern": "^/v1/rule-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups/{id}/rules",
    "method": "get",
    "operationId": "listRuleByGroup",
    "tag": "rule_groups",
    "summary": "List rules in this rule group.",
    "pattern": "^/v1/rule-groups/[^/]+/rules$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups/{id}/test",
    "method": "get",
    "operationId": "testRuleGroup",
    "tag": "rule_groups",
    "summary": "Test which transactions would be hit by the rule group. No changes will be made.",
    "pattern": "^/v1/rule-groups/[^/]+/test$",
    "guarded": false
  },
  {
    "path": "/v1/rule-groups/{id}/trigger",
    "method": "post",
    "operationId": "fireRuleGroup",
    "tag": "rule_groups",
    "summary": "Fire the rule group on your transactions.",
    "pattern": "^/v1/rule-groups/[^/]+/trigger$",
    "guarded": false
  },
  {
    "path": "/v1/rules",
    "method": "get",
    "operationId": "listRule",
    "tag": "rules",
    "summary": "List all rules.",
    "pattern": "^/v1/rules$",
    "guarded": false
  },
  {
    "path": "/v1/rules",
    "method": "post",
    "operationId": "storeRule",
    "tag": "rules",
    "summary": "Store a new rule",
    "pattern": "^/v1/rules$",
    "guarded": false
  },
  {
    "path": "/v1/rules/{id}",
    "method": "delete",
    "operationId": "deleteRule",
    "tag": "rules",
    "summary": "Delete an rule.",
    "pattern": "^/v1/rules/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/rules/{id}",
    "method": "get",
    "operationId": "getRule",
    "tag": "rules",
    "summary": "Get a single rule.",
    "pattern": "^/v1/rules/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/rules/{id}",
    "method": "put",
    "operationId": "updateRule",
    "tag": "rules",
    "summary": "Update existing rule.",
    "pattern": "^/v1/rules/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/rules/{id}/test",
    "method": "get",
    "operationId": "testRule",
    "tag": "rules",
    "summary": "Test which transactions would be hit by the rule. No changes will be made.",
    "pattern": "^/v1/rules/[^/]+/test$",
    "guarded": false
  },
  {
    "path": "/v1/rules/{id}/trigger",
    "method": "post",
    "operationId": "fireRule",
    "tag": "rules",
    "summary": "Fire the rule on your transactions.",
    "pattern": "^/v1/rules/[^/]+/trigger$",
    "guarded": false
  },
  {
    "path": "/v1/search/accounts",
    "method": "get",
    "operationId": "searchAccounts",
    "tag": "search",
    "summary": "Search for accounts",
    "pattern": "^/v1/search/accounts$",
    "guarded": false
  },
  {
    "path": "/v1/search/transactions",
    "method": "get",
    "operationId": "searchTransactions",
    "tag": "search",
    "summary": "Search for transactions",
    "pattern": "^/v1/search/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/summary/basic",
    "method": "get",
    "operationId": "getBasicSummary",
    "tag": "summary",
    "summary": "Returns basic sums of the users data.",
    "pattern": "^/v1/summary/basic$",
    "guarded": false
  },
  {
    "path": "/v1/tags",
    "method": "get",
    "operationId": "listTag",
    "tag": "tags",
    "summary": "List all tags.",
    "pattern": "^/v1/tags$",
    "guarded": false
  },
  {
    "path": "/v1/tags",
    "method": "post",
    "operationId": "storeTag",
    "tag": "tags",
    "summary": "Store a new tag",
    "pattern": "^/v1/tags$",
    "guarded": false
  },
  {
    "path": "/v1/tags/{tag}",
    "method": "delete",
    "operationId": "deleteTag",
    "tag": "tags",
    "summary": "Delete an tag.",
    "pattern": "^/v1/tags/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/tags/{tag}",
    "method": "get",
    "operationId": "getTag",
    "tag": "tags",
    "summary": "Get a single tag.",
    "pattern": "^/v1/tags/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/tags/{tag}",
    "method": "put",
    "operationId": "updateTag",
    "tag": "tags",
    "summary": "Update existing tag.",
    "pattern": "^/v1/tags/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/tags/{tag}/attachments",
    "method": "get",
    "operationId": "listAttachmentByTag",
    "tag": "tags",
    "summary": "Lists all attachments.",
    "pattern": "^/v1/tags/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/tags/{tag}/transactions",
    "method": "get",
    "operationId": "listTransactionByTag",
    "tag": "tags",
    "summary": "List all transactions with this tag.",
    "pattern": "^/v1/tags/[^/]+/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-journals/{id}",
    "method": "delete",
    "operationId": "deleteTransactionJournal",
    "tag": "transactions",
    "summary": "Delete split from transaction",
    "pattern": "^/v1/transaction-journals/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-journals/{id}",
    "method": "get",
    "operationId": "getTransactionByJournal",
    "tag": "transactions",
    "summary": "Get a single transaction, based on one of the underlying transaction journals (transaction splits).",
    "pattern": "^/v1/transaction-journals/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-journals/{id}/links",
    "method": "get",
    "operationId": "listLinksByJournal",
    "tag": "transactions",
    "summary": "Lists all the transaction links for an individual journal (individual split).",
    "pattern": "^/v1/transaction-journals/[^/]+/links$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-links",
    "method": "get",
    "operationId": "listTransactionLink",
    "tag": "links",
    "summary": "List all transaction links.",
    "pattern": "^/v1/transaction-links$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-links",
    "method": "post",
    "operationId": "storeTransactionLink",
    "tag": "links",
    "summary": "Create a new link between transactions",
    "pattern": "^/v1/transaction-links$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-links/{id}",
    "method": "delete",
    "operationId": "deleteTransactionLink",
    "tag": "links",
    "summary": "Permanently delete link between transactions.",
    "pattern": "^/v1/transaction-links/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-links/{id}",
    "method": "get",
    "operationId": "getTransactionLink",
    "tag": "links",
    "summary": "Get a single link.",
    "pattern": "^/v1/transaction-links/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transaction-links/{id}",
    "method": "put",
    "operationId": "updateTransactionLink",
    "tag": "links",
    "summary": "Update an existing link between transactions.",
    "pattern": "^/v1/transaction-links/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transactions",
    "method": "get",
    "operationId": "listTransaction",
    "tag": "transactions",
    "summary": "List all the user's transactions.",
    "pattern": "^/v1/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/transactions",
    "method": "post",
    "operationId": "storeTransaction",
    "tag": "transactions",
    "summary": "Store a new transaction",
    "pattern": "^/v1/transactions$",
    "guarded": false
  },
  {
    "path": "/v1/transactions/{id}",
    "method": "delete",
    "operationId": "deleteTransaction",
    "tag": "transactions",
    "summary": "Delete a transaction.",
    "pattern": "^/v1/transactions/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transactions/{id}",
    "method": "get",
    "operationId": "getTransaction",
    "tag": "transactions",
    "summary": "Get a single transaction.",
    "pattern": "^/v1/transactions/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transactions/{id}",
    "method": "put",
    "operationId": "updateTransaction",
    "tag": "transactions",
    "summary": "Update existing transaction. For more information, see https://docs.firefly-iii.org/references/firefly-iii/api/specials/",
    "pattern": "^/v1/transactions/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/transactions/{id}/attachments",
    "method": "get",
    "operationId": "listAttachmentByTransaction",
    "tag": "transactions",
    "summary": "Lists all attachments.",
    "pattern": "^/v1/transactions/[^/]+/attachments$",
    "guarded": false
  },
  {
    "path": "/v1/transactions/{id}/piggy-bank-events",
    "method": "get",
    "operationId": "listEventByTransaction",
    "tag": "transactions",
    "summary": "Lists all piggy bank events.",
    "pattern": "^/v1/transactions/[^/]+/piggy-bank-events$",
    "guarded": false
  },
  {
    "path": "/v1/user-groups",
    "method": "get",
    "operationId": "listUserGroups",
    "tag": "user_groups",
    "summary": "List all the user groups available to this user.",
    "pattern": "^/v1/user-groups$",
    "guarded": false
  },
  {
    "path": "/v1/user-groups/{id}",
    "method": "get",
    "operationId": "getUserGroup",
    "tag": "user_groups",
    "summary": "Get a single user group.",
    "pattern": "^/v1/user-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/user-groups/{id}",
    "method": "put",
    "operationId": "updateUserGroup",
    "tag": "user_groups",
    "summary": "Update an existing user group.",
    "pattern": "^/v1/user-groups/[^/]+$",
    "guarded": false
  },
  {
    "path": "/v1/users",
    "method": "get",
    "operationId": "listUser",
    "tag": "users",
    "summary": "List all users.",
    "pattern": "^/v1/users$",
    "guarded": true
  },
  {
    "path": "/v1/users",
    "method": "post",
    "operationId": "storeUser",
    "tag": "users",
    "summary": "Store a new user",
    "pattern": "^/v1/users$",
    "guarded": true
  },
  {
    "path": "/v1/users/{id}",
    "method": "delete",
    "operationId": "deleteUser",
    "tag": "users",
    "summary": "Delete a user.",
    "pattern": "^/v1/users/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/users/{id}",
    "method": "get",
    "operationId": "getUser",
    "tag": "users",
    "summary": "Get a single user.",
    "pattern": "^/v1/users/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/users/{id}",
    "method": "put",
    "operationId": "updateUser",
    "tag": "users",
    "summary": "Update an existing user's information.",
    "pattern": "^/v1/users/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks",
    "method": "get",
    "operationId": "listWebhook",
    "tag": "webhooks",
    "summary": "List all webhooks.",
    "pattern": "^/v1/webhooks$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks",
    "method": "post",
    "operationId": "storeWebhook",
    "tag": "webhooks",
    "summary": "Store a new webhook",
    "pattern": "^/v1/webhooks$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}",
    "method": "delete",
    "operationId": "deleteWebhook",
    "tag": "webhooks",
    "summary": "Delete a webhook.",
    "pattern": "^/v1/webhooks/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}",
    "method": "get",
    "operationId": "getWebhook",
    "tag": "webhooks",
    "summary": "Get a single webhook.",
    "pattern": "^/v1/webhooks/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}",
    "method": "put",
    "operationId": "updateWebhook",
    "tag": "webhooks",
    "summary": "Update existing webhook.",
    "pattern": "^/v1/webhooks/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/messages",
    "method": "get",
    "operationId": "getWebhookMessages",
    "tag": "webhooks",
    "summary": "Get all the messages of a single webhook.",
    "pattern": "^/v1/webhooks/[^/]+/messages$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/messages/{messageId}",
    "method": "delete",
    "operationId": "deleteWebhookMessage",
    "tag": "webhooks",
    "summary": "Delete a webhook message.",
    "pattern": "^/v1/webhooks/[^/]+/messages/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/messages/{messageId}",
    "method": "get",
    "operationId": "getSingleWebhookMessage",
    "tag": "webhooks",
    "summary": "Get a single message from a webhook.",
    "pattern": "^/v1/webhooks/[^/]+/messages/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/messages/{messageId}/attempts",
    "method": "get",
    "operationId": "getWebhookMessageAttempts",
    "tag": "webhooks",
    "summary": "Get all the failed attempts of a single webhook message.",
    "pattern": "^/v1/webhooks/[^/]+/messages/[^/]+/attempts$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/messages/{messageId}/attempts/{attemptId}",
    "method": "delete",
    "operationId": "deleteWebhookMessageAttempt",
    "tag": "webhooks",
    "summary": "Delete a webhook attempt.",
    "pattern": "^/v1/webhooks/[^/]+/messages/[^/]+/attempts/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/messages/{messageId}/attempts/{attemptId}",
    "method": "get",
    "operationId": "getSingleWebhookMessageAttempt",
    "tag": "webhooks",
    "summary": "Get a single failed attempt from a single webhook message.",
    "pattern": "^/v1/webhooks/[^/]+/messages/[^/]+/attempts/[^/]+$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/submit",
    "method": "post",
    "operationId": "submitWebhook",
    "tag": "webhooks",
    "summary": "Submit messages for a webhook.",
    "pattern": "^/v1/webhooks/[^/]+/submit$",
    "guarded": true
  },
  {
    "path": "/v1/webhooks/{id}/trigger-transaction/{transactionId}",
    "method": "post",
    "operationId": "triggerTransactionWebhook",
    "tag": "webhooks",
    "summary": "Trigger webhook for a given transaction.",
    "pattern": "^/v1/webhooks/[^/]+/trigger-transaction/[^/]+$",
    "guarded": true
  }
] as const;

/** Total operations in the spec — asserted by the coverage test. */
export const FIREFLY_OPERATION_COUNT = 230;
export const FIREFLY_PATH_COUNT = 164;
