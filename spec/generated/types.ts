/* eslint-disable */
// Generated from spec/firefly-iii-v1.yaml (v6.5.5).
// Run `pnpm spec:codegen` to regenerate. Do not edit.

export type paths = {
    "/v1/about": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * System information end point.
         * @description Returns general system information and versions of the (supporting) software.
         */
        get: operations["getAbout"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/about/user": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Currently authenticated user endpoint.
         * @description Returns the currently authenticated user.
         */
        get: operations["getCurrentUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all accounts.
         * @description This endpoint returns a list of all the accounts owned by the authenticated user.
         */
        get: operations["listAccount"];
        put?: never;
        /**
         * Create new account.
         * @description Creates a new account. The data required can be submitted as a JSON body or as a list of parameters (in key=value pairs, like a webform).
         */
        post: operations["storeAccount"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get single account.
         * @description Returns a single account by its ID.
         */
        get: operations["getAccount"];
        /**
         * Update existing account.
         * @description Used to update a single account. All fields that are not submitted will be cleared (set to NULL). The model will tell you which fields are mandatory.
         */
        put: operations["updateAccount"];
        post?: never;
        /**
         * Permanently delete account.
         * @description Will permanently delete an account. Any associated transactions and piggy banks are ALSO deleted. Cannot be recovered from.
         */
        delete: operations["deleteAccount"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/accounts/{id}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all attachments.
         * @description Lists all attachments.
         */
        get: operations["listAttachmentByAccount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/accounts/{id}/piggy-banks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all piggy banks related to the account.
         * @description This endpoint returns a list of all the piggy banks connected to the account.
         */
        get: operations["listPiggyBankByAccount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/accounts/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions related to the account.
         * @description This endpoint returns a list of all the transactions connected to the account.
         */
        get: operations["listTransactionByAccount"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all attachments.
         * @description This endpoint lists all attachments.
         */
        get: operations["listAttachment"];
        put?: never;
        /**
         * Store a new attachment.
         * @description Creates a new attachment. The data required can be submitted as a JSON body or as a list of parameters. You cannot use this endpoint to upload the actual file data (see below). This endpoint only creates the attachment object.
         */
        post: operations["storeAttachment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/attachments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single attachment.
         * @description Get a single attachment. This endpoint only returns the available metadata for the attachment. Actual file data is handled in two other endpoints (see below).
         */
        get: operations["getAttachment"];
        /**
         * Update existing attachment.
         * @description Update the meta data for an existing attachment. This endpoint does not allow you to upload or download data. For that, see below.
         */
        put: operations["updateAttachment"];
        post?: never;
        /**
         * Delete an attachment.
         * @description With this endpoint you delete an attachment, including any stored file data.
         */
        delete: operations["deleteAttachment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/attachments/{id}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Download a single attachment.
         * @description This endpoint allows you to download the binary content of a transaction. It will be sent to you as a download, using the content type "application/octet-stream" and content disposition "attachment; filename=example.pdf".
         */
        get: operations["downloadAttachment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/attachments/{id}/upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Upload an attachment.
         * @description Use this endpoint to upload (and possible overwrite) the file contents of an attachment. Simply put the entire file in the body as binary data.
         */
        post: operations["uploadAttachment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all accounts of the user returned in a basic auto-complete array. */
        get: operations["getAccountsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all bills of the user returned in a basic auto-complete array. */
        get: operations["getBillsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/budgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all budgets of the user returned in a basic auto-complete array. */
        get: operations["getBudgetsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all categories of the user returned in a basic auto-complete array. */
        get: operations["getCategoriesAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/currencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all currencies of the user returned in a basic auto-complete array. */
        get: operations["getCurrenciesAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/currencies-with-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all currencies of the user returned in a basic auto-complete array. This endpoint is DEPRECATED and I suggest you DO NOT use it. */
        get: operations["getCurrenciesCodeAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/object-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all object groups of the user returned in a basic auto-complete array. */
        get: operations["getObjectGroupsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/piggy-banks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all piggy banks of the user returned in a basic auto-complete array. */
        get: operations["getPiggiesAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/piggy-banks-with-balance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all piggy banks of the user returned in a basic auto-complete array. */
        get: operations["getPiggiesBalanceAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/recurring": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all recurring transactions of the user returned in a basic auto-complete array. */
        get: operations["getRecurringAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/rule-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all rule groups of the user returned in a basic auto-complete array. */
        get: operations["getRuleGroupsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all rules of the user returned in a basic auto-complete array. */
        get: operations["getRulesAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all subscriptions of the user returned in a basic auto-complete array. */
        get: operations["getSubscriptionsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all tags of the user returned in a basic auto-complete array. */
        get: operations["getTagAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/transaction-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all transaction types returned in a basic auto-complete array. English only. */
        get: operations["getTransactionTypesAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all transaction descriptions of the user returned in a basic auto-complete array. */
        get: operations["getTransactionsAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/autocomplete/transactions-with-id": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Returns all transactions, complemented with their ID, of the user returned in a basic auto-complete array. This endpoint is DEPRECATED and I suggest you DO NOT use it. */
        get: operations["getTransactionsIDAC"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/available-budgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all available budget amounts.
         * @description Firefly III calculates the total amount of money budgeted in so-called "available budgets". This endpoint returns all of these amounts and the periods for which they are calculated.
         */
        get: operations["listAvailableBudgets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/available-budgets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single available budget.
         * @description Get a single available budget, by ID.
         */
        get: operations["getAvailableBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/batch/finish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Finish a batch of unprocessed transactions.
         * @description summary: Finish a batch of unprocessed transactions.
         */
        post: operations["finishBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all bills.
         * @description This endpoint will list all the user's bills.
         */
        get: operations["listBill"];
        put?: never;
        /**
         * Store a new bill
         * @description Creates a new bill. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeBill"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single bill.
         * @description Get a single bill.
         */
        get: operations["getBill"];
        /**
         * Update existing bill.
         * @description Update existing bill.
         */
        put: operations["updateBill"];
        post?: never;
        /**
         * Delete a bill.
         * @description Delete a bill. This will not delete any associated rules. Will not remove associated transactions. WILL remove all associated attachments.
         */
        delete: operations["deleteBill"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{id}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all attachments uploaded to the bill.
         * @description This endpoint will list all attachments linked to the bill.
         */
        get: operations["listAttachmentByBill"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{id}/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all rules associated with the bill.
         * @description This endpoint will list all rules that have an action to set the bill to this bill.
         */
        get: operations["listRuleByBill"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/bills/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions associated with the  bill.
         * @description This endpoint will list all transactions linked to this bill.
         */
        get: operations["listTransactionByBill"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budget-limits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get list of budget limits by date
         * @description Get all budget limits for for this date range.
         */
        get: operations["listBudgetLimit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all budgets.
         * @description List all the budgets the user has made. If the start date and end date are submitted as well, the "spent" array will be updated accordingly.
         */
        get: operations["listBudget"];
        put?: never;
        /**
         * Store a new budget
         * @description Creates a new budget. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeBudget"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single budget.
         * @description Get a single budget. If the start date and end date are submitted as well, the "spent" array will be updated accordingly.
         */
        get: operations["getBudget"];
        /**
         * Update existing budget.
         * @description Update existing budget. This endpoint cannot be used to set budget amount limits.
         */
        put: operations["updateBudget"];
        post?: never;
        /**
         * Delete a budget.
         * @description Delete a budget. Transactions will not be deleted.
         */
        delete: operations["deleteBudget"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/{id}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all attachments of a budget.
         * @description Lists all attachments.
         */
        get: operations["listAttachmentByBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/{id}/limits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get all limits for a budget.
         * @description Get all budget limits for this budget and the money spent, and money left. You can limit the list by submitting a date range as well. The "spent" array for each budget limit is NOT influenced by the start and end date of your query, but by the start and end date of the budget limit itself.
         */
        get: operations["listBudgetLimitByBudget"];
        put?: never;
        /**
         * Store new budget limit.
         * @description Store a new budget limit under this budget.
         */
        post: operations["storeBudgetLimit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/{id}/limits/{limitId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get single budget limit. */
        get: operations["getBudgetLimit"];
        /**
         * Update existing budget limit.
         * @description Update existing budget limit.
         */
        put: operations["updateBudgetLimit"];
        post?: never;
        /**
         * Delete a budget limit.
         * @description Delete a budget limit.
         */
        delete: operations["deleteBudgetLimit"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/{id}/limits/{limitId}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions by a budget limit ID.
         * @description List all the transactions within one budget limit. The start and end date are dictated by the budget limit.
         */
        get: operations["listTransactionByBudgetLimit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * All transactions to a budget.
         * @description Get all transactions linked to a budget, possibly limited by start and end
         */
        get: operations["listTransactionByBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/budgets/transactions-without-budget": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * All transactions without a budget.
         * @description Get all transactions NOT linked to a budget, possibly limited by start and end
         */
        get: operations["listTransactionWithoutBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all categories.
         * @description List all categories.
         */
        get: operations["listCategory"];
        put?: never;
        /**
         * Store a new category
         * @description Creates a new category. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeCategory"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single category.
         * @description Get a single category.
         */
        get: operations["getCategory"];
        /**
         * Update existing category.
         * @description Update existing category.
         */
        put: operations["updateCategory"];
        post?: never;
        /**
         * Delete a category.
         * @description Delete a category. Transactions will not be removed.
         */
        delete: operations["deleteCategory"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/categories/{id}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all attachments.
         * @description Lists all attachments.
         */
        get: operations["listAttachmentByCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/categories/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions in a category.
         * @description List all transactions in a category, optionally limited to the date ranges specified.
         */
        get: operations["listTransactionByCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chart/account/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dashboard chart with asset account balance information.
         * @description This endpoint returns the data required to generate a chart with basic asset account balance information. This is used on the dashboard.
         */
        get: operations["getChartAccountOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chart/balance/balance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dashboard chart with balance information.
         * @description This endpoint returns the data required to generate a chart with balance information.
         */
        get: operations["getChartBalance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chart/budget/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dashboard chart with budget information.
         * @description This endpoint returns the data required to generate a chart with basic budget information.
         */
        get: operations["getChartBudgetOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/chart/category/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Dashboard chart with category information.
         * @description This endpoint returns the data required to generate a chart with basic category information.
         */
        get: operations["getChartCategoryOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/configuration": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Firefly III system configuration values.
         * @description Returns all editable and not-editable configuration values for this Firefly III installation
         */
        get: operations["getConfiguration"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/configuration/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single Firefly III system configuration value
         * @description Returns one configuration variable for this Firefly III installation
         */
        get: operations["getSingleConfiguration"];
        /**
         * Update configuration value
         * @description Set a single configuration value. Not all configuration values can be updated so the list of accepted configuration variables is small.
         */
        put: operations["setConfiguration"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/cron/{cliToken}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cron job endpoint
         * @description Firefly III has one endpoint for its various cron related tasks. Send a GET to this endpoint
         *     to run the cron. The cron requires the CLI token to be present. The cron job will fire for all
         *     users.
         */
        get: operations["getCron"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all currencies.
         * @description List all currencies.
         */
        get: operations["listCurrency"];
        put?: never;
        /**
         * Store a new currency
         * @description Creates a new currency. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeCurrency"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single currency.
         * @description Get a single currency.
         */
        get: operations["getCurrency"];
        /**
         * Update existing currency.
         * @description Update existing currency.
         */
        put: operations["updateCurrency"];
        post?: never;
        /**
         * Delete a currency.
         * @description Delete a currency.
         */
        delete: operations["deleteCurrency"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all accounts with this currency.
         * @description List all accounts with this currency.
         */
        get: operations["listAccountByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/available-budgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all available budgets with this currency.
         * @description List all available budgets with this currency.
         */
        get: operations["listAvailableBudgetByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all bills with this currency.
         * @description List all bills with this currency.
         */
        get: operations["listBillByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/budget-limits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all budget limits with this currency
         * @description List all budget limits with this currency
         */
        get: operations["listBudgetLimitByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/disable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Disable a currency.
         * @description Disable a currency.
         */
        post: operations["disableCurrency"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/enable": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Enable a single currency.
         * @description Enable a single currency.
         */
        post: operations["enableCurrency"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/primary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Make currency primary currency.
         * @description Make this currency the primary currency for the current financial administration. If the currency is not enabled, it will be enabled as well.
         */
        post: operations["primaryCurrency"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/recurrences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all recurring transactions with this currency.
         * @description List all recurring transactions with this currency.
         */
        get: operations["listRecurrenceByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all rules with this currency.
         * @description List all rules with this currency.
         */
        get: operations["listRuleByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/{code}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions with this currency.
         * @description List all transactions with this currency.
         */
        get: operations["listTransactionByCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/currencies/primary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get the primary currency of the current administration.
         * @description Get the primary currency of the current administration. This replaces what was called "the user's default currency" although they are essentially the same.
         */
        get: operations["getPrimaryCurrency"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/bulk/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Bulk update transaction properties. For more information, see https://docs.firefly-iii.org/references/firefly-iii/api/specials/
         * @description Allows you to update transactions in bulk.
         */
        post: operations["bulkUpdateTransactions"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/destroy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Endpoint to destroy user data
         * @description A call to this endpoint deletes the requested data type. Use it with care and always with user permission.
         *     The demo user is incapable of using this endpoint.
         */
        delete: operations["destroyData"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export account data from Firefly III
         * @description This endpoint allows you to export your accounts from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportAccounts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export bills from Firefly III
         * @description This endpoint allows you to export your bills from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportBills"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/budgets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export budgets and budget amount data from Firefly III
         * @description This endpoint allows you to export your budgets and associated budget data from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportBudgets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export category data from Firefly III
         * @description This endpoint allows you to export your categories from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/piggy-banks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export piggy banks from Firefly III
         * @description This endpoint allows you to export your piggy banks from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportPiggies"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/recurring": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export recurring transaction data from Firefly III
         * @description This endpoint allows you to export your recurring transactions from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportRecurring"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export rule groups and rule data from Firefly III
         * @description This endpoint allows you to export your rules and rule groups from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportRules"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export tag data from Firefly III
         * @description This endpoint allows you to export your tags from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportTags"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/export/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Export transaction data from Firefly III
         * @description This endpoint allows you to export transactions from Firefly III into a file. Currently supports CSV exports only.
         */
        get: operations["exportTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/data/purge": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Endpoint to purge user data
         * @description A call to this endpoint purges all previously deleted data. Use it with care and always with user permission.
         *     The demo user is incapable of using this endpoint.
         */
        delete: operations["purgeData"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exchange-rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all exchange rates that Firefly III knows.
         * @description List exchange rates that Firefly III knows.
         */
        get: operations["listCurrencyExchangeRates"];
        put?: never;
        /**
         * Store a new currency exchange rate.
         * @description Stores a new exchange rate. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeCurrencyExchangeRate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exchange-rates/{from}/{to}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all exchange rates from/to the mentioned currencies.
         * @description List all exchange rates from/to the mentioned currencies.
         */
        get: operations["listSpecificCurrencyExchangeRates"];
        put?: never;
        post?: never;
        /**
         * Deletes ALL currency exchange rates from 'from' to 'to'.
         * @description Deletes ALL currency exchange rates from 'from' to 'to'. It's important to know that the reverse exchange rates (from 'to' to 'from') will not be deleted and Firefly III will still be able to infer the correct exchange rate from the reverse one.
         */
        delete: operations["deleteSpecificCurrencyExchangeRates"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exchange-rates/{from}/{to}/{date}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List the exchange rate for the from and to-currency on the requested date.
         * @description List the exchange rate for the from and to-currency on the requested date.
         */
        get: operations["listSpecificCurrencyExchangeRateOnDate"];
        /**
         * Update existing currency exchange rate.
         * @description Used to update a single currency exchange rate by its currency codes and date
         */
        put: operations["updateCurrencyExchangeRateByDate"];
        post?: never;
        /**
         * Delete the currency exchange rate from 'from' to 'to' on the specified date.
         * @description Delete the currency exchange rate from 'from' to 'to' on the specified date.  It's important to know that the reverse exchange rate (from 'to' to 'from') will not be deleted and Firefly III will still be able to infer the correct exchange rate from the reverse one.
         */
        delete: operations["deleteSpecificCurrencyExchangeRateOnDate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exchange-rates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List a single specific exchange rate.
         * @description List a single specific exchange rate by its ID.
         */
        get: operations["listSpecificCurrencyExchangeRate"];
        /**
         * Update existing currency exchange rate.
         * @description Used to update a single currency exchange rate by its ID. Including the from/to currency is optional.
         */
        put: operations["updateCurrencyExchangeRate"];
        post?: never;
        /**
         * Delete a specific currency exchange rate.
         * @description Delete a specific currency exchange rate by its internal ID.
         */
        delete: operations["deleteSpecificCurrencyExchangeRate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exchange-rates/by-currencies/{from}/{to}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Store new currency exchange rates under this from/to pair.
         * @description Stores a new set of exchange rates for this pair. The date is variable, and the data required can be submitted as a JSON body.
         */
        post: operations["storeCurrencyExchangeRatesByPair"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/exchange-rates/by-date/{date}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Store new currency exchange rates under this date
         * @description Stores a new set of exchange rates. The date is fixed (in the URL parameter) and the data required can be submitted as a JSON body.
         */
        post: operations["storeCurrencyExchangeRatesByDate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/asset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, grouped by asset account.
         * @description This endpoint gives a summary of the expenses made by the user, grouped by asset account.
         */
        get: operations["insightExpenseAsset"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/bill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, grouped by bill.
         * @description This endpoint gives a summary of the expenses made by the user, grouped by (any) bill.
         */
        get: operations["insightExpenseBill"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/budget": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, grouped by budget.
         * @description This endpoint gives a summary of the expenses made by the user, grouped by (any) budget.
         */
        get: operations["insightExpenseBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, grouped by category.
         * @description This endpoint gives a summary of the expenses made by the user, grouped by (any) category.
         */
        get: operations["insightExpenseCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/expense": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, grouped by expense account.
         * @description This endpoint gives a summary of the expenses made by the user, grouped by expense account.
         */
        get: operations["insightExpenseExpense"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/no-bill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, without bill.
         * @description This endpoint gives a summary of the expenses made by the user, including only expenses with no bill.
         */
        get: operations["insightExpenseNoBill"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/no-budget": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, without budget.
         * @description This endpoint gives a summary of the expenses made by the user, including only expenses with no budget.
         */
        get: operations["insightExpenseNoBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/no-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, without category.
         * @description This endpoint gives a summary of the expenses made by the user, including only expenses with no category.
         */
        get: operations["insightExpenseNoCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/no-tag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, without tag.
         * @description This endpoint gives a summary of the expenses made by the user, including only expenses with no tag.
         */
        get: operations["insightExpenseNoTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/tag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, grouped by tag.
         * @description This endpoint gives a summary of the expenses made by the user, grouped by (any) tag.
         */
        get: operations["insightExpenseTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/expense/total": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into total expenses.
         * @description This endpoint gives a sum of the total expenses made by the user.
         */
        get: operations["insightExpenseTotal"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/asset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into income, grouped by asset account.
         * @description This endpoint gives a summary of the income received by the user, grouped by asset account.
         */
        get: operations["insightIncomeAsset"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into income, grouped by category.
         * @description This endpoint gives a summary of the income received by the user, grouped by (any) category.
         */
        get: operations["insightIncomeCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/no-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into income, without category.
         * @description This endpoint gives a summary of the income received by the user, including only income with no category.
         */
        get: operations["insightIncomeNoCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/no-tag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into income, without tag.
         * @description This endpoint gives a summary of the income received by the user, including only income with no tag.
         */
        get: operations["insightIncomeNoTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/revenue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into income, grouped by revenue account.
         * @description This endpoint gives a summary of the income received by the user, grouped by revenue account.
         */
        get: operations["insightIncomeRevenue"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/tag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into income, grouped by tag.
         * @description This endpoint gives a summary of the income received by the user, grouped by (any) tag.
         */
        get: operations["insightIncomeTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/income/total": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into total income.
         * @description This endpoint gives a sum of the total income received by the user.
         */
        get: operations["insightIncomeTotal"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/transfer/asset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into transfers, grouped by account.
         * @description This endpoint gives a summary of the transfers made by the user, grouped by asset account or lability.
         */
        get: operations["insightTransfers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/transfer/category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into transfers, grouped by category.
         * @description This endpoint gives a summary of the transfers made by the user, grouped by (any) category.
         */
        get: operations["insightTransferCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/transfer/no-category": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into transfers, without category.
         * @description This endpoint gives a summary of the transfers made by the user, including only transfers with no category.
         */
        get: operations["insightTransferNoCategory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/transfer/no-tag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into expenses, without tag.
         * @description This endpoint gives a summary of the transfers made by the user, including only transfers with no tag.
         */
        get: operations["insightTransferNoTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/transfer/tag": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into transfers, grouped by tag.
         * @description This endpoint gives a summary of the transfers created by the user, grouped by (any) tag.
         */
        get: operations["insightTransferTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/insight/transfer/total": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Insight into total transfers.
         * @description This endpoint gives a sum of the total amount transfers made by the user.
         */
        get: operations["insightTransferTotal"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/link-types": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all types of links.
         * @description List all the link types the system has. These include the default ones as well as any new ones.
         */
        get: operations["listLinkType"];
        put?: never;
        /**
         * Create a new link type
         * @description Creates a new link type. The data required can be submitted as a JSON body or as a list of parameters (in key=value pairs, like a webform).
         */
        post: operations["storeLinkType"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/link-types/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get single a link type.
         * @description Returns a single link type by its ID.
         */
        get: operations["getLinkType"];
        /**
         * Update existing link type.
         * @description Used to update a single link type. All fields that are not submitted will be cleared (set to NULL). The model will tell you which fields are mandatory. You cannot update some of the system provided link types, indicated by the editable=false flag when you list it.
         */
        put: operations["updateLinkType"];
        post?: never;
        /**
         * Permanently delete link type.
         * @description Will permanently delete a link type. The links between transactions will be removed. The transactions themselves remain. You cannot delete some of the system provided link types, indicated by the editable=false flag when you list it.
         */
        delete: operations["deleteLinkType"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/link-types/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions under this link type.
         * @description List all transactions under this link type, both the inward and outward transactions.
         */
        get: operations["listTransactionByLinkType"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/object-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all object groups.
         * @description List all object groups.
         */
        get: operations["listObjectGroups"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/object-groups/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single object group.
         * @description Get a single object group.
         */
        get: operations["getObjectGroup"];
        /**
         * Update existing object group.
         * @description Update existing object group.
         */
        put: operations["updateObjectGroup"];
        post?: never;
        /**
         * Delete a object group.
         * @description Delete a object group.
         */
        delete: operations["deleteObjectGroup"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/object-groups/{id}/bills": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all bills with this object group.
         * @description List all bills with this object group.
         */
        get: operations["listBillByObjectGroup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/object-groups/{id}/piggy-banks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all piggy banks related to the object group.
         * @description This endpoint returns a list of all the piggy banks connected to the object group.
         */
        get: operations["listPiggyBankByObjectGroup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/piggy-banks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all piggy banks.
         * @description List all piggy banks.
         */
        get: operations["listPiggyBank"];
        put?: never;
        /**
         * Store a new piggy bank
         * @description Creates a new piggy bank. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storePiggyBank"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/piggy-banks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single piggy bank.
         * @description Get a single piggy bank.
         */
        get: operations["getPiggyBank"];
        /**
         * Update existing piggy bank.
         * @description Update existing piggy bank.
         */
        put: operations["updatePiggyBank"];
        post?: never;
        /**
         * Delete a piggy bank.
         * @description Delete a piggy bank.
         */
        delete: operations["deletePiggyBank"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/piggy-banks/{id}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all attachments.
         * @description Lists all attachments.
         */
        get: operations["listAttachmentByPiggyBank"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/piggy-banks/{id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all events linked to a piggy bank.
         * @description List all events linked to a piggy bank (adding and removing money).
         */
        get: operations["listEventByPiggyBank"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all users preferences.
         * @description List all of the preferences of the user.
         */
        get: operations["listPreference"];
        put?: never;
        /**
         * Store a new preference for this user.
         * @description This endpoint creates a new preference. The name and data are free-format, and entirely up to you. If the preference is not used in Firefly III itself it may not be configurable through the user interface, but you can use this endpoint to persist custom data for your own app.
         */
        post: operations["storePreference"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/preferences/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Return a single preference.
         * @description Return a single preference and the value.
         */
        get: operations["getPreference"];
        /**
         * Update preference
         * @description Update a user's preference.
         */
        put: operations["updatePreference"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/recurrences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all recurring transactions.
         * @description List all recurring transactions.
         */
        get: operations["listRecurrence"];
        put?: never;
        /**
         * Store a new recurring transaction
         * @description Creates a new recurring transaction. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeRecurrence"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/recurrences/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single recurring transaction.
         * @description Get a single recurring transaction.
         */
        get: operations["getRecurrence"];
        /**
         * Update existing recurring transaction.
         * @description Update existing recurring transaction.
         */
        put: operations["updateRecurrence"];
        post?: never;
        /**
         * Delete a recurring transaction.
         * @description Delete a recurring transaction. Transactions created by the recurring transaction will not be deleted.
         */
        delete: operations["deleteRecurrence"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/recurrences/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions created by a recurring transaction.
         * @description List all transactions created by a recurring transaction, optionally limited to the date ranges specified.
         */
        get: operations["listTransactionByRecurrence"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/recurrences/{id}/trigger": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Trigger the creation of a transaction for a specific recurring transaction
         * @description Trigger the creation of a transaction for a specific recurring transaction. All recurrences have a set of future occurrences. For those moments, you can trigger the creation of the transaction. That means the transaction will be created NOW, instead of on the indicated date. The transaction will be dated to _today_.
         *
         *     So, if you recurring transaction that occurs every Monday, you can trigger the creation of a transaction for Monday in two weeks, today. On that Monday two weeks from now, no transaction will be created. Instead, the transaction is created right now, and dated _today_.
         */
        post: operations["triggerRecurrenceRecurrence"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rule-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all rule groups.
         * @description List all rule groups.
         */
        get: operations["listRuleGroup"];
        put?: never;
        /**
         * Store a new rule group.
         * @description Creates a new rule group. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeRuleGroup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rule-groups/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single rule group.
         * @description Get a single rule group. This does not include the rules. For that, see below.
         */
        get: operations["getRuleGroup"];
        /**
         * Update existing rule group.
         * @description Update existing rule group.
         */
        put: operations["updateRuleGroup"];
        post?: never;
        /**
         * Delete a rule group.
         * @description Delete a rule group.
         */
        delete: operations["deleteRuleGroup"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rule-groups/{id}/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List rules in this rule group.
         * @description List rules in this rule group.
         */
        get: operations["listRuleByGroup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rule-groups/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Test which transactions would be hit by the rule group. No changes will be made.
         * @description Test which transactions would be hit by the rule group. No changes will be made. Limit the result if you want to.
         */
        get: operations["testRuleGroup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rule-groups/{id}/trigger": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Fire the rule group on your transactions.
         * @description Fire the rule group on your transactions. Changes will be made by the rules in the rule group. Limit the result if you want to.
         */
        post: operations["fireRuleGroup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all rules.
         * @description List all rules.
         */
        get: operations["listRule"];
        put?: never;
        /**
         * Store a new rule
         * @description Creates a new rule. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeRule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single rule.
         * @description Get a single rule.
         */
        get: operations["getRule"];
        /**
         * Update existing rule.
         * @description Update existing rule.
         */
        put: operations["updateRule"];
        post?: never;
        /**
         * Delete an rule.
         * @description Delete an rule.
         */
        delete: operations["deleteRule"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rules/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Test which transactions would be hit by the rule. No changes will be made.
         * @description Test which transactions would be hit by the rule. No changes will be made. Limit the result if you want to.
         */
        get: operations["testRule"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/rules/{id}/trigger": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Fire the rule on your transactions.
         * @description Fire the rule group on your transactions. Changes will be made by the rules in the group. Limit the result if you want to.
         */
        post: operations["fireRule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/search/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search for accounts
         * @description Search for accounts
         */
        get: operations["searchAccounts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/search/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Search for transactions
         * @description Searches through the users transactions.
         */
        get: operations["searchTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/summary/basic": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Returns basic sums of the users data.
         * @description Returns basic sums of the users data, like the net worth, spent and earned amounts. It is multi-currency, and is used in Firefly III to populate the dashboard.
         */
        get: operations["getBasicSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tags": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all tags.
         * @description List all of the user's tags.
         */
        get: operations["listTag"];
        put?: never;
        /**
         * Store a new tag
         * @description Creates a new tag. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeTag"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tags/{tag}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single tag.
         * @description Get a single tag.
         */
        get: operations["getTag"];
        /**
         * Update existing tag.
         * @description Update existing tag.
         */
        put: operations["updateTag"];
        post?: never;
        /**
         * Delete an tag.
         * @description Delete an tag.
         */
        delete: operations["deleteTag"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tags/{tag}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all attachments.
         * @description Lists all attachments.
         */
        get: operations["listAttachmentByTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tags/{tag}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transactions with this tag.
         * @description List all transactions with this tag.
         */
        get: operations["listTransactionByTag"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transaction-journals/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single transaction, based on one of the underlying transaction journals (transaction splits).
         * @description Get a single transaction by underlying journal (split).
         */
        get: operations["getTransactionByJournal"];
        put?: never;
        post?: never;
        /**
         * Delete split from transaction
         * @description Delete an individual journal (split) from a transaction.
         */
        delete: operations["deleteTransactionJournal"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transaction-journals/{id}/links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all the transaction links for an individual journal (individual split).
         * @description Lists all the transaction links for an individual journal (a split). Don't use the group ID, you need the actual underlying journal (the split).
         */
        get: operations["listLinksByJournal"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transaction-links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all transaction links.
         * @description List all the transaction links.
         */
        get: operations["listTransactionLink"];
        put?: never;
        /**
         * Create a new link between transactions
         * @description Store a new link between two transactions. For this end point you need the journal_id from a transaction.
         */
        post: operations["storeTransactionLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transaction-links/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single link.
         * @description Returns a single link by its ID.
         */
        get: operations["getTransactionLink"];
        /**
         * Update an existing link between transactions.
         * @description Used to update a single existing link.
         */
        put: operations["updateTransactionLink"];
        post?: never;
        /**
         * Permanently delete link between transactions.
         * @description Will permanently delete link. Transactions remain.
         */
        delete: operations["deleteTransactionLink"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all the user's transactions.
         * @description List all the user's transactions.
         */
        get: operations["listTransaction"];
        put?: never;
        /**
         * Store a new transaction
         * @description Creates a new transaction. The data required can be submitted as a JSON body or as a list of parameters.
         */
        post: operations["storeTransaction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transactions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single transaction.
         * @description Get a single transaction.
         */
        get: operations["getTransaction"];
        /**
         * Update existing transaction. For more information, see https://docs.firefly-iii.org/references/firefly-iii/api/specials/
         * @description Update an existing transaction.
         */
        put: operations["updateTransaction"];
        post?: never;
        /**
         * Delete a transaction.
         * @description Delete a transaction.
         */
        delete: operations["deleteTransaction"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transactions/{id}/attachments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all attachments.
         * @description Lists all attachments.
         */
        get: operations["listAttachmentByTransaction"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/transactions/{id}/piggy-bank-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lists all piggy bank events.
         * @description Lists all piggy bank events.
         */
        get: operations["listEventByTransaction"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/user-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all the user groups available to this user.
         * @description List all the user groups available to this user. These are essentially the 'financial administrations' that Firefly III supports.
         */
        get: operations["listUserGroups"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/user-groups/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single user group.
         * @description Returns a single user group by its ID.
         */
        get: operations["getUserGroup"];
        /**
         * Update an existing user group.
         * @description Used to update a single user group. The available fields are still limited.
         */
        put: operations["updateUserGroup"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all users.
         * @description List all the users in this instance of Firefly III.
         */
        get: operations["listUser"];
        put?: never;
        /**
         * Store a new user
         * @description Creates a new user. The data required can be submitted as a JSON body or as a list of parameters. The user will be given a random password, which they can reset using the "forgot password" function.
         */
        post: operations["storeUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single user.
         * @description Gets all info of a single user.
         */
        get: operations["getUser"];
        /**
         * Update an existing user's information.
         * @description Update existing user.
         */
        put: operations["updateUser"];
        post?: never;
        /**
         * Delete a user.
         * @description Delete a user. You cannot delete the user you're authenticated with. This cannot be undone. Be careful.
         */
        delete: operations["deleteUser"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all webhooks.
         * @description List all the user's webhooks.
         */
        get: operations["listWebhook"];
        put?: never;
        /**
         * Store a new webhook
         * @description Creates a new webhook. The data required can be submitted as a JSON body or as a list of parameters. The webhook will be given a random secret.
         */
        post: operations["storeWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single webhook.
         * @description Gets all info of a single webhook.
         */
        get: operations["getWebhook"];
        /**
         * Update existing webhook.
         * @description Update an existing webhook's information. If you wish to reset the secret, submit any value as the "secret". Firefly III will take this as a hint and reset the secret of the webhook.
         */
        put: operations["updateWebhook"];
        post?: never;
        /**
         * Delete a webhook.
         * @description Delete a webhook.
         */
        delete: operations["deleteWebhook"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get all the messages of a single webhook.
         * @description When a webhook is triggered the actual message that will be send is stored in a "message". You can view and analyse these messages.
         */
        get: operations["getWebhookMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}/messages/{messageId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single message from a webhook.
         * @description When a webhook is triggered it will store the actual content of the webhook in a webhook message. You can view and analyse a single one using this endpoint.
         */
        get: operations["getSingleWebhookMessage"];
        put?: never;
        post?: never;
        /**
         * Delete a webhook message.
         * @description Delete a webhook message. Any time a webhook is triggered the message is stored before it's sent. You can delete them before or after sending.
         */
        delete: operations["deleteWebhookMessage"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}/messages/{messageId}/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get all the failed attempts of a single webhook message.
         * @description When a webhook message fails to send it will store the failure in an "attempt". You can view and analyse these. Webhook messages that receive too many attempts (failures) will not be sent again. You must first clear out old attempts before the message can go out again.
         */
        get: operations["getWebhookMessageAttempts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}/messages/{messageId}/attempts/{attemptId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a single failed attempt from a single webhook message.
         * @description When a webhook message fails to send it will store the failure in an "attempt". You can view and analyse these. Webhooks messages that receive too many attempts (failures) will not be fired. You must first clear out old attempts and try again. This endpoint shows you the details of a single attempt. The ID of the attempt must match the corresponding webhook and webhook message.
         */
        get: operations["getSingleWebhookMessageAttempt"];
        put?: never;
        post?: never;
        /**
         * Delete a webhook attempt.
         * @description Delete a webhook message attempt. If you delete all attempts for a webhook message, Firefly III will (once again) assume all is well with the webhook message and will try to send it again.
         */
        delete: operations["deleteWebhookMessageAttempt"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Submit messages for a webhook.
         * @description This endpoint will submit any open messages for this webhook. This is an asynchronous operation, so you can't see the result. Refresh the webhook message and/or the webhook message attempts to see the results. This may take some time if the webhook receiver is slow.
         */
        post: operations["submitWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/{id}/trigger-transaction/{transactionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Trigger webhook for a given transaction.
         * @description This endpoint will execute this webhook for a given transaction ID. This is an asynchronous operation, so you can't see the result. Refresh the webhook message and/or the webhook message attempts to see the results. This may take some time if the webhook receiver is slow.
         */
        post: operations["triggerTransactionWebhook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        AccountArray: {
            data: components["schemas"]["AccountRead"][];
            meta: components["schemas"]["Meta"];
        };
        AccountProperties: {
            /**
             * Format: string
             * @example 7009312345678
             */
            account_number?: string | null;
            account_role?: components["schemas"]["AccountRoleProperty"];
            /**
             * @default true
             * @example false
             */
            active: boolean;
            /**
             * Format: amount
             * @description If you submit a start AND end date, this will be the difference between those two moments.
             * @example 123.45
             */
            readonly balance_difference?: string;
            /**
             * Format: string
             * @example BOFAUS3N
             */
            bic?: string | null;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            credit_card_type?: components["schemas"]["CreditCardTypeProperty"];
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: amount
             * @description The current balance of the account in the account's currency. If the account has no currency, this is the balance in the administration's primary currency. Either way, the `currency_*` fields reflect the currency used.
             * @example 123.45
             */
            readonly current_balance?: string;
            /**
             * Format: date-time
             * @description The timestamp for this date is always 23:59:59, to indicate it's the balance at the very END of that particular day.
             * @example 2026-03-31T23:59:59+00:00
             */
            readonly current_balance_date?: string;
            /**
             * Format: amount
             * @description In liability accounts (loans, debts and mortgages), this is the amount of debt in the account's currency (see the `currency_*` fields). In asset accounts, this is NULL.
             * @example 1012.12
             */
            debt_amount?: string | null;
            /**
             * Format: iban
             * @example GB98MIDL07009312345678
             */
            iban?: string | null;
            /**
             * @default true
             * @example true
             */
            include_net_worth: boolean;
            /**
             * Format: string
             * @description Mandatory when type is liability. Interest percentage.
             * @example 5.3
             */
            interest?: string | null;
            interest_period?: components["schemas"]["InterestPeriodProperty"];
            /**
             * Format: date-time
             * @description Last activity of the account.
             * @example 2026-03-01T00:00:00+00:00
             */
            last_activity?: string | null;
            /**
             * Format: double
             * @description Latitude of the accounts's location, if applicable. Can be used to draw a map.
             * @example 51.983333
             */
            latitude?: number | null;
            liability_direction?: components["schemas"]["LiabilityDirectionProperty"];
            liability_type?: components["schemas"]["LiabilityTypeProperty"];
            /**
             * Format: double
             * @description Latitude of the accounts's location, if applicable. Can be used to draw a map.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: date-time
             * @description Mandatory when the account_role is ccAsset. Moment at which CC payment installments are asked for by the bank.
             * @example 2026-03-01T00:00:00+00:00
             */
            monthly_payment_date?: string | null;
            /**
             * Format: string
             * @example My checking account
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: int32
             * @description The order of the group. At least 1, for the highest sorting.
             * @example 5
             */
            readonly object_group_order?: number | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            /**
             * @description Indicates whether the account has a currency setting. If false, the account uses the administration's primary currency. Asset accounts and liability accounts always have a currency setting, while expense and revenue accounts do not.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: amount
             * @description Represents the opening balance, the initial amount this account holds in the currency of the account or the administration's primary currency if the account has no currency. Either way, the `currency_*` fields reflect the currency used.
             * @example -1012.12
             */
            opening_balance?: string;
            /**
             * Format: date-time
             * @description Represents the date of the opening balance.
             * @example 2026-03-01T00:00:00+00:00
             */
            opening_balance_date?: string | null;
            /**
             * Format: int32
             * @description Order of the account. Is NULL if account is not asset or liability.
             * @example 1
             */
            order?: number | null;
            /**
             * Format: amount
             * @description If you submit a start AND end date, this will be the difference in the currency of the account or the administration's primary currency between those two moments.
             * @example 123.45
             */
            readonly pc_balance_difference?: string | null;
            /**
             * Format: amount
             * @description The current balance of the account in the administration's primary currency. The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example 123.45
             */
            readonly pc_current_balance?: string | null;
            /**
             * Format: amount
             * @description In liability accounts (loans, debts and mortgages), this is the amount of debt in the administration's primary currency (see the `currency_*` fields. In asset accounts, this is NULL.
             * @example 1012.12
             */
            pc_debt_amount?: string | null;
            /**
             * Format: amount
             * @description The opening balance of the account in the administration's primary currency (pc). The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example -1012.12
             */
            pc_opening_balance?: string;
            /**
             * Format: amount
             * @description The virtual balance of the account in the administration's primary currency (pc). The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example 123.45
             */
            pc_virtual_balance?: string;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            type: components["schemas"]["ShortAccountTypeProperty"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: amount
             * @description The virtual balance of the account in the account's currency or the administration's primary currency if the account has no currency.
             * @example 123.45
             */
            virtual_balance?: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels.
             * @example 6
             */
            zoom_level?: number | null;
        };
        AccountRead: {
            attributes: components["schemas"]["AccountProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example accounts
             */
            type: string;
        };
        /**
         * Format: string
         * @description Is only mandatory when the type is asset.
         * @example defaultAsset
         * @enum {string|null}
         */
        AccountRoleProperty: "defaultAsset" | "sharedAsset" | "savingAsset" | "ccAsset" | "cashWalletAsset" | null;
        /** @enum {string} */
        AccountSearchFieldFilter: "all" | "iban" | "name" | "number" | "id";
        AccountSingle: {
            data: components["schemas"]["AccountRead"];
        };
        AccountStore: {
            /**
             * Format: string
             * @example 7009312345678
             */
            account_number?: string | null;
            account_role?: components["schemas"]["AccountRoleProperty"];
            /**
             * @description If omitted, defaults to true.
             * @default true
             * @example false
             */
            active: boolean;
            /**
             * Format: string
             * @example BOFAUS3N
             */
            bic?: string | null;
            credit_card_type?: components["schemas"]["CreditCardTypeProperty"];
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example 12
             */
            currency_id?: string;
            /**
             * Format: iban
             * @example GB98MIDL07009312345678
             */
            iban?: string | null;
            /**
             * @description If omitted, defaults to true.
             * @default true
             * @example true
             */
            include_net_worth: boolean;
            /**
             * Format: string
             * @description Mandatory when type is liability. Interest percentage.
             * @default 0
             * @example 5.3
             */
            interest: string | null;
            interest_period?: components["schemas"]["InterestPeriodProperty"];
            /**
             * Format: double
             * @description Latitude of the accounts's location, if applicable. Can be used to draw a map.
             * @example 51.983333
             */
            latitude?: number | null;
            liability_direction?: components["schemas"]["LiabilityDirectionProperty"];
            liability_type?: components["schemas"]["LiabilityTypeProperty"];
            /**
             * Format: double
             * @description Latitude of the accounts's location, if applicable. Can be used to draw a map.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: date-time
             * @description Mandatory when the account_role is ccAsset. Moment at which CC payment installments are asked for by the bank.
             * @example 2026-03-01T00:00:00+00:00
             */
            monthly_payment_date?: string | null;
            /**
             * Format: string
             * @example My checking account
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: amount
             * @description Represents the opening balance, the initial amount this account holds.
             * @example -1012.12
             */
            opening_balance?: string;
            /**
             * Format: date-time
             * @description Represents the date of the opening balance.
             * @example 2026-03-01T00:00:00+00:00
             */
            opening_balance_date?: string | null;
            /**
             * Format: int32
             * @description Order of the account
             * @example 1
             */
            order?: number;
            type: components["schemas"]["ShortAccountTypeProperty"];
            /**
             * Format: amount
             * @example 123.45
             */
            virtual_balance?: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels.
             * @example 6
             */
            zoom_level?: number | null;
        };
        /** @enum {string} */
        AccountTypeFilter: "all" | "asset" | "cash" | "expense" | "revenue" | "special" | "hidden" | "liability" | "liabilities" | "Default account" | "Cash account" | "Asset account" | "Expense account" | "Revenue account" | "Initial balance account" | "Beneficiary account" | "Import account" | "Reconciliation account" | "Loan" | "Debt" | "Mortgage";
        /**
         * Format: string
         * @example Asset account
         * @enum {string}
         */
        AccountTypeProperty: "Default account" | "Cash account" | "Asset account" | "Expense account" | "Revenue account" | "Initial balance account" | "Beneficiary account" | "Import account" | "Reconciliation account" | "Loan" | "Debt" | "Mortgage";
        AccountUpdate: {
            /**
             * Format: string
             * @example 7009312345678
             */
            account_number?: string | null;
            account_role?: components["schemas"]["AccountRoleProperty"];
            /**
             * @description If omitted, defaults to true.
             * @default true
             * @example false
             */
            active: boolean;
            /**
             * Format: string
             * @example BOFAUS3N
             */
            bic?: string | null;
            credit_card_type?: components["schemas"]["CreditCardTypeProperty"];
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example 12
             */
            currency_id?: string;
            /**
             * Format: iban
             * @example GB98MIDL07009312345678
             */
            iban?: string | null;
            /**
             * @description If omitted, defaults to true.
             * @default true
             * @example true
             */
            include_net_worth: boolean;
            /**
             * Format: string
             * @description Mandatory when type is liability. Interest percentage.
             * @example 5.3
             */
            interest?: string | null;
            interest_period?: components["schemas"]["InterestPeriodProperty"];
            /**
             * Format: double
             * @description Latitude of the account's location, if applicable. Can be used to draw a map. If omitted, the existing location will be kept. If submitted as NULL, the current location will be removed.
             * @example 51.983333
             */
            latitude?: number | null;
            liability_type?: components["schemas"]["LiabilityTypeProperty"];
            /**
             * Format: double
             * @description Latitude of the account's location, if applicable. Can be used to draw a map. If omitted, the existing location will be kept. If submitted as NULL, the current location will be removed.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: date-time
             * @description Mandatory when the account_role is ccAsset. Moment at which CC payment installments are asked for by the bank.
             * @example 2026-03-01T00:00:00+00:00
             */
            monthly_payment_date?: string | null;
            /**
             * Format: string
             * @example My checking account
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: amount
             * @example -1012.12
             */
            opening_balance?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            opening_balance_date?: string | null;
            /**
             * Format: int32
             * @description Order of the account
             * @example 1
             */
            order?: number;
            /**
             * Format: amount
             * @example 123.45
             */
            virtual_balance?: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels. If omitted, the existing location will be kept. If submitted as NULL, the current location will be removed.
             * @example 6
             */
            zoom_level?: number | null;
        };
        ArrayEntryWithCurrencyAndSum: {
            /**
             * Format: string
             * @example USD
             */
            currency_code?: string;
            /**
             * Format: int32
             * @description Number of decimals supported by the currency
             * @example 2
             */
            currency_decimal_places?: number;
            /**
             * Format: string
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @example $
             */
            currency_symbol?: string;
            /**
             * Format: amount
             * @description The amount earned, spent or transferred.
             * @example 123.45
             */
            sum?: string;
        };
        /**
         * Format: string
         * @description The object class to which the attachment must be linked.
         * @example Bill
         * @enum {string}
         */
        AttachableType: "Account" | "Budget" | "Bill" | "TransactionJournal" | "PiggyBank" | "Tag";
        AttachmentArray: {
            data: components["schemas"]["AttachmentRead"][];
            meta: components["schemas"]["Meta"];
        };
        AttachmentProperties: {
            /**
             * Format: string
             * @description ID of the model this attachment is linked to.
             * @example 134
             */
            attachable_id?: string;
            attachable_type?: components["schemas"]["AttachableType"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @example https://demo.firefly-iii.org/api/v1/attachments/191/download
             */
            download_url?: string;
            /**
             * Format: string
             * @example file.pdf
             */
            filename?: string;
            /**
             * Format: string
             * @description Hash of the file for basic duplicate detection.
             * @example 0c3f95f34370baa88f9fd9a671fea305
             */
            hash?: string;
            /**
             * Format: string
             * @example application/pdf
             */
            readonly mime?: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @example 48211
             */
            readonly size?: number;
            /**
             * Format: string
             * @example Some PDF file
             */
            title?: string | null;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @example https://demo.firefly-iii.org/api/v1/attachments/191/download
             */
            upload_url?: string;
        };
        AttachmentRead: {
            attributes: components["schemas"]["AttachmentProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example attachments
             */
            type: string;
        };
        AttachmentSingle: {
            data: components["schemas"]["AttachmentRead"];
        };
        AttachmentStore: {
            /**
             * Format: string
             * @description ID of the model this attachment is linked to.
             * @example 134
             */
            attachable_id: string;
            attachable_type: components["schemas"]["AttachableType"];
            /**
             * Format: string
             * @example file.pdf
             */
            filename: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @example Some PDF file
             */
            title?: string;
        };
        AttachmentUpdate: {
            /**
             * Format: string
             * @example file.pdf
             */
            filename?: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @example Some PDF file
             */
            title?: string;
        };
        /**
         * Format: string
         * @description Period for the auto budget
         * @example monthly
         * @enum {string|null}
         */
        AutoBudgetPeriod: "daily" | "weekly" | "monthly" | "quarterly" | "half-year" | "yearly" | null;
        /**
         * Format: string
         * @description The type of auto-budget that Firefly III must create.
         * @example reset
         * @enum {string|null}
         */
        AutoBudgetType: "reset" | "rollover" | "none" | null;
        AutocompleteAccount: {
            /**
             * Format: string
             * @description Code for the currency used by this account. Even if "convertToPrimary" is on, the account currency code is displayed here.
             * @example USD
             */
            account_currency_code?: string;
            /**
             * Format: int32
             * @description Number of decimal places for the currency used by this account. Even if "convertToPrimary" is on, the account currency code is displayed here.
             * @example 2
             */
            account_currency_decimal_places?: number;
            /**
             * Format: string
             * @description ID for the currency used by this account. Even if "convertToPrimary" is on, the account currency ID is displayed here.
             * @example 2
             */
            account_currency_id?: string;
            /**
             * Format: string
             * @description Name for the currency used by this account. Even if "convertToPrimary" is on, the account currency name is displayed here.
             * @example US Dollar
             */
            account_currency_name?: string;
            /**
             * Format: string
             * @description Code for the currency used by this account. Even if "convertToPrimary" is on, the account currency code is displayed here.
             * @example $
             */
            account_currency_symbol?: string;
            /**
             * @description Is the bill active or not?
             * @example true
             */
            active?: boolean;
            /**
             * Format: string
             * @description Currency code for the currency used by this account. If the user prefers amounts converted to their primary currency, this primary currency is used instead.
             * @example EUR
             */
            currency_code: string;
            /**
             * Format: int32
             * @description Number of decimal places for the currency used by this account. If the user prefers amounts converted to their primary currency, this primary currency is used instead.
             * @example 2
             */
            currency_decimal_places: number;
            /**
             * Format: string
             * @description ID for the currency used by this account. If the user prefers amounts converted to their primary currency, this primary currency is used instead.
             * @example 12
             */
            currency_id: string;
            /**
             * Format: string
             * @description Currency name for the currency used by this account. If the user prefers amounts converted to their primary currency, this primary currency is used instead.
             * @example Euro
             */
            currency_name: string;
            /**
             * Format: string
             * @description Currency symbol for the currency used by this account. If the user prefers amounts converted to their primary currency, this primary currency is used instead.
             * @example $
             */
            currency_symbol: string;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the account found by an auto-complete search.
             * @example Checking Account
             */
            name: string;
            /**
             * Format: string
             * @description Asset accounts and liabilities have a second field with the given date's account balance in the account currency or primary currency.
             * @example Checking Account ($123.45)
             */
            name_with_balance: string;
            /**
             * Format: string
             * @description Account type of the account found by the auto-complete search.
             * @example Asset account
             */
            type: string;
        };
        AutocompleteAccountArray: components["schemas"]["AutocompleteAccount"][];
        AutocompleteBill: {
            /**
             * @description Is the bill active or not?
             * @example true
             */
            active?: boolean;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the bill found by an auto-complete search.
             * @example Yearly bill
             */
            name: string;
        };
        AutocompleteBillArray: components["schemas"]["AutocompleteBill"][];
        AutocompleteBudget: {
            /**
             * @description Is the budget active or not?
             * @example true
             */
            active?: boolean;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the budget found by an auto-complete search.
             * @example Groceries
             */
            name: string;
        };
        AutocompleteBudgetArray: components["schemas"]["AutocompleteBudget"][];
        AutocompleteCategory: {
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the category found by an auto-complete search.
             * @example Category X
             */
            name: string;
        };
        AutocompleteCategoryArray: components["schemas"]["AutocompleteCategory"][];
        AutocompleteCurrency: {
            /**
             * Format: string
             * @description Currency code.
             * @example EUR
             */
            code: string;
            /**
             * Format: int32
             * @example 2
             */
            decimal_places: number;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Currency name.
             * @example Currency name
             */
            name: string;
            /**
             * Format: string
             * @example $
             */
            symbol: string;
        };
        AutocompleteCurrencyArray: components["schemas"]["AutocompleteCurrency"][];
        AutocompleteCurrencyCode: {
            /**
             * Format: string
             * @description Currency code.
             * @example EUR
             */
            code: string;
            /**
             * Format: int32
             * @example 2
             */
            decimal_places: number;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Currency name with the code between brackets.
             * @example Currency name (XCN)
             */
            name: string;
            /**
             * Format: string
             * @example $
             */
            symbol: string;
        };
        AutocompleteCurrencyCodeArray: components["schemas"]["AutocompleteCurrencyCode"][];
        AutocompleteObjectGroup: {
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Title of the object group found by an auto-complete search.
             * @example Object Group one
             */
            name: string;
            /**
             * Format: string
             * @description Title of the object group found by an auto-complete search.
             * @example Object Group one
             */
            title: string;
        };
        AutocompleteObjectGroupArray: components["schemas"]["AutocompleteObjectGroup"][];
        AutocompletePiggy: {
            /**
             * Format: string
             * @description Currency code for this piggy bank. This will always be the currency of the piggy bank, never the user's primary currency.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @description Number of decimal places for the currency used by this piggy bank. This will always be the currency of the piggy bank, never the user's primary currency.
             * @example 2
             */
            currency_decimal_places?: number;
            /**
             * Format: string
             * @description Currency ID for this piggy bank. This will always be the currency of the piggy bank, never the user's primary currency.
             * @example 12
             */
            currency_id?: string;
            /**
             * Format: string
             * @description Currency name for the currency used by this piggy bank. This will always be the currency of the piggy bank, never the user's primary currency.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            currency_symbol?: string;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the piggy bank found by an auto-complete search.
             * @example New couch
             */
            name: string;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
        };
        AutocompletePiggyArray: components["schemas"]["AutocompletePiggy"][];
        AutocompletePiggyBalance: {
            /**
             * Format: string
             * @description Currency code for the currency used by this piggy bank. This will always be the piggy bank's currency, never the primary currency.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @description Currency decimal places for the currency used by this piggy bank. This will always be the piggy bank's currency, never the primary currency.
             * @example 2
             */
            currency_decimal_places?: number;
            /**
             * Format: string
             * @description Currency ID for the currency used by this piggy bank. This will always be the piggy bank's currency, never the primary currency.
             * @example 12
             */
            currency_id?: string;
            /**
             * Format: string
             * @description Currency symbol for the currency used by this piggy bank. This will always be the piggy bank's currency, never the primary currency.
             * @example $
             */
            currency_symbol?: string;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the piggy bank found by an auto-complete search.
             * @example New couch
             */
            name: string;
            /**
             * Format: string
             * @description Name of the piggy bank found by an auto-complete search, including the currently saved amount and the target amount.
             * @example New couch ($234.56 / $600)
             */
            name_with_balance?: string;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
        };
        AutocompletePiggyBalanceArray: components["schemas"]["AutocompletePiggyBalance"][];
        AutocompleteRecurrence: {
            /**
             * @description Is the recurring transaction active or not?
             * @example true
             */
            active?: boolean;
            /**
             * Format: string
             * @description Description of the recurrence found by auto-complete.
             * @example Should trigger daily.
             */
            description?: string;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the recurrence found by an auto-complete search.
             * @example Yearly bill
             */
            name: string;
        };
        AutocompleteRecurrenceArray: components["schemas"]["AutocompleteRecurrence"][];
        AutocompleteRule: {
            /**
             * @description Is the bill active or not?
             * @example true
             */
            active?: boolean;
            /**
             * Format: string
             * @description Description of the rule found by auto-complete.
             * @example Useful rule.
             */
            description?: string;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the rule found by an auto-complete search.
             * @example Rule one
             */
            name: string;
        };
        AutocompleteRuleArray: components["schemas"]["AutocompleteRule"][];
        AutocompleteRuleGroup: {
            /**
             * @description Is the bill active or not?
             * @example true
             */
            active?: boolean;
            /**
             * Format: string
             * @description Description of the rule group found by auto-complete.
             * @example Some rule group.
             */
            description?: string;
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the rule group found by an auto-complete search.
             * @example Rule group one
             */
            name: string;
        };
        AutocompleteRuleGroupArray: components["schemas"]["AutocompleteRuleGroup"][];
        AutocompleteTag: {
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Name of the tag found by an auto-complete search.
             * @example too-expensive-tag-example
             */
            name: string;
            /**
             * Format: string
             * @description Name of the tag found by an auto-complete search.
             * @example too-expensive-tag-example
             */
            tag: string;
        };
        AutocompleteTagArray: components["schemas"]["AutocompleteTag"][];
        AutocompleteTransaction: {
            /**
             * Format: string
             * @description Transaction description
             * @example Transaction
             */
            description: string;
            /**
             * Format: string
             * @description The ID of a transaction journal (basically a single split).
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Transaction description
             * @example Transaction
             */
            name: string;
            /**
             * Format: string
             * @description The ID of the underlying transaction group.
             * @example 2
             */
            transaction_group_id?: string;
        };
        AutocompleteTransactionArray: components["schemas"]["AutocompleteTransaction"][];
        AutocompleteTransactionID: {
            /**
             * Format: string
             * @description Transaction description with ID in the name.
             * @example #12: Transaction
             */
            description: string;
            /**
             * Format: string
             * @description The ID of a transaction journal (basically a single split).
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Transaction description with ID in the name.
             * @example #12: Transaction
             */
            name: string;
            /**
             * Format: string
             * @description The ID of the underlying transaction group.
             * @example 2
             */
            transaction_group_id?: string;
        };
        AutocompleteTransactionIDArray: components["schemas"]["AutocompleteTransactionID"][];
        AutocompleteTransactionType: {
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Type of the object found by an auto-complete search.
             * @example Withdrawal
             */
            name: string;
            /**
             * Format: string
             * @description Name of the object found by an auto-complete search.
             * @example Withdrawal
             */
            type: string;
        };
        AutocompleteTransactionTypeArray: components["schemas"]["AutocompleteTransactionType"][];
        AvailableBudgetArray: {
            data: components["schemas"]["AvailableBudgetRead"][];
            meta: components["schemas"]["Meta"];
        };
        AvailableBudgetProperties: {
            /**
             * Format: amount
             * @description The amount of this available budget in the currency of this available budget.
             * @example 123.45
             */
            amount?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @description End date of the available budget.
             * @example 2026-03-31T23:59:59+00:00
             */
            end?: string;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: amount
             * @description The amount of this available budget in the primary currency (pc) of this administration.
             * @example 123.45
             */
            pc_amount?: string;
            /** @description The amount spent in budgets in the primary currency (pc) of this administration. */
            readonly pc_spent_in_budgets?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /** @description The amount spent outside of budgets in the primary currency (pc) of this administration. */
            readonly pc_spent_outside_budgets?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            readonly spent_in_budgets?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            readonly spent_outside_budgets?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: date-time
             * @description Start date of the available budget.
             * @example 2026-03-01T00:00:00+00:00
             */
            start?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        AvailableBudgetRead: {
            attributes: components["schemas"]["AvailableBudgetProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example available_budgets
             */
            type: string;
        };
        AvailableBudgetSingle: {
            data: components["schemas"]["AvailableBudgetRead"];
        };
        BadRequestResponse: {
            /**
             * Format: string
             * @example BadRequestHttpException
             */
            exception?: string;
            /**
             * Format: string
             * @example Bad Request
             */
            message?: string;
        };
        BasicSummary: {
            [key: string]: components["schemas"]["BasicSummaryEntry"];
        };
        BasicSummaryEntry: {
            /**
             * Format: string
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @description Number of decimals for the associated currency.
             * @example 2
             */
            currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the associated currency.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @example $
             */
            currency_symbol?: string;
            /**
             * Format: string
             * @description This is a reference to the type of info shared, not influenced by translations or user preferences. The EUR value is a reference to the currency code. Possibilities are: balance-in-ABC, spent-in-ABC, earned-in-ABC, bills-paid-in-ABC, bills-unpaid-in-ABC, left-to-spend-in-ABC and net-worth-in-ABC.
             * @example balance-in-EUR
             */
            key?: string;
            /**
             * Format: string
             * @description Reference to a font-awesome icon without the fa- part.
             * @example balance-scale
             */
            local_icon?: string;
            /**
             * Format: double
             * @description The amount as a float.
             * @example 123.45
             */
            monetary_value?: number;
            /**
             * @description True if there are no available budgets available.
             * @example false
             */
            no_available_budgets?: boolean;
            /**
             * Format: string
             * @description A short explanation of the amounts origin. Already formatted according to the locale of the user or translated, if relevant.
             * @example $20 + $-40
             */
            sub_title?: string;
            /**
             * Format: string
             * @description A translated title for the information shared.
             * @example Balance ($)
             */
            title?: string;
            /**
             * Format: string
             * @description The amount formatted according to the users locale
             * @example $ 12.45
             */
            value_parsed?: string;
        };
        BillArray: {
            data: components["schemas"]["BillRead"][];
            meta: components["schemas"]["Meta"];
        };
        BillProperties: {
            /**
             * @description If the subscription is active.
             * @example true
             */
            active?: boolean;
            /**
             * Format: amount
             * @description The average amount that is expected for this subscription in the subscription's currency.
             * @example 123.45
             */
            amount_avg?: string;
            /**
             * Format: amount
             * @description The maximum amount that is expected for this subscription in the subscription's currency.
             * @example 123.45
             */
            amount_max?: string;
            /**
             * Format: amount
             * @description The minimum amount that is expected for this subscription in the subscription's currency.
             * @example 123.45
             */
            amount_min?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            date?: string;
            /**
             * Format: date-time
             * @description The date after which this subscription is no longer valid or applicable
             * @example 2026-03-31T23:59:59+00:00
             */
            end_date?: string | null;
            /**
             * Format: date-time
             * @description The date before which the subscription must be renewed (or cancelled)
             * @example 2026-03-31T23:59:59+00:00
             */
            extension_date?: string | null;
            /**
             * Format: string
             * @description The name of the subscription.
             * @example Rent
             */
            name?: string;
            /**
             * Format: date-time
             * @description When the subscription is expected to be due.
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly next_expected_match?: string | null;
            /**
             * Format: string
             * @description Formatted (locally) when the subscription is due.
             * @example today
             */
            readonly next_expected_match_diff?: string | null;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: int32
             * @description The order of the group. At least 1, for the highest sorting.
             * @example 5
             */
            readonly object_group_order?: number | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: int32
             * @description Order of the subscription.
             * @example 1
             */
            order?: number;
            /** @description Array of past transactions when the subscription was paid. */
            readonly paid_dates?: {
                /**
                 * Format: amount
                 * @description The amount that was paid for this subscription in the subscription's currency.
                 * @example 123.45
                 */
                amount?: string;
                /**
                 * Format: string
                 * @description The currency code of the currency associated with this object.
                 * @example EUR
                 */
                currency_code?: string;
                /**
                 * Format: int32
                 * @example 2
                 */
                readonly currency_decimal_places?: number;
                /**
                 * Format: string
                 * @description The currency ID of the currency associated with this object.
                 * @example 5
                 */
                currency_id?: string;
                /**
                 * Format: string
                 * @description The currency name of the currency associated with this object.
                 * @example Euro
                 */
                currency_name?: string;
                /**
                 * Format: string
                 * @example $
                 */
                readonly currency_symbol?: string;
                /**
                 * Format: date-time
                 * @description Date the bill was paid.
                 * @example 2026-03-01T00:00:00+00:00
                 */
                readonly date?: string;
                /**
                 * Format: amount
                 * @description The foreign amount that was paid for this subscription in the subscription's currency.
                 * @example 123.45
                 */
                foreign_amount?: string;
                /**
                 * Format: amount
                 * @description The amount that was paid for this subscription in the administration's primary currency.
                 * @example 123.45
                 */
                pc_amount?: string;
                /**
                 * Format: amount
                 * @description The foreign amount that was paid for this subscription in the administration's primary currency.
                 * @example 123.45
                 */
                pc_foreign_amount?: string;
                /**
                 * Format: string
                 * @description The currency code of the administration's primary currency.
                 * @example EUR
                 */
                readonly primary_currency_code?: string;
                /**
                 * Format: int32
                 * @description The currency decimal places of the administration's primary currency.
                 * @example 2
                 */
                readonly primary_currency_decimal_places?: number;
                /**
                 * Format: string
                 * @description The currency ID of the administration's primary currency.
                 * @example 5
                 */
                readonly primary_currency_id?: string;
                /**
                 * Format: string
                 * @description The currency name of the administration's primary currency.
                 * @example Euro
                 */
                readonly primary_currency_name?: string;
                /**
                 * Format: string
                 * @description The currency symbol of the administration's primary currency.
                 * @example $
                 */
                readonly primary_currency_symbol?: string;
                /**
                 * Format: string
                 * @description ID of this subscription.
                 * @example 123
                 */
                readonly subscription_id?: string;
                /**
                 * Format: string
                 * @description Transaction group ID of the transaction linked to this subscription.
                 * @example 123
                 */
                readonly transaction_group_id?: string;
                /**
                 * Format: string
                 * @description Transaction journal ID of the transaction linked to this subscription.
                 * @example 123
                 */
                readonly transaction_journal_id?: string;
            }[];
            /** @description Array of future dates when the bill is expected to be paid. Autogenerated. */
            readonly pay_dates?: string[];
            /**
             * Format: amount
             * @description The average amount that is expected for this subscription in the administration's primary currency.
             * @example 123.45
             */
            pc_amount_avg?: string;
            /**
             * Format: amount
             * @description The maximum amount that is expected for this subscription in the administration's primary currency.
             * @example 123.45
             */
            pc_amount_max?: string;
            /**
             * Format: amount
             * @description The minimum amount that is expected for this subscription in the administration's primary currency.
             * @example 123.45
             */
            pc_amount_min?: string;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            repeat_freq?: components["schemas"]["BillRepeatFrequency"];
            /**
             * Format: int32
             * @description How often the subscription will be skipped. 1 means a bi-monthly subscription.
             * @example 0
             */
            skip?: number;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        BillRead: {
            attributes: components["schemas"]["BillProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example bills
             */
            type: string;
        };
        /**
         * Format: string
         * @description How often the bill must be paid.
         * @example monthly
         * @enum {string}
         */
        BillRepeatFrequency: "weekly" | "monthly" | "quarterly" | "half-year" | "yearly";
        BillSingle: {
            data: components["schemas"]["BillRead"];
        };
        BillStore: {
            /**
             * @description If the bill is active.
             * @example true
             */
            active?: boolean;
            /**
             * Format: amount
             * @example 123.45
             */
            amount_max: string;
            /**
             * Format: amount
             * @example 123.45
             */
            amount_min: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            date: string;
            /**
             * Format: date-time
             * @description The date after which this bill is no longer valid or applicable
             * @example 2026-03-31T23:59:59+00:00
             */
            end_date?: string;
            /**
             * Format: date-time
             * @description The date before which the bill must be renewed (or cancelled)
             * @example 2026-03-31T23:59:59+00:00
             */
            extension_date?: string;
            /**
             * Format: string
             * @example Rent
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            repeat_freq: components["schemas"]["BillRepeatFrequency"];
            /**
             * Format: int32
             * @description How often the bill must be skipped. 1 means a bi-monthly bill.
             * @example 0
             */
            skip?: number;
        };
        BillUpdate: {
            /**
             * @description If the bill is active.
             * @example true
             */
            active?: boolean;
            /**
             * Format: amount
             * @example 123.45
             */
            amount_max?: string;
            /**
             * Format: amount
             * @example 123.45
             */
            amount_min?: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            date?: string;
            /**
             * Format: date-time
             * @description The date after which this bill is no longer valid or applicable
             * @example 2026-03-31T23:59:59+00:00
             */
            end_date?: string;
            /**
             * Format: date-time
             * @description The date before which the bill must be renewed (or cancelled)
             * @example 2026-03-31T23:59:59+00:00
             */
            extension_date?: string;
            /**
             * Format: string
             * @example Rent
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            repeat_freq?: components["schemas"]["BillRepeatFrequency"];
            /**
             * Format: int32
             * @description How often the bill must be skipped. 1 means a bi-monthly bill.
             * @example 0
             */
            skip?: number;
        };
        BudgetArray: {
            data: components["schemas"]["BudgetRead"][];
            meta: components["schemas"]["Meta"];
        };
        BudgetLimitArray: {
            data: components["schemas"]["BudgetLimitRead"][];
            meta: components["schemas"]["Meta"];
        };
        BudgetLimitProperties: {
            /**
             * Format: amount
             * @example 123.45
             */
            amount?: string;
            /**
             * Format: string
             * @description The budget ID of the associated budget.
             * @example 23
             */
            readonly budget_id?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @description End date of the budget limit.
             * @example 2026-03-31T23:59:59+00:00
             */
            end?: string;
            /**
             * Format: string
             * @description Some notes for this specific budget limit.
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: amount
             * @description The amount of this budget limit in the user's primary currency, if the original amount is in a different currency.
             * @example 123.45
             */
            readonly pc_amount?: string | null;
            /** @description Amount(s) spent in the primary currency in the database for this budget limit. */
            readonly pc_spent?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: string
             * @description Period of the budget limit. Only used when auto-generated by auto-budget.
             * @example monthly
             */
            readonly period?: string | null;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /** @description Amount(s) spent in the currencies in the database for this budget limit. */
            readonly spent?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: date-time
             * @description Start date of the budget limit.
             * @example 2026-03-01T00:00:00+00:00
             */
            start?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        BudgetLimitRead: {
            attributes: components["schemas"]["BudgetLimitProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example budget_limits
             */
            type: string;
        };
        BudgetLimitSingle: {
            data: components["schemas"]["BudgetLimitRead"];
        };
        BudgetLimitStore: {
            /**
             * Format: amount
             * @example 123.45
             */
            amount: string;
            /**
             * Format: string
             * @description The budget ID of the associated budget.
             * @example 23
             */
            readonly budget_id: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's primary currency.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's primary currency.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: date
             * @description End date of the budget limit.
             * @example 2026-03-31
             */
            end: string;
            /**
             * @description Whether or not to fire the webhooks that are related to this event.
             * @default true
             * @example true
             */
            fire_webhooks: boolean;
            /**
             * Format: string
             * @description Some notes for this specific budget limit.
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description Period of the budget limit. Only used when auto-generated by auto-budget.
             * @example monthly
             */
            readonly period?: string | null;
            /**
             * Format: date
             * @description Start date of the budget limit.
             * @example 2026-03-01
             */
            start: string;
        };
        BudgetLimitUpdate: {
            /**
             * Format: amount
             * @example 123.45
             */
            amount?: string;
            /**
             * Format: string
             * @description The budget ID of the associated budget.
             * @example 23
             */
            readonly budget_id?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @description End date of the budget limit.
             * @example 2026-03-31T23:59:59+00:00
             */
            end?: string;
            /**
             * @description Whether or not to fire the webhooks that are related to this event.
             * @default true
             * @example true
             */
            fire_webhooks: boolean;
            /**
             * Format: string
             * @description Some notes for this specific budget limit.
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: amount
             * @description The amount of this budget limit in the user's primary currency, if the original amount is in a different currency.
             * @example 123.45
             */
            readonly pc_amount?: string | null;
            /**
             * Format: string
             * @description Period of the budget limit. Only used when auto-generated by auto-budget.
             * @example monthly
             */
            readonly period?: string | null;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /**
             * Format: amount
             * @description Will be in the primary currency if this is turned on by the user.
             * @example -1012.12
             */
            readonly spent?: string | null;
            /**
             * Format: date-time
             * @description Start date of the budget limit.
             * @example 2026-03-01T00:00:00+00:00
             */
            start?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        BudgetProperties: {
            /** @example false */
            active?: boolean;
            /**
             * Format: amount
             * @description The amount for the auto-budget, if set.
             * @example -1012.12
             */
            auto_budget_amount?: string | null;
            auto_budget_period?: components["schemas"]["AutoBudgetPeriod"];
            auto_budget_type?: components["schemas"]["AutoBudgetType"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: string
             * @example Bills
             */
            name: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: int32
             * @description The order of the group. At least 1, for the highest sorting.
             * @example 5
             */
            readonly object_group_order?: number | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: int32
             * @example 5
             */
            readonly order?: number;
            /**
             * Format: amount
             * @description The amount for the auto-budget, if set in the primary currency of the administration.
             * @example -1012.12
             */
            pc_auto_budget_amount?: string | null;
            /** @description Information on how much was spent in this budget. Is only filled in when the start and end date are submitted. It is converted to the primary currency of the administration. */
            readonly pc_spent?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /** @description Information on how much was spent in this budget. Is only filled in when the start and end date are submitted. */
            readonly spent?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        BudgetRead: {
            attributes: components["schemas"]["BudgetProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example budgets
             */
            type: string;
        };
        BudgetSingle: {
            data: components["schemas"]["BudgetRead"];
        };
        BudgetStore: {
            /** @example false */
            active?: boolean;
            /**
             * Format: amount
             * @example -1012.12
             */
            auto_budget_amount?: string | null;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example EUR
             */
            auto_budget_currency_code?: string | null;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example 12
             */
            auto_budget_currency_id?: string | null;
            auto_budget_period?: components["schemas"]["AutoBudgetPeriod"];
            auto_budget_type?: components["schemas"]["AutoBudgetType"];
            /**
             * @description Whether or not to fire the webhooks that are related to this event.
             * @default true
             * @example true
             */
            fire_webhooks: boolean;
            /**
             * Format: string
             * @example Bills
             */
            name: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @example 5
             */
            readonly order?: number;
        };
        BudgetUpdate: {
            /** @example false */
            active?: boolean;
            /**
             * Format: amount
             * @example -1012.12
             */
            auto_budget_amount?: string | null;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example EUR
             */
            auto_budget_currency_code?: string | null;
            /**
             * Format: string
             * @description Use either currency_id or currency_code. Defaults to the user's financial administration's currency.
             * @example 12
             */
            auto_budget_currency_id?: string | null;
            auto_budget_period?: components["schemas"]["AutoBudgetPeriod"];
            auto_budget_type?: components["schemas"]["AutoBudgetType"];
            /**
             * @description Whether or not to fire the webhooks that are related to this event.
             * @default true
             * @example true
             */
            fire_webhooks: boolean;
            /**
             * Format: string
             * @example Bills
             */
            name: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @example 5
             */
            order?: number;
        };
        CategoryArray: {
            data: components["schemas"]["CategoryRead"][];
            meta: components["schemas"]["Meta"];
        };
        CategoryProperties: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /** @description Amount(s) earned in the currencies in the database for this category. ONLY present when start and date are set. */
            readonly earned?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: string
             * @example Lunch
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * @description This object never has its own currency setting, so this value is always false.
             * @example false
             */
            object_has_currency_setting?: boolean;
            /** @description Amount(s) earned in the primary currency in the database for this category. ONLY present when start and date are set. */
            readonly pc_earned?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /** @description Amount(s) spent in the primary currency in the database for this category. ONLY present when start and date are set. */
            readonly pc_spent?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /** @description Amount(s) transferred in primary currency in the database for this category. ONLY present when start and date are set. */
            readonly pc_transferred?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /** @description Amount(s) spent in the currencies in the database for this category. ONLY present when start and date are set. */
            readonly spent?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /** @description Amount(s) transferred in the currencies in the database for this category. ONLY present when start and date are set. */
            readonly transferred?: components["schemas"]["ArrayEntryWithCurrencyAndSum"][];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        CategoryRead: {
            attributes: components["schemas"]["CategoryProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example categories
             */
            type: string;
        };
        CategorySingle: {
            data: components["schemas"]["CategoryRead"];
        };
        CategoryStore: {
            /**
             * Format: string
             * @example Lunch
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
        };
        CategoryUpdate: {
            /**
             * Format: string
             * @example Lunch
             */
            name: string;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
        };
        ChartDataPoint: {
            /**
             * Format: string
             * @description The key is the label of the value, so for example: '2018-01-01' => 13 or 'Groceries' => -123.
             * @example value
             */
            key?: string;
        };
        ChartDataSet: {
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            date?: string;
            /**
             * Format: date-time
             * @example 2026-03-31T23:59:59+00:00
             */
            end_date?: string;
            /** @description The actual entries for this data set. They 'key' value is the label for the data point. The value is the actual (numerical) value. */
            entries?: Record<string, never>;
            /**
             * Format: string
             * @description This is the title of the current set. It can refer to an account, a budget or another object (by name).
             * @example Checking account
             */
            label?: string;
            /** @description The actual entries for this data set. They 'key' value is the label for the data point. The value is the actual (numerical) value. */
            pc_entries?: Record<string, never>;
            period?: components["schemas"]["ChartDatasetPeriodProperty"];
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            start_date?: string;
            /**
             * Format: string
             * @description Indicated the type of chart that is expected to be rendered. You can safely ignore this if you want.
             * @example line
             */
            type?: string;
            /**
             * Format: int32
             * @description Used to indicate the Y axis for this data set. Is usually between 0 and 1 (left and right side of the chart).
             * @example 0
             */
            yAxisID?: number;
        };
        /**
         * Format: string
         * @description Period of the chart.
         * @example 1M
         * @enum {string}
         */
        ChartDatasetPeriodProperty: "1D" | "1W" | "1M" | "3M" | "1Y" | "custom";
        ChartLine: components["schemas"]["ChartDataSet"][];
        Configuration: {
            /**
             * @description If this config variable can be edited by the user
             * @example true
             */
            editable: boolean;
            title: components["schemas"]["ConfigValueFilter"];
            value: components["schemas"]["PolymorphicProperty"];
        };
        ConfigurationArray: components["schemas"]["Configuration"][];
        ConfigurationSingle: {
            data: components["schemas"]["Configuration"];
        };
        ConfigurationUpdate: {
            value: components["schemas"]["PolymorphicProperty"];
        };
        /**
         * @description Title of the configuration value.
         * @example configuration.is_demo_site
         * @enum {string}
         */
        ConfigValueFilter: "configuration.is_demo_site" | "configuration.permission_update_check" | "configuration.last_update_check" | "configuration.single_user_mode" | "firefly.version" | "firefly.default_location" | "firefly.account_to_transaction" | "firefly.allowed_opposing_types" | "firefly.accountRoles" | "firefly.valid_liabilities" | "firefly.interest_periods" | "firefly.enable_external_map" | "firefly.expected_source_types" | "app.timezone" | "firefly.bill_periods" | "firefly.credit_card_types" | "firefly.languages" | "firefly.valid_view_ranges" | "cer.enabled" | "firefly.preselected_accounts" | "firefly.rule-actions" | "firefly.context-rule-actions" | "search.operators" | "webhook.triggers" | "webhook.responses" | "webhook.deliveries";
        /** @enum {string} */
        ConfigValueUpdateFilter: "configuration.is_demo_site" | "configuration.permission_update_check" | "configuration.last_update_check" | "configuration.single_user_mode" | "configuration.enable_exchange_rates" | "configuration.use_running_balance" | "configuration.enable_external_map" | "configuration.enable_external_rates" | "configuration.allow_webhooks" | "configuration.valid_url_protocols";
        /**
         * Format: string
         * @description Mandatory when the account_role is ccAsset. Can only be monthlyFull or null.
         * @example monthlyFull
         * @enum {string|null}
         */
        CreditCardTypeProperty: "monthlyFull" | null;
        CronResult: {
            auto_budgets?: components["schemas"]["CronResultRow"];
            recurring_transactions?: components["schemas"]["CronResultRow"];
            telemetry?: components["schemas"]["CronResultRow"];
        };
        CronResultRow: {
            /**
             * @description If the cron job ran into some kind of an error, this value will be true.
             * @example false
             */
            job_errored?: boolean | null;
            /**
             * @description This value tells you if this specific cron job actually fired. It may not fire. Some cron jobs
             *     only fire every 24 hours, for example.
             * @example true
             */
            job_fired?: boolean | null;
            /**
             * @description This value tells you if this specific cron job actually did something. The job may fire but not
             *     change anything.
             * @example true
             */
            job_succeeded?: boolean | null;
            /**
             * Format: string
             * @description If the cron job ran into some kind of an error, this value will be the error message. The success message
             *     if the job actually ran OK.
             * @example Cron result message
             */
            message?: string | null;
        };
        CurrencyArray: {
            data: components["schemas"]["CurrencyRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        CurrencyExchangeProperties: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: date-time
             * @description Date and time of the exchange rate.
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly date?: string;
            /**
             * Format: string
             * @description Base currency code for this exchange rate entry.
             * @example EUR
             */
            readonly from_currency_code?: string;
            /**
             * Format: int32
             * @description Base currency decimal places for this exchange rate entry.
             * @example 2
             */
            readonly from_currency_decimal_places?: number;
            /**
             * Format: string
             * @description Base currency ID for this exchange rate entry.
             * @example 12
             */
            readonly from_currency_id?: string;
            /**
             * Format: string
             * @description Base currency name for this exchange rate entry.
             * @example Euro
             */
            readonly from_currency_name?: string;
            /**
             * Format: string
             * @description Base currency symbol for this exchange rate entry.
             * @example $
             */
            readonly from_currency_symbol?: string;
            /**
             * Format: string
             * @description The actual exchange rate. How many 'to' currency will you get for 1 'from' currency?
             * @example 1.10340
             */
            readonly rate?: string;
            /**
             * Format: string
             * @description Destination currency code for this exchange rate entry.
             * @example EUR
             */
            readonly to_currency_code?: string;
            /**
             * Format: int32
             * @description Destination currency decimal places for this exchange rate entry.
             * @example 2
             */
            readonly to_currency_decimal_places?: number;
            /**
             * Format: string
             * @description Destination currency ID for this exchange rate entry.
             * @example 12
             */
            readonly to_currency_id?: string;
            /**
             * Format: string
             * @description Destination currency name for this exchange rate entry.
             * @example EUR
             */
            readonly to_currency_name?: string;
            /**
             * Format: string
             * @description Destination currency symbol for this exchange rate entry.
             * @example $
             */
            readonly to_currency_symbol?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        CurrencyExchangeRateArray: {
            data: components["schemas"]["CurrencyExchangeRateRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        CurrencyExchangeRateRead: {
            attributes?: components["schemas"]["CurrencyExchangeProperties"];
            /**
             * Format: string
             * @example 2
             */
            readonly id?: string;
            links?: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example currency_exchange_rates
             */
            readonly type?: string;
        };
        CurrencyExchangeRateSingle: {
            data: components["schemas"]["CurrencyExchangeRateRead"];
        };
        CurrencyExchangeRateStore: {
            /**
             * Format: date
             * @description The date to which the exchange rate is applicable.
             * @example 2026-03-01
             */
            date: string;
            /**
             * Format: string
             * @description The base currency code.
             * @example USD
             */
            from: string;
            /**
             * Format: string
             * @description The exchange rate from the base currency to the destination currency.
             * @example 2.3456
             */
            rate?: string;
            /**
             * Format: string
             * @description The destination currency code.
             * @example EUR
             */
            to: string;
        };
        CurrencyExchangeRateStoreByDate: {
            /**
             * Format: string
             * @description The 'from'-currency
             * @example EUR
             */
            from: string;
            /**
             * @description The actual entries for this data set. They 'key' value is 'to' currency. The value is the exchange rate.
             * @example {
             *       "USD": "1.2345",
             *       "GBP": "6.3456"
             *     }
             */
            rates: {
                [key: string]: string;
            };
        };
        /**
         * @description The actual entries for this data set. They 'key' value is the date in YYYY-MM-DD. The value is the exchange rate.
         * @example {
         *       "2025-08-01": "1.2345",
         *       "2025-08-02": "6.3456"
         *     }
         */
        CurrencyExchangeRateStoreByPair: {
            [key: string]: string;
        };
        CurrencyExchangeRateUpdate: {
            /**
             * Format: date
             * @description The date to which the exchange rate is applicable.
             * @example 2026-03-01
             */
            date: string;
            /**
             * Format: string
             * @description The base currency code.
             * @example USD
             */
            from?: string | null;
            /**
             * Format: string
             * @description The exchange rate from the base currency to the destination currency.
             * @example 2.3456
             */
            rate: string;
            /**
             * Format: string
             * @description The destination currency code.
             * @example EUR
             */
            to?: string | null;
        };
        CurrencyExchangeRateUpdateNoDate: {
            /**
             * Format: string
             * @description The exchange rate from the base currency to the destination currency.
             * @example 2.3456
             */
            rate: string;
        };
        CurrencyProperties: {
            /**
             * Format: string
             * @example AMS
             */
            code: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: int32
             * @description Supports 0-16 decimals.
             * @example 2
             */
            decimal_places?: number;
            /**
             * @description Defaults to true
             * @default true
             * @example true
             */
            enabled: boolean;
            /**
             * Format: string
             * @example Ankh-Morpork dollar
             */
            name: string;
            /**
             * @description Is the primary currency?
             * @example false
             */
            primary?: boolean;
            /**
             * Format: string
             * @example AM$
             */
            symbol: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        CurrencyRead: {
            attributes: components["schemas"]["CurrencyProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example currencies
             */
            type: string;
        };
        CurrencySingle: {
            data: components["schemas"]["CurrencyRead"];
        };
        CurrencyStore: {
            /**
             * Format: string
             * @example AMS
             */
            code: string;
            /**
             * Format: int32
             * @description Supports 0-16 decimals.
             * @example 2
             */
            decimal_places?: number;
            /**
             * @description Defaults to true
             * @default true
             * @example true
             */
            enabled: boolean;
            /**
             * Format: string
             * @example Ankh-Morpork dollar
             */
            name: string;
            /**
             * @description Make this currency the primary currency for the current administration. You can set this value to FALSE, in which case nothing will change to the primary currency. If you set it to TRUE, the current primary currency will no longer be the primary currency.
             * @example true
             */
            primary?: boolean;
            /**
             * Format: string
             * @example AM$
             */
            symbol: string;
        };
        CurrencyUpdate: {
            /**
             * Format: string
             * @description The currency code
             * @example AMS
             */
            code?: string;
            /**
             * Format: int32
             * @description How many decimals to use when displaying this currency. Between 0 and 16.
             * @example 2
             */
            decimal_places?: number;
            /**
             * @description If the currency is enabled
             * @example true
             */
            enabled?: boolean;
            /**
             * Format: string
             * @description The currency name
             * @example Ankh-Morpork dollar
             */
            name?: string;
            /**
             * @description If the currency must be the primary for the user. You can only submit TRUE. Submitting FALSE will not drop this currency as the primary currency, because then the system would be without one.
             * @example true
             * @enum {boolean}
             */
            primary?: true;
            /**
             * Format: string
             * @description The currency symbol
             * @example AM$
             */
            symbol?: string;
        };
        /** @enum {string} */
        DataDestroyObject: "not_assets_liabilities" | "budgets" | "bills" | "piggy_banks" | "rules" | "recurring" | "categories" | "tags" | "object_groups" | "accounts" | "asset_accounts" | "expense_accounts" | "revenue_accounts" | "liabilities" | "transactions" | "withdrawals" | "deposits" | "transfers";
        /** @enum {string} */
        ExportFileFilter: "csv";
        InsightGroup: components["schemas"]["InsightGroupEntry"][];
        InsightGroupEntry: {
            /**
             * Format: string
             * @description The currency code of the expenses listed for this account.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description The currency ID of the expenses listed for this account.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The amount spent or earned between start date and end date, a number defined as a string, for this object and all asset accounts.
             * @example -123.45
             */
            difference?: string;
            /**
             * Format: double
             * @description The amount spent or earned between start date and end date, a number as a float, for this object and all asset accounts. May have rounding errors.
             * @example -123.45
             */
            difference_float?: number;
            /**
             * Format: string
             * @description This ID is a reference to the original object.
             * @example 123
             */
            id?: string;
            /**
             * Format: string
             * @description This is the name of the object.
             * @example Land lord
             */
            name?: string;
        };
        InsightTotal: components["schemas"]["InsightTotalEntry"][];
        InsightTotalEntry: {
            /**
             * Format: string
             * @description The currency code of the expenses listed for this expense account.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description The currency ID of the expenses listed for this expense account.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The amount spent between start date and end date, defined as a string, for this expense account and all asset accounts.
             * @example 123.45
             */
            difference?: string;
            /**
             * Format: double
             * @description The amount spent between start date and end date, defined as a string, for this expense account and all asset accounts. This number is a float (double) and may have rounding errors.
             * @example 123.45
             */
            difference_float?: number;
        };
        InsightTransfer: components["schemas"]["InsightTransferEntry"][];
        InsightTransferEntry: {
            /**
             * Format: string
             * @description The currency code of the expenses listed for this account.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description The currency ID of the expenses listed for this account.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The total amount transferred between start date and end date, a number defined as a string, for this asset account.
             * @example -123.45
             */
            difference?: string;
            /**
             * Format: double
             * @description The total amount transferred between start date and end date, a number as a float, for this asset account. May have rounding errors.
             * @example -123.45
             */
            difference_float?: number;
            /**
             * Format: string
             * @description This ID is a reference to the original object.
             * @example 123
             */
            id?: string;
            /**
             * Format: string
             * @description The total amount transferred TO this account between start date and end date, a number defined as a string, for this asset account.
             * @example 123.45
             */
            in?: string;
            /**
             * Format: double
             * @description The total amount transferred FROM this account between start date and end date, a number as a float, for this asset account. May have rounding errors.
             * @example 123.45
             */
            in_float?: number;
            /**
             * Format: string
             * @description This is the name of the object.
             * @example Land lord
             */
            name?: string;
            /**
             * Format: string
             * @description The total amount transferred FROM this account between start date and end date, a number defined as a string, for this asset account.
             * @example 123.45
             */
            out?: string;
            /**
             * Format: double
             * @description The total amount transferred TO this account between start date and end date, a number as a float, for this asset account. May have rounding errors.
             * @example 123.45
             */
            out_float?: number;
        };
        /**
         * Format: string
         * @description Mandatory when type is liability. Period over which the interest is calculated.
         * @example monthly
         * @enum {string|null}
         */
        InterestPeriodProperty: "daily" | "weekly" | "monthly" | "quarterly" | "half-year" | "yearly" | null;
        InternalExceptionResponse: {
            /**
             * Format: string
             * @example InternalException
             */
            exception?: string;
            /**
             * Format: string
             * @example Internal Exception
             */
            message?: string;
        };
        /**
         * Format: string
         * @description 'credit' indicates somebody owes you the liability. 'debit' Indicates you owe this debt yourself. Works only for liabilities.
         * @example credit
         * @enum {string|null}
         */
        LiabilityDirectionProperty: "credit" | "debit" | null;
        /**
         * Format: string
         * @description Mandatory when type is liability. Specifies the exact type.
         * @example loan
         * @enum {string|null}
         */
        LiabilityTypeProperty: "loan" | "debt" | "mortgage" | null;
        LinkType: {
            /** @example false */
            readonly editable?: boolean;
            /**
             * Format: string
             * @example is (partially) paid for by
             */
            inward: string;
            /**
             * Format: string
             * @example Paid
             */
            name: string;
            /**
             * Format: string
             * @example (partially) pays for
             */
            outward: string;
        };
        LinkTypeArray: {
            data: components["schemas"]["LinkTypeRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        LinkTypeRead: {
            attributes: components["schemas"]["LinkType"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example link_types
             */
            type: string;
        };
        LinkTypeSingle: {
            data: components["schemas"]["LinkTypeRead"];
        };
        LinkTypeUpdate: {
            /**
             * Format: string
             * @example is (partially) paid for by
             */
            inward?: string;
            /**
             * Format: string
             * @example Paid
             */
            name?: string;
            /**
             * Format: string
             * @example (partially) pays for
             */
            outward?: string;
        };
        Meta: {
            pagination?: {
                /** @example 20 */
                count?: number;
                /** @example 1 */
                current_page?: number;
                /** @example 100 */
                per_page?: number;
                /** @example 3 */
                total?: number;
                /** @example 1 */
                total_pages?: number;
            };
        };
        NotFoundResponse: {
            /**
             * Format: string
             * @example NotFoundHttpException
             */
            exception?: string;
            /**
             * Format: string
             * @example Resource not found
             */
            message?: string;
        };
        ObjectGroup: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: int32
             * @description Order of the object group
             * @example 1
             */
            order: number;
            /**
             * Format: string
             * @example My object group
             */
            title: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        ObjectGroupArray: {
            data: components["schemas"]["ObjectGroupRead"][];
            meta: components["schemas"]["Meta"];
        };
        ObjectGroupRead: {
            attributes: components["schemas"]["ObjectGroup"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example object_groups
             */
            type: string;
        };
        ObjectGroupSingle: {
            data: components["schemas"]["ObjectGroupRead"];
        };
        ObjectGroupUpdate: {
            /**
             * Format: int32
             * @description Order of the object group
             * @example 1
             */
            order?: number;
            /**
             * Format: string
             * @example My object group
             */
            title: string;
        };
        ObjectLink: {
            0?: {
                /**
                 * Format: string
                 * @example self
                 */
                rel?: string;
                /**
                 * Format: string
                 * @example /OBJECTS/1
                 */
                uri?: string;
            };
            /**
             * Format: uri
             * @example https://demo.firefly-iii.org/api/v1/OBJECTS/1
             */
            self?: string;
        };
        PageLink: {
            /**
             * Format: uri
             * @example https://demo.firefly-iii.org/api/v1/OBJECT?&page=1
             */
            first?: string;
            /**
             * Format: uri
             * @example https://demo.firefly-iii.org/api/v1/OBJECT?&page=12
             */
            last?: string;
            /**
             * Format: uri
             * @example https://demo.firefly-iii.org/api/v1/OBJECT?&page=3
             */
            next?: string | null;
            /**
             * Format: uri
             * @example https://demo.firefly-iii.org/api/v1/OBJECT?&page=2
             */
            prev?: string | null;
            /**
             * Format: uri
             * @example https://demo.firefly-iii.org/api/v1/OBJECT?&page=4
             */
            self?: string;
        };
        PiggyBankAccountRead: {
            /**
             * Format: string
             * @description The ID of the account.
             * @example 3
             */
            readonly account_id?: string;
            /**
             * Format: amount
             * @example 123.45
             */
            current_amount?: string;
            /**
             * Format: string
             * @example Checking account
             */
            readonly name?: string;
            /**
             * Format: amount
             * @description If convertToPrimary is on, this will show the amount in the primary currency.
             * @example 123.45
             */
            pc_current_amount?: string;
        };
        PiggyBankAccountStore: {
            /**
             * Format: amount
             * @description The amount saved currently.
             * @example 123.45
             */
            current_amount?: string;
            /**
             * Format: string
             * @description The ID of the account.
             * @example 3
             */
            id: string | null;
            /**
             * Format: string
             * @description The name of the account.
             * @example Checking account
             */
            name?: string | null;
        };
        PiggyBankAccountUpdate: {
            /**
             * Format: string
             * @description The ID of the account.
             * @example 3
             */
            account_id?: string | null;
            /**
             * Format: amount
             * @description The amount saved currently.
             * @example 123.45
             */
            current_amount?: string | null;
            /**
             * Format: string
             * @description The name of the account.
             * @example Checking account
             */
            name?: string | null;
        };
        PiggyBankArray: {
            data: components["schemas"]["PiggyBankRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        PiggyBankEventArray: {
            data: components["schemas"]["PiggyBankEventRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        PiggyBankEventProperties: {
            /**
             * Format: amount
             * @example 123.45
             */
            amount?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: amount
             * @example 123.45
             */
            pc_amount?: string;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /**
             * Format: string
             * @description The transaction group associated with the event.
             * @example 4291
             */
            transaction_group_id?: string | null;
            /**
             * Format: string
             * @description The journal associated with the event.
             * @example 4291
             */
            transaction_journal_id?: string | null;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            updated_at?: string;
        };
        PiggyBankEventRead: {
            attributes: components["schemas"]["PiggyBankEventProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example piggy_bank_events
             */
            type: string;
        };
        PiggyBankProperties: {
            accounts?: components["schemas"]["PiggyBankAccountRead"][];
            /** @example true */
            readonly active?: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: amount
             * @example 123.45
             */
            current_amount?: string;
            /**
             * Format: string
             * @example 700.00
             */
            left_to_save?: string | null;
            /**
             * Format: string
             * @example New digital camera
             */
            name: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: int32
             * @description The order of the group. At least 1, for the highest sorting.
             * @example 5
             */
            readonly object_group_order?: number | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: int32
             * @example 5
             */
            order?: number;
            /**
             * Format: amount
             * @description The current amount in the primary currency of the administration.
             * @example 123.45
             */
            pc_current_amount?: string;
            /**
             * Format: string
             * @example 700.00
             */
            pc_left_to_save?: string | null;
            /**
             * Format: string
             * @example 12.45
             */
            readonly pc_save_per_month?: string | null;
            /**
             * Format: amount
             * @description The target amount in the primary currency of the administration.
             * @example 123.45
             */
            pc_target_amount?: string | null;
            /**
             * Format: int32
             * @description The percentage of the target amount that has been saved, if a target amount is set.
             * @example 12
             */
            readonly percentage?: number | null;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /**
             * Format: string
             * @example 12.45
             */
            readonly save_per_month?: string | null;
            /**
             * Format: date-time
             * @description The date you started with this piggy bank.
             * @example 2026-03-01T00:00:00+00:00
             */
            start_date?: string;
            /**
             * Format: amount
             * @example 123.45
             */
            target_amount: string | null;
            /**
             * Format: date-time
             * @description The date you intend to finish saving money.
             * @example 2026-03-01T00:00:00+00:00
             */
            target_date?: string | null;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        PiggyBankRead: {
            attributes: components["schemas"]["PiggyBankProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example piggy_banks
             */
            type: string;
        };
        PiggyBankSingle: {
            data: components["schemas"]["PiggyBankRead"];
        };
        PiggyBankStore: {
            accounts?: components["schemas"]["PiggyBankAccountStore"][];
            /** @example true */
            readonly active?: boolean;
            /**
             * Format: amount
             * @example 123.45
             */
            current_amount?: string;
            /**
             * Format: string
             * @example New digital camera
             */
            name: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            /**
             * Format: int32
             * @example 5
             */
            order?: number;
            /**
             * Format: date
             * @description The date you started with this piggy bank.
             * @example 2026-03-01
             */
            start_date: string;
            /**
             * Format: amount
             * @example 123.45
             */
            target_amount: string | null;
            /**
             * Format: date
             * @description The date you intend to finish saving money.
             * @example 2026-03-31
             */
            target_date?: string | null;
        };
        PiggyBankUpdate: {
            accounts?: components["schemas"]["PiggyBankAccountUpdate"][];
            /** @example true */
            readonly active?: boolean;
            /**
             * Format: string
             * @example USD
             */
            readonly currency_code?: string;
            /**
             * Format: string
             * @example 5
             */
            readonly currency_id?: string;
            /**
             * Format: string
             * @example New digital camera
             */
            name?: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The group ID of the group this object is part of. NULL if no group.
             * @example 5
             */
            object_group_id?: string | null;
            /**
             * Format: string
             * @description The name of the group. NULL if no group.
             * @example Example Group
             */
            object_group_title?: string | null;
            /**
             * Format: int32
             * @example 5
             */
            order?: number;
            /**
             * Format: date
             * @description The date you started with this piggy bank.
             * @example 2026-03-01
             */
            start_date?: string;
            /**
             * Format: amount
             * @example 123.45
             */
            target_amount?: string | null;
            /**
             * Format: date
             * @description The date you intend to finish saving money.
             * @example 2026-03-31
             */
            target_date?: string | null;
        };
        PolymorphicProperty: boolean | string | Record<string, never> | components["schemas"]["StringArrayItem"][];
        Preference: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            data: components["schemas"]["PolymorphicProperty"];
            /**
             * Format: string
             * @example currencyPreference
             */
            name: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        PreferenceArray: {
            data: components["schemas"]["PreferenceRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        PreferenceRead: {
            attributes: components["schemas"]["Preference"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example preferences
             */
            type: string;
        };
        PreferenceSingle: {
            data: components["schemas"]["PreferenceRead"];
        };
        PreferenceUpdate: {
            data: components["schemas"]["PolymorphicProperty"];
        };
        RecurrenceArray: {
            data: components["schemas"]["RecurrenceRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        RecurrenceProperties: {
            /**
             * @description If the recurrence is even active.
             * @example true
             */
            active?: boolean;
            /**
             * @description Whether or not to fire the rules after the creation of a transaction.
             * @example true
             */
            apply_rules?: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description Not to be confused with the description of the actual transaction(s) being created.
             * @example Recurring transaction for the monthly rent
             */
            description?: string;
            /**
             * Format: date
             * @description First time the recurring transaction will fire. Must be after today.
             * @example 2026-03-31
             */
            first_date?: string;
            /**
             * Format: date
             * @description Last time the recurring transaction has fired.
             * @example 2026-03-01
             */
            readonly latest_date?: string | null;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @description Max number of created transactions. Use either this field or repeat_until.
             * @example 5
             */
            nr_of_repetitions?: number | null;
            /**
             * Format: date
             * @description Date until the recurring transaction can fire. Use either this field or repetitions.
             * @example 2026-03-31
             */
            repeat_until?: string | null;
            repetitions?: components["schemas"]["RecurrenceRepetition"][];
            /**
             * Format: string
             * @example Rent
             */
            title?: string;
            transactions?: components["schemas"]["RecurrenceTransaction"][];
            type?: components["schemas"]["RecurrenceTransactionType"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        RecurrenceRead: {
            attributes: components["schemas"]["RecurrenceProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example recurrences
             */
            type: string;
        };
        RecurrenceRepetition: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description Auto-generated repetition description.
             * @example Every week on Friday
             */
            readonly description?: string;
            /**
             * Format: string
             * @example 2
             */
            readonly id?: string;
            /**
             * Format: string
             * @description Information that defined the type of repetition.
             *     - For 'daily', this is empty.
             *     - For 'weekly', it is day of the week between 1 and 7 (Monday - Sunday).
             *     - For 'ndom', it is '1,2' or '4,5' or something else, where the first number is the week in the month, and the second number is the day in the week (between 1 and 7). '2,3' means: the 2nd Wednesday of the month
             *     - For 'monthly' it is the day of the month (1 - 31)
             *     - For yearly, it is a full date, ie '2026-03-01'. The year you use does not matter.
             * @example 3
             */
            moment: string;
            /** @description Array of future dates when the repetition will apply to. Auto generated. */
            readonly occurrences?: string[];
            /**
             * Format: int32
             * @description How many occurrences to skip. 0 means skip nothing. 1 means every other.
             * @example 0
             */
            skip?: number;
            type: components["schemas"]["RecurrenceRepetitionType"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: int32
             * @description How to respond when the recurring transaction falls in the weekend. Possible values:
             *     1. Do nothing, just create it
             *     2. Create no transaction.
             *     3. Skip to the previous Friday.
             *     4. Skip to the next Monday.
             * @example 1
             */
            weekend?: number;
        };
        RecurrenceRepetitionStore: {
            /**
             * Format: string
             * @description Information that defined the type of repetition.
             *     - For 'daily', this is empty.
             *     - For 'weekly', it is day of the week between 1 and 7 (Monday - Sunday).
             *     - For 'ndom', it is '1,2' or '4,5' or something else, where the first number is the week in the month, and the second number is the day in the week (between 1 and 7). '2,3' means: the 2nd Wednesday of the month
             *     - For 'monthly' it is the day of the month (1 - 31)
             *     - For yearly, it is a full date, ie '2026-03-01'. The year you use does not matter.
             * @example 3
             */
            moment: string;
            /**
             * Format: int32
             * @description How many occurrences to skip. 0 means skip nothing. 1 means every other.
             * @example 0
             */
            skip?: number;
            type: components["schemas"]["RecurrenceRepetitionType"];
            /**
             * Format: int32
             * @description How to respond when the recurring transaction falls in the weekend. Possible values:
             *     1. Do nothing, just create it
             *     2. Create no transaction.
             *     3. Skip to the previous Friday.
             *     4. Skip to the next Monday.
             * @example 1
             */
            weekend?: number;
        };
        /**
         * Format: string
         * @description The type of the repetition. ndom means: the n-th weekday of the month, where you can also specify which day of the week.
         * @example weekly
         * @enum {string}
         */
        RecurrenceRepetitionType: "daily" | "weekly" | "ndom" | "monthly" | "yearly";
        RecurrenceRepetitionUpdate: {
            /**
             * Format: string
             * @description Information that defined the type of repetition.
             *     - For 'daily', this is empty.
             *     - For 'weekly', it is day of the week between 1 and 7 (Monday - Sunday).
             *     - For 'ndom', it is '1,2' or '4,5' or something else, where the first number is the week in the month, and the second number is the day in the week (between 1 and 7). '2,3' means: the 2nd Wednesday of the month
             *     - For 'monthly' it is the day of the month (1 - 31)
             *     - For yearly, it is a full date, ie '2026-03-01'. The year you use does not matter.
             * @example 3
             */
            moment?: string;
            /**
             * Format: int32
             * @description How many occurrences to skip. 0 means skip nothing. 1 means every other.
             * @example 0
             */
            skip?: number;
            type?: components["schemas"]["RecurrenceRepetitionType"];
            /**
             * Format: int32
             * @description How to respond when the recurring transaction falls in the weekend. Possible values:
             *     1. Do nothing, just create it
             *     2. Create no transaction.
             *     3. Skip to the previous Friday.
             *     4. Skip to the next Monday.
             * @example 1
             */
            weekend?: number;
        };
        RecurrenceSingle: {
            data: components["schemas"]["RecurrenceRead"];
        };
        RecurrenceStore: {
            /**
             * @description If the recurrence is even active.
             * @example true
             */
            active?: boolean;
            /**
             * @description Whether or not to fire the rules after the creation of a transaction.
             * @example true
             */
            apply_rules?: boolean;
            /**
             * Format: string
             * @description Not to be confused with the description of the actual transaction(s) being created.
             * @example Recurring transaction for the monthly rent
             */
            description?: string;
            /**
             * Format: date
             * @description First time the recurring transaction will fire. Must be after today.
             * @example 2026-03-31
             */
            first_date: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @description Max number of created transactions. Use either this field or repeat_until.
             * @example 5
             */
            nr_of_repetitions?: number | null;
            /**
             * Format: date
             * @description Date until the recurring transaction can fire. Use either this field or repetitions.
             * @example 2026-03-31
             */
            repeat_until: string | null;
            repetitions: components["schemas"]["RecurrenceRepetitionStore"][];
            /**
             * Format: string
             * @example Rent
             */
            title: string;
            transactions: components["schemas"]["RecurrenceTransactionStore"][];
            type: components["schemas"]["RecurrenceTransactionType"];
        };
        RecurrenceTransaction: {
            /**
             * Format: amount
             * @description Amount of the transaction.
             * @example 123.45
             */
            amount: string;
            /**
             * Format: string
             * @description The budget ID for this transaction.
             * @example 4
             */
            budget_id?: string;
            /**
             * Format: string
             * @description The name of the budget to be used. If the budget name is unknown, the ID will be used or the value will be ignored.
             * @example Groceries
             */
            readonly budget_name?: string | null;
            /**
             * Format: string
             * @description Category ID for this transaction.
             * @example 211
             */
            category_id?: string;
            /**
             * Format: string
             * @description Category name for this transaction.
             * @example Bills
             */
            category_name?: string;
            /**
             * Format: string
             * @description The currency code of the currency associated with this object.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the currency associated with this object.
             * @example 5
             */
            currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the currency associated with this object.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: string
             * @example Rent for the current month
             */
            description: string;
            /**
             * Format: string
             * @example NL02ABNA0123456789
             */
            readonly destination_iban?: string | null;
            /**
             * Format: string
             * @description ID of the destination account. Submit either this or destination_name.
             * @example 258
             */
            destination_id?: string;
            /**
             * Format: string
             * @description Name of the destination account. Submit either this or destination_id.
             * @example Buy and Large
             */
            destination_name?: string;
            destination_type?: components["schemas"]["AccountTypeProperty"];
            /**
             * Format: amount
             * @description Foreign amount of the transaction.
             * @example 123.45
             */
            foreign_amount?: string | null;
            /**
             * Format: string
             * @example GBP
             */
            foreign_currency_code?: string | null;
            /**
             * Format: int32
             * @description Number of decimals in the currency
             * @example 2
             */
            readonly foreign_currency_decimal_places?: number | null;
            /**
             * Format: string
             * @example 17
             */
            foreign_currency_id?: string | null;
            /**
             * Format: string
             * @example British Pound
             */
            foreign_currency_name?: string | null;
            /**
             * Format: string
             * @example $
             */
            readonly foreign_currency_symbol?: string | null;
            /**
             * Format: string
             * @example ID of the recurring transaction. Not to be confused with the ID of the recurrence itself.
             */
            id?: string;
            /**
             * @description Indicates whether the object has a currency setting. If false, the object uses the administration's primary currency.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: amount
             * @description Amount of the transaction in primary currency.
             * @example 123.45
             */
            pc_amount?: string;
            /**
             * Format: amount
             * @description Foreign amount of the transaction.
             * @example 123.45
             */
            pc_foreign_amount?: string | null;
            /**
             * Format: string
             * @example 123
             */
            piggy_bank_id?: string | null;
            /** Format: string */
            piggy_bank_name?: string | null;
            /**
             * Format: string
             * @description The currency code of the administration's primary currency.
             * @example EUR
             */
            readonly primary_currency_code?: string;
            /**
             * Format: int32
             * @description The currency decimal places of the administration's primary currency.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description The currency ID of the administration's primary currency.
             * @example 5
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description The currency name of the administration's primary currency.
             * @example Euro
             */
            readonly primary_currency_name?: string;
            /**
             * Format: string
             * @description The currency symbol of the administration's primary currency.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /**
             * Format: string
             * @example NL02ABNA0123456789
             */
            readonly source_iban?: string | null;
            /**
             * Format: string
             * @description ID of the source account. Submit either this or source_name.
             * @example 913
             */
            source_id?: string;
            /**
             * Format: string
             * @description Name of the source account. Submit either this or source_id.
             * @example Checking account
             */
            source_name?: string;
            source_type?: components["schemas"]["AccountTypeProperty"];
            /**
             * Format: string
             * @example 123
             */
            subscription_id?: string | null;
            /** Format: string */
            subscription_name?: string | null;
            /**
             * @description Array of tags.
             * @example null
             */
            tags?: string[] | null;
        };
        RecurrenceTransactionStore: {
            /**
             * Format: amount
             * @description Amount of the transaction.
             * @example 123.45
             */
            amount: string;
            /**
             * Format: string
             * @description Optional.
             * @example 123
             */
            bill_id?: string | null;
            /**
             * Format: string
             * @description The budget ID for this transaction.
             * @example 4
             */
            budget_id?: string;
            /**
             * Format: string
             * @description Category ID for this transaction.
             * @example 211
             */
            category_id?: string;
            /**
             * Format: string
             * @description Submit either a currency_id or a currency_code.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Submit either a currency_id or a currency_code.
             * @example 3
             */
            currency_id?: string;
            /**
             * Format: string
             * @example Rent for the current month
             */
            description: string;
            /**
             * Format: string
             * @description ID of the destination account.
             * @example 258
             */
            destination_id: string;
            /**
             * Format: amount
             * @description Foreign amount of the transaction.
             * @example 123.45
             */
            foreign_amount?: string | null;
            /**
             * Format: string
             * @description Submit either a foreign_currency_id or a foreign_currency_code, or neither.
             * @example GBP
             */
            foreign_currency_code?: string | null;
            /**
             * Format: string
             * @description Submit either a foreign_currency_id or a foreign_currency_code, or neither.
             * @example 17
             */
            foreign_currency_id?: string | null;
            /**
             * Format: string
             * @description Optional.
             * @example 123
             */
            piggy_bank_id?: string | null;
            /**
             * Format: string
             * @description ID of the source account.
             * @example 913
             */
            source_id: string;
            /**
             * @description Array of tags.
             * @example null
             */
            tags?: string[] | null;
        };
        /**
         * Format: string
         * @example withdrawal
         * @enum {string}
         */
        RecurrenceTransactionType: "withdrawal" | "transfer" | "deposit";
        RecurrenceTransactionUpdate: {
            /**
             * Format: amount
             * @description Amount of the transaction.
             * @example 123.45
             */
            amount?: string;
            /**
             * Format: string
             * @description Optional.
             * @example 123
             */
            bill_id?: string | null;
            /**
             * Format: string
             * @description The budget ID for this transaction.
             * @example 4
             */
            budget_id?: string;
            /**
             * Format: string
             * @description Category ID for this transaction.
             * @example 211
             */
            category_id?: string;
            /**
             * Format: string
             * @description Submit either a currency_id or a currency_code.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: string
             * @description Submit either a currency_id or a currency_code.
             * @example 3
             */
            currency_id?: string;
            /**
             * Format: string
             * @example Rent for the current month
             */
            description?: string;
            /**
             * Format: string
             * @description ID of the destination account. Submit either this or destination_name.
             * @example 258
             */
            destination_id?: string;
            /**
             * Format: amount
             * @description Foreign amount of the transaction.
             * @example 123.45
             */
            foreign_amount?: string | null;
            /**
             * Format: string
             * @description Submit either a foreign_currency_id or a foreign_currency_code, or neither.
             * @example 17
             */
            foreign_currency_id?: string | null;
            /**
             * Format: string
             * @example ID of the recurring transaction. Not to be confused with the ID of the recurrence itself. Is marked as REQUIRED but can be skipped when there is only ONE transaction.
             */
            id: string;
            /**
             * Format: string
             * @example 123
             */
            piggy_bank_id?: string | null;
            /**
             * Format: string
             * @description ID of the source account. Submit either this or source_name.
             * @example 913
             */
            source_id?: string;
            /**
             * @description Array of tags.
             * @example null
             */
            tags?: string[] | null;
        };
        RecurrenceUpdate: {
            /**
             * @description If the recurrence is even active.
             * @example true
             */
            active?: boolean;
            /**
             * @description Whether or not to fire the rules after the creation of a transaction.
             * @example true
             */
            apply_rules?: boolean;
            /**
             * Format: string
             * @description Not to be confused with the description of the actual transaction(s) being created.
             * @example Recurring transaction for the monthly rent
             */
            description?: string;
            /**
             * Format: date
             * @description First time the recurring transaction will fire.
             * @example 2026-03-31
             */
            first_date?: string;
            /**
             * Format: string
             * @example Some notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @description Max number of created transactions. Use either this field or repeat_until.
             * @example 5
             */
            nr_of_repetitions?: number | null;
            /**
             * Format: date
             * @description Date until when the recurring transaction can fire. After that date, it's basically inactive. Use either this field or repetitions.
             * @example 2026-03-31
             */
            repeat_until?: string | null;
            repetitions?: components["schemas"]["RecurrenceRepetitionUpdate"][];
            /**
             * Format: string
             * @example Rent
             */
            title?: string;
            transactions?: components["schemas"]["RecurrenceTransactionUpdate"][];
        };
        Rule: {
            actions: components["schemas"]["RuleAction"][];
            /**
             * @description Whether or not the rule is even active. Default is true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @example First rule description
             */
            description?: string;
            /**
             * Format: int32
             * @example 5
             */
            readonly order?: number;
            /**
             * Format: string
             * @description ID of the rule group under which the rule must be stored. Either this field or rule_group_title is mandatory.
             * @example 81
             */
            rule_group_id: string;
            /**
             * Format: string
             * @description Title of the rule group under which the rule must be stored. Either this field or rule_group_id is mandatory.
             * @example New rule group
             */
            rule_group_title?: string;
            /**
             * @description If this value is true and the rule is triggered, other rules  after this one in the group will be skipped. Default value is false.
             * @default false
             * @example false
             */
            stop_processing: boolean;
            /**
             * @description If the rule is set to be strict, ALL triggers must hit in order for the rule to fire. Otherwise, just one is enough. Default value is true.
             * @example true
             */
            strict?: boolean;
            /**
             * Format: string
             * @example First rule title.
             */
            title: string;
            trigger: components["schemas"]["RuleTriggerType"];
            triggers: components["schemas"]["RuleTrigger"][];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        RuleAction: {
            /**
             * @description If the action is active. Defaults to true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @example 2
             */
            readonly id?: string;
            /**
             * Format: int32
             * @description Order of the action
             * @example 5
             */
            order?: number;
            /**
             * @description When true, other actions will not be fired after this action has fired. Defaults to false.
             * @default false
             * @example false
             */
            stop_processing: boolean;
            type: components["schemas"]["RuleActionKeyword"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @description The accompanying value the action will set, change or update. Can be empty, but for some types this value is mandatory.
             * @example Daily groceries
             */
            value: string | null;
        };
        /**
         * Format: string
         * @description The type of thing this action will do. A limited set is possible.
         * @example set_category
         * @enum {string}
         */
        RuleActionKeyword: "user_action" | "set_category" | "clear_category" | "set_budget" | "clear_budget" | "add_tag" | "remove_tag" | "remove_all_tags" | "set_description" | "append_description" | "prepend_description" | "set_source_account" | "set_destination_account" | "set_notes" | "append_notes" | "prepend_notes" | "clear_notes" | "link_to_bill" | "convert_withdrawal" | "convert_deposit" | "convert_transfer" | "delete_transaction";
        RuleActionStore: {
            /**
             * @description If the action is active. Defaults to true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: int32
             * @description Order of the action
             * @example 5
             */
            order?: number;
            /**
             * @description When true, other actions will not be fired after this action has fired. Defaults to false.
             * @default false
             * @example false
             */
            stop_processing: boolean;
            type: components["schemas"]["RuleActionKeyword"];
            /**
             * Format: string
             * @description The accompanying value the action will set, change or update. Can be empty, but for some types this value is mandatory.
             * @example Daily groceries
             */
            value: string | null;
        };
        RuleActionUpdate: {
            /**
             * @description If the action is active.
             * @example true
             */
            active?: boolean;
            /**
             * Format: int32
             * @description Order of the action
             * @example 5
             */
            order?: number;
            /**
             * @description When true, other actions will not be fired after this action has fired.
             * @example false
             */
            stop_processing?: boolean;
            type?: components["schemas"]["RuleActionKeyword"];
            /**
             * Format: string
             * @description The accompanying value the action will set, change or update. Can be empty, but for some types this value is mandatory.
             * @example Daily groceries
             */
            value?: string | null;
        };
        RuleArray: {
            data: components["schemas"]["RuleRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        RuleGroup: {
            /** @example true */
            active?: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @example Description of this rule group
             */
            description?: string | null;
            /**
             * Format: int32
             * @example 4
             */
            readonly order?: number;
            /**
             * Format: string
             * @example Default rule group
             */
            title: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        RuleGroupArray: {
            data: components["schemas"]["RuleGroupRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        RuleGroupRead: {
            attributes: components["schemas"]["RuleGroup"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example rules_group
             */
            type: string;
        };
        RuleGroupSingle: {
            data: components["schemas"]["RuleGroupRead"];
        };
        RuleGroupStore: {
            /** @example true */
            active?: boolean;
            /**
             * Format: string
             * @example Description of this rule group
             */
            description?: string | null;
            /**
             * Format: int32
             * @example 4
             */
            order?: number;
            /**
             * Format: string
             * @example Default rule group
             */
            title: string;
        };
        RuleGroupUpdate: {
            /** @example true */
            active?: boolean;
            /**
             * Format: string
             * @example Description of this rule group
             */
            description?: string | null;
            /**
             * Format: int32
             * @example 4
             */
            order?: number;
            /**
             * Format: string
             * @example Default rule group
             */
            title?: string;
        };
        RuleRead: {
            attributes: components["schemas"]["Rule"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example rules
             */
            type: string;
        };
        RuleSingle: {
            data: components["schemas"]["RuleRead"];
        };
        RuleStore: {
            actions: components["schemas"]["RuleActionStore"][];
            /**
             * @description Whether or not the rule is even active. Default is true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: string
             * @example First rule description
             */
            description?: string;
            /**
             * Format: int32
             * @example 5
             */
            order?: number;
            /**
             * Format: string
             * @description ID of the rule group under which the rule must be stored. Either this field or rule_group_title is mandatory.
             * @example 81
             */
            rule_group_id: string;
            /**
             * Format: string
             * @description Title of the rule group under which the rule must be stored. Either this field or rule_group_id is mandatory.
             * @example New rule group
             */
            rule_group_title?: string;
            /**
             * @description If this value is true and the rule is triggered, other rules  after this one in the group will be skipped. Default value is false.
             * @example false
             */
            stop_processing?: boolean;
            /**
             * @description If the rule is set to be strict, ALL triggers must hit in order for the rule to fire. Otherwise, just one is enough. Default value is true.
             * @default true
             * @example true
             */
            strict: boolean;
            /**
             * Format: string
             * @example First rule title.
             */
            title: string;
            trigger: components["schemas"]["RuleTriggerType"];
            triggers: components["schemas"]["RuleTriggerStore"][];
        };
        RuleTrigger: {
            /**
             * @description If the trigger is active. Defaults to true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @example 2
             */
            readonly id?: string;
            /**
             * Format: int32
             * @description Order of the trigger
             * @example 5
             */
            readonly order?: number;
            /**
             * @description If 'prohibited' is true, this rule trigger will be negated. 'Description is' will become 'Description is NOT' etc.
             * @default false
             * @example false
             */
            prohibited: boolean;
            /**
             * @description When true, other triggers will not be checked if this trigger was triggered. Defaults to false.
             * @default false
             * @example false
             */
            stop_processing: boolean;
            type: components["schemas"]["RuleTriggerKeyword"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @description The accompanying value the trigger responds to. This value is often mandatory, but this depends on the trigger.
             * @example tag1
             */
            value: string;
        };
        /**
         * Format: string
         * @description The type of thing this trigger responds to. A limited set is possible
         * @example user_action
         * @enum {string}
         */
        RuleTriggerKeyword: "from_account_starts" | "from_account_ends" | "from_account_is" | "from_account_contains" | "to_account_starts" | "to_account_ends" | "to_account_is" | "to_account_contains" | "amount_less" | "amount_exactly" | "amount_more" | "description_starts" | "description_ends" | "description_contains" | "description_is" | "transaction_type" | "category_is" | "budget_is" | "tag_is" | "currency_is" | "has_attachments" | "has_no_category" | "has_any_category" | "has_no_budget" | "has_any_budget" | "has_no_tag" | "has_any_tag" | "notes_contains" | "notes_starts" | "notes_end" | "notes_are" | "no_notes" | "any_notes" | "source_account_is" | "destination_account_is" | "source_account_starts";
        RuleTriggerStore: {
            /**
             * @description If the trigger is active. Defaults to true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: int32
             * @description Order of the trigger
             * @example 5
             */
            order?: number;
            /**
             * @description If 'prohibited' is true, this rule trigger will be negated. 'Description is' will become 'Description is NOT' etc.
             * @default false
             * @example false
             */
            prohibited: boolean;
            /**
             * @description When true, other triggers will not be checked if this trigger was triggered. Defaults to false.
             * @default false
             * @example false
             */
            stop_processing: boolean;
            type: components["schemas"]["RuleTriggerKeyword"];
            /**
             * Format: string
             * @description The accompanying value the trigger responds to. This value is often mandatory, but this depends on the trigger.
             * @example tag1
             */
            value: string;
        };
        /**
         * Format: string
         * @description Which action is necessary for the rule to fire? Use either store-journal, update-journal or manual-activation.
         * @example store-journal
         * @enum {string}
         */
        RuleTriggerType: "store-journal" | "update-journal" | "manual-activation";
        RuleTriggerUpdate: {
            /**
             * @description If the trigger is active.
             * @example true
             */
            active?: boolean;
            /**
             * Format: int32
             * @description Order of the trigger
             * @example 5
             */
            order?: number;
            /**
             * @description When true, other triggers will not be checked if this trigger was triggered.
             * @example false
             */
            stop_processing?: boolean;
            type?: components["schemas"]["RuleTriggerKeyword"];
            /**
             * Format: string
             * @description The accompanying value the trigger responds to. This value is often mandatory, but this depends on the trigger. If the rule trigger is something like 'has any tag', submit the string 'true'.
             * @example tag1
             */
            value?: string;
        };
        RuleUpdate: {
            actions?: components["schemas"]["RuleActionUpdate"][];
            /**
             * @description Whether or not the rule is even active. Default is true.
             * @default true
             * @example true
             */
            active: boolean;
            /**
             * Format: string
             * @example First rule description
             */
            description?: string;
            /**
             * Format: int32
             * @example 5
             */
            order?: number;
            /**
             * Format: string
             * @description ID of the rule group under which the rule must be stored. Either this field or rule_group_title is mandatory.
             * @example 81
             */
            rule_group_id?: string;
            /**
             * @description If this value is true and the rule is triggered, other rules  after this one in the group will be skipped. Default value is false.
             * @default false
             * @example false
             */
            stop_processing: boolean;
            /**
             * @description If the rule is set to be strict, ALL triggers must hit in order for the rule to fire. Otherwise, just one is enough. Default value is true.
             * @example true
             */
            strict?: boolean;
            /**
             * Format: string
             * @example First rule title.
             */
            title?: string;
            trigger?: components["schemas"]["RuleTriggerType"];
            triggers?: components["schemas"]["RuleTriggerUpdate"][];
        };
        /**
         * Format: string
         * @description Can only be one one these account types. import, initial-balance and reconciliation cannot be set manually.
         * @example asset
         * @enum {string}
         */
        ShortAccountTypeProperty: "asset" | "expense" | "import" | "revenue" | "cash" | "liability" | "liabilities" | "initial-balance" | "reconciliation";
        /**
         * Format: string
         * @description The actual preference content.
         * @example EUR
         */
        StringArrayItem: string;
        SystemInfo: {
            data?: {
                /**
                 * Format: string
                 * @description Same value as the version field.
                 * @example 6.5.5
                 */
                api_version?: string;
                /**
                 * Format: string
                 * @example mysql
                 */
                driver?: string;
                /**
                 * Format: string
                 * @example Linux
                 */
                os?: string;
                /**
                 * Format: string
                 * @example 8.1.5
                 */
                php_version?: string;
                /**
                 * Format: string
                 * @example 6.5.5
                 */
                version?: string;
            };
        };
        TagArray: {
            data: components["schemas"]["TagRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        /** A single tag (C) */
        TagModel: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: date
             * @description The date to which the tag is applicable.
             * @example 2026-03-01
             */
            date?: string | null;
            /**
             * Format: string
             * @example Tag for expensive stuff
             */
            description?: string | null;
            /**
             * Format: double
             * @description Latitude of the tag's location, if applicable. Can be used to draw a map.
             * @example 51.983333
             */
            latitude?: number | null;
            /**
             * Format: double
             * @description Latitude of the tag's location, if applicable. Can be used to draw a map.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: string
             * @description The tag
             * @example expensive
             */
            tag: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels.
             * @example 6
             */
            zoom_level?: number | null;
        };
        /** A single tag (A) */
        TagModelStore: {
            /**
             * Format: date
             * @description The date to which the tag is applicable.
             * @example 2026-03-01
             */
            date?: string | null;
            /**
             * Format: string
             * @example Tag for expensive stuff
             */
            description?: string | null;
            /**
             * Format: double
             * @description Latitude of the tag's location, if applicable. Can be used to draw a map.
             * @example 51.983333
             */
            latitude?: number | null;
            /**
             * Format: double
             * @description Latitude of the tag's location, if applicable. Can be used to draw a map.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: string
             * @description The tag
             * @example expensive
             */
            tag: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels.
             * @example 6
             */
            zoom_level?: number | null;
        };
        /** A single tag (B) */
        TagModelUpdate: {
            /**
             * Format: date
             * @description The date to which the tag is applicable.
             * @example 2026-03-01
             */
            date?: string | null;
            /**
             * Format: string
             * @example Tag for expensive stuff
             */
            description?: string | null;
            /**
             * Format: double
             * @description Latitude of the tag's location, if applicable. Can be used to draw a map.
             * @example 51.983333
             */
            latitude?: number | null;
            /**
             * Format: double
             * @description Latitude of the tag's location, if applicable. Can be used to draw a map.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: string
             * @description The tag
             * @example expensive
             */
            tag?: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels.
             * @example 6
             */
            zoom_level?: number | null;
        };
        TagRead: {
            attributes: components["schemas"]["TagModel"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example tags
             */
            type: string;
        };
        TagSingle: {
            data: components["schemas"]["TagRead"];
        };
        Transaction: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description Title of the transaction if it has been split in more than one piece. Empty otherwise.
             * @example Split transaction title.
             */
            group_title?: string | null;
            transactions: components["schemas"]["TransactionSplit"][];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @description User ID
             * @example 3
             */
            readonly user?: string;
        };
        TransactionArray: {
            data: components["schemas"]["TransactionRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        TransactionLink: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description The inward transaction transaction_journal_id for the link. This becomes the 'is paid by' transaction of the set.
             * @example 131
             */
            inward_id: string;
            /**
             * Format: string
             * @description The link type ID to use. You can also use the link_type_name field.
             * @example 5
             */
            link_type_id: string;
            /**
             * Format: string
             * @description The link type name to use. You can also use the link_type_id field.
             * @example Is paid by
             */
            link_type_name?: string;
            /**
             * Format: string
             * @description Optional. Some notes.
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The outward transaction transaction_journal_id for the link. This becomes the 'pays for' transaction of the set.
             * @example 131
             */
            outward_id: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        TransactionLinkArray: {
            data: components["schemas"]["TransactionLinkRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        TransactionLinkRead: {
            attributes: components["schemas"]["TransactionLink"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example transactionLinks
             */
            type: string;
        };
        TransactionLinkSingle: {
            data: components["schemas"]["TransactionLinkRead"];
        };
        TransactionLinkStore: {
            /**
             * Format: string
             * @description The inward transaction transaction_journal_id for the link. This becomes the 'is paid by' transaction of the set.
             * @example 131
             */
            inward_id: string;
            /**
             * Format: string
             * @description The link type ID to use. You can also use the link_type_name field.
             * @example 5
             */
            link_type_id: string;
            /**
             * Format: string
             * @description The link type name to use. You can also use the link_type_id field.
             * @example Is paid by
             */
            link_type_name?: string;
            /**
             * Format: string
             * @description Optional. Some notes.
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The outward transaction transaction_journal_id for the link. This becomes the 'pays for' transaction of the set.
             * @example 131
             */
            outward_id: string;
        };
        TransactionLinkUpdate: {
            /**
             * Format: string
             * @description The inward transaction transaction_journal_id for the link. This becomes the 'is paid by' transaction of the set.
             * @example 131
             */
            inward_id?: string;
            /**
             * Format: string
             * @description The link type ID to use. Use this field OR use the link_type_name field.
             * @example 5
             */
            link_type_id?: string;
            /**
             * Format: string
             * @description The link type name to use. Use this field OR use the link_type_id field.
             * @example Is paid by
             */
            link_type_name?: string;
            /**
             * Format: string
             * @description Optional. Some notes. If you submit an empty string the current notes will be removed
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: string
             * @description The outward transaction transaction_journal_id for the link. This becomes the 'pays for' transaction of the set.
             * @example 131
             */
            outward_id?: string;
        };
        TransactionRead: {
            attributes: components["schemas"]["Transaction"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example transactions
             */
            type: string;
        };
        TransactionSingle: {
            data: components["schemas"]["TransactionRead"];
        };
        TransactionSplit: {
            /**
             * Format: amount
             * @description Amount of the transaction.
             * @example 123.45
             */
            amount: string;
            /**
             * Format: string
             * @description The associated subscription ID for this transaction. `bill` refers to the OLD name for subscriptions and this field will be removed.
             * @example 111
             */
            bill_id?: string | null;
            /**
             * Format: string
             * @description The associated subscription name for this transaction. `bill` refers to the OLD name for subscriptions and this field will be removed.
             * @example Monthly rent
             */
            bill_name?: string | null;
            /** Format: date-time */
            book_date?: string | null;
            /**
             * Format: string
             * @description The budget ID for this transaction.
             * @example 4
             */
            budget_id?: string | null;
            /**
             * Format: string
             * @description The name of the budget used.
             * @example Groceries
             */
            readonly budget_name?: string | null;
            /**
             * Format: string
             * @description The category ID for this transaction.
             * @example 43
             */
            category_id?: string | null;
            /**
             * Format: string
             * @description The name of the category to be used. If the category is unknown, it will be created. If the ID and the name point to different categories, the ID overrules the name.
             * @example Groceries
             */
            category_name?: string | null;
            /**
             * Format: string
             * @description Currency code for the currency of this transaction.
             * @example EUR
             */
            currency_code?: string;
            /**
             * Format: int32
             * @description Number of decimals used in this currency.
             * @example 2
             */
            currency_decimal_places?: number;
            /**
             * Format: string
             * @description Currency ID for the currency of this transaction.
             * @example 12
             */
            currency_id?: string;
            /**
             * Format: string
             * @description Currency name for the currency of this transaction.
             * @example Euro
             */
            currency_name?: string;
            /**
             * Format: string
             * @description Currency symbol for the currency of this transaction.
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @description Date of the transaction
             * @example 2026-03-01T00:00:00+00:00
             */
            date: string;
            /**
             * Format: string
             * @description Description of the transaction.
             * @example Vegetables
             */
            description: string;
            /**
             * Format: amount
             * @description The balance of the destination account. This is the balance in the account's currency which may be different from this transaction, and is not provided in this model.
             * @example 123.45
             */
            destination_balance_after?: string | null;
            /**
             * Format: string
             * @example NL02ABNA0123456789
             */
            readonly destination_iban?: string | null;
            /**
             * Format: string
             * @description ID of the destination account. For a deposit or a transfer, this must always be an asset account. For withdrawals this must be an expense account.
             * @example 2
             */
            destination_id: string | null;
            /**
             * Format: string
             * @description Name of the destination account. You can submit the name instead of the ID. For everything except transfers, the account will be auto-generated if unknown, so submitting a name is enough.
             * @example Buy and Large
             */
            destination_name?: string | null;
            destination_type?: components["schemas"]["AccountTypeProperty"];
            /** Format: date-time */
            due_date?: string | null;
            /**
             * Format: string
             * @description Reference to external ID in other systems.
             */
            external_id?: string | null;
            /**
             * Format: string
             * @description External, custom URL for this transaction.
             */
            external_url?: string | null;
            /**
             * Format: amount
             * @description The amount in the set foreign currency. May be NULL if the transaction does not have a foreign amount.
             * @example 123.45
             */
            foreign_amount?: string | null;
            /**
             * Format: string
             * @description Currency code of the foreign currency. Default is NULL.
             * @example USD
             */
            foreign_currency_code?: string | null;
            /**
             * Format: int32
             * @description Number of decimals in the foreign currency.
             * @example 2
             */
            readonly foreign_currency_decimal_places?: number | null;
            /**
             * Format: string
             * @description Currency ID of the foreign currency, if this transaction has a foreign amount.
             * @example 17
             */
            foreign_currency_id?: string | null;
            /**
             * Format: string
             * @example $
             */
            readonly foreign_currency_symbol?: string | null;
            /**
             * @description If the transaction has attachments.
             * @example false
             */
            has_attachments?: boolean;
            /**
             * Format: string
             * @description Hash value of original import transaction (for duplicate detection).
             */
            readonly import_hash_v2?: string | null;
            /** Format: date-time */
            interest_date?: string | null;
            /**
             * Format: string
             * @description Reference to internal reference of other systems.
             */
            internal_reference?: string | null;
            /** Format: date-time */
            invoice_date?: string | null;
            /**
             * Format: double
             * @description Latitude of the transaction's location, if applicable. Can be used to draw a map.
             * @example 51.983333
             */
            latitude?: number | null;
            /**
             * Format: double
             * @description Latitude of the transaction's location, if applicable. Can be used to draw a map.
             * @example 5.916667
             */
            longitude?: number | null;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * @description Indicates whether the transaction has a currency setting. For transactions this is always true.
             * @example true
             */
            readonly object_has_currency_setting?: boolean;
            /**
             * Format: int32
             * @description Order of this entry in the list of transactions.
             * @example 0
             */
            order?: number | null;
            /**
             * Format: string
             * @description System generated identifier for original creator of transaction.
             */
            readonly original_source?: string | null;
            /** Format: date-time */
            payment_date?: string | null;
            /**
             * Format: amount
             * @description Amount of the transaction in the primary currency of this administration. The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example 123.45
             */
            pc_amount?: string;
            /**
             * Format: amount
             * @description The balance of the destination account in the primary currency of this administration. The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example 123.45
             */
            pc_destination_balance_after?: string | null;
            /**
             * Format: amount
             * @description Foreign amount of the transaction in the primary currency of this administration. The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example 123.45
             */
            pc_foreign_amount?: string;
            /**
             * Format: amount
             * @description The balance of the source account in the primary currency of this administration. The `primary_currency_*` fields reflect the currency used. This field is NULL if the user does have 'convert to primary' set to true in their settings.
             * @example 123.45
             */
            pc_source_balance_after?: string | null;
            /**
             * Format: string
             * @description Returns the primary currency code of the administration. This currency is used as the currency for all `pc_*` amount and balance fields of this account.
             * @example EUR
             */
            primary_currency_code?: string | null;
            /**
             * Format: int32
             * @description See the other `primary_*` fields.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number | null;
            /**
             * Format: string
             * @description Returns the primary currency ID of the administration. This currency is used as the currency for all `pc_*` amount and balance fields of this account.
             * @example 12
             */
            readonly primary_currency_id?: string | null;
            /**
             * Format: string
             * @description See the other `primary_*` fields.
             * @example $
             */
            readonly primary_currency_symbol?: string | null;
            /** Format: date-time */
            process_date?: string | null;
            /**
             * @description If the transaction has been reconciled already. When you set this, the amount can no longer be edited by the user.
             * @example false
             */
            reconciled?: boolean;
            /**
             * Format: int32
             * @description The # of the current transaction created under this recurrence.
             * @example 12
             */
            readonly recurrence_count?: number | null;
            /**
             * Format: string
             * @description Reference to recurrence that made the transaction.
             */
            readonly recurrence_id?: string | null;
            /**
             * Format: int32
             * @description Total number of transactions expected to be created by this recurrence repetition. Will be 0 if infinite.
             * @example 0
             */
            readonly recurrence_total?: number | null;
            /**
             * Format: string
             * @description SEPA Batch ID
             */
            sepa_batch_id?: string | null;
            /**
             * Format: string
             * @description SEPA Clearing Code
             */
            sepa_cc?: string | null;
            /**
             * Format: string
             * @description SEPA Creditor Identifier
             */
            sepa_ci?: string | null;
            /**
             * Format: string
             * @description SEPA Country
             */
            sepa_country?: string | null;
            /**
             * Format: string
             * @description SEPA end-to-end Identifier
             */
            sepa_ct_id?: string | null;
            /**
             * Format: string
             * @description SEPA Opposing Account Identifier
             */
            sepa_ct_op?: string | null;
            /**
             * Format: string
             * @description SEPA mandate identifier
             */
            sepa_db?: string | null;
            /**
             * Format: string
             * @description SEPA External Purpose indicator
             */
            sepa_ep?: string | null;
            /**
             * Format: amount
             * @description The balance of the source account. This is the balance in the account's currency which may be different from this transaction, and is not provided in this model.
             * @example 123.45
             */
            source_balance_after?: string | null;
            /**
             * Format: string
             * @example NL02ABNA0123456789
             */
            readonly source_iban?: string | null;
            /**
             * Format: string
             * @description ID of the source account. For a withdrawal or a transfer, this must always be an asset account. For deposits, this must be a revenue account.
             * @example 2
             */
            source_id: string | null;
            /**
             * Format: string
             * @description Name of the source account. For a withdrawal or a transfer, this must always be an asset account. For deposits, this must be a revenue account. Can be used instead of the source_id. If the transaction is a deposit, the source_name can be filled in freely: the account will be created based on the name.
             * @example Checking account
             */
            source_name?: string | null;
            source_type?: components["schemas"]["AccountTypeProperty"];
            /**
             * Format: string
             * @description The associated subscription ID for this transaction.
             * @example 111
             */
            subscription_id?: string | null;
            /**
             * Format: string
             * @description The associated subscription name for this transaction.
             * @example Monthly rent
             */
            subscription_name?: string | null;
            /**
             * @description Array of tags.
             * @example null
             */
            tags?: string[] | null;
            /**
             * Format: string
             * @description ID of the underlying transaction journal. Each transaction consists of a transaction group (see the top ID) and one or more journals
             *     making up the splits of the transaction.
             * @example 10421
             */
            readonly transaction_journal_id?: string;
            type: components["schemas"]["TransactionTypeProperty"];
            /**
             * Format: string
             * @description User ID
             * @example 3
             */
            readonly user?: string;
            /**
             * Format: int32
             * @description Zoom level for the map, if drawn. This to set the box right. Unfortunately this is a proprietary value because each map provider has different zoom levels.
             * @example 6
             */
            zoom_level?: number | null;
        };
        TransactionSplitStore: {
            /**
             * Format: amount
             * @description Amount of the transaction.
             * @example 123.45
             */
            amount: string;
            /**
             * Format: string
             * @description Optional. Use either this or the bill_name
             * @example 112
             */
            bill_id?: string | null;
            /**
             * Format: string
             * @description Optional. Use either this or the bill_id
             * @example Monthly rent
             */
            bill_name?: string | null;
            /** Format: date-time */
            book_date?: string | null;
            /**
             * Format: string
             * @description The budget ID for this transaction.
             * @example 4
             */
            budget_id?: string | null;
            /**
             * Format: string
             * @description The name of the budget to be used. If the budget name is unknown, the ID will be used or the value will be ignored.
             * @example Groceries
             */
            budget_name?: string | null;
            /**
             * Format: string
             * @description The category ID for this transaction.
             * @example 43
             */
            category_id?: string | null;
            /**
             * Format: string
             * @description The name of the category to be used. If the category is unknown, it will be created. If the ID and the name point to different categories, the ID overrules the name.
             * @example Groceries
             */
            category_name?: string | null;
            /**
             * Format: string
             * @description Currency code. Default is the source account's currency, or the user's financial administration's primary currency. The value you submit may be overruled by the source or destination account.
             * @example EUR
             */
            currency_code?: string | null;
            /**
             * Format: string
             * @description Currency ID. Default is the source account's currency, or the user's financial administration's currency. The value you submit may be overruled by the source or destination account.
             * @example 12
             */
            currency_id?: string | null;
            /**
             * Format: date-time
             * @description Date of the transaction
             * @example 2026-03-01T00:00:00+00:00
             */
            date: string;
            /**
             * Format: string
             * @description Description of the transaction.
             * @example Vegetables
             */
            description: string;
            /**
             * Format: string
             * @description ID of the destination account. For a deposit or a transfer, this must always be an asset account. For withdrawals this must be an expense account.
             * @example 2
             */
            destination_id?: string | null;
            /**
             * Format: string
             * @description Name of the destination account. You can submit the name instead of the ID. For everything except transfers, the account will be auto-generated if unknown, so submitting a name is enough.
             * @example Buy and Large
             */
            destination_name?: string | null;
            /** Format: date-time */
            due_date?: string | null;
            /**
             * Format: string
             * @description Reference to external ID in other systems.
             */
            external_id?: string | null;
            /**
             * Format: string
             * @description External, custom URL for this transaction.
             */
            external_url?: string | null;
            /**
             * Format: amount
             * @description The amount in a foreign currency.
             * @example 123.45
             */
            foreign_amount?: string | null;
            /**
             * Format: string
             * @description Currency code of the foreign currency. Default is NULL. Can be used instead of the foreign_currency_id, but this or the ID is required when submitting a foreign amount.
             * @example USD
             */
            foreign_currency_code?: string | null;
            /**
             * Format: string
             * @description Currency ID of the foreign currency. Default is null. Is required when you submit a foreign amount.
             * @example 17
             */
            foreign_currency_id?: string | null;
            /** Format: date-time */
            interest_date?: string | null;
            /**
             * Format: string
             * @description Reference to internal reference of other systems.
             */
            internal_reference?: string | null;
            /** Format: date-time */
            invoice_date?: string | null;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @description Order of this entry in the list of transactions.
             * @example 0
             */
            order?: number | null;
            /** Format: date-time */
            payment_date?: string | null;
            /**
             * Format: int32
             * @description Optional. Use either this or the piggy_bank_name
             */
            piggy_bank_id?: number | null;
            /**
             * Format: string
             * @description Optional. Use either this or the piggy_bank_id
             */
            piggy_bank_name?: string | null;
            /** Format: date-time */
            process_date?: string | null;
            /**
             * @description If the transaction has been reconciled already. When you set this, the amount can no longer be edited by the user.
             * @example false
             */
            reconciled?: boolean;
            /**
             * Format: string
             * @description SEPA Batch ID
             */
            sepa_batch_id?: string | null;
            /**
             * Format: string
             * @description SEPA Clearing Code
             */
            sepa_cc?: string | null;
            /**
             * Format: string
             * @description SEPA Creditor Identifier
             */
            sepa_ci?: string | null;
            /**
             * Format: string
             * @description SEPA Country
             */
            sepa_country?: string | null;
            /**
             * Format: string
             * @description SEPA end-to-end Identifier
             */
            sepa_ct_id?: string | null;
            /**
             * Format: string
             * @description SEPA Opposing Account Identifier
             */
            sepa_ct_op?: string | null;
            /**
             * Format: string
             * @description SEPA mandate identifier
             */
            sepa_db?: string | null;
            /**
             * Format: string
             * @description SEPA External Purpose indicator
             */
            sepa_ep?: string | null;
            /**
             * Format: string
             * @description ID of the source account. For a withdrawal or a transfer, this must always be an asset account. For deposits, this must be a revenue account.
             * @example 2
             */
            source_id?: string | null;
            /**
             * Format: string
             * @description Name of the source account. For a withdrawal or a transfer, this must always be an asset account. For deposits, this must be a revenue account. Can be used instead of the source_id. If the transaction is a deposit, the source_name can be filled in freely: the account will be created based on the name.
             * @example Checking account
             */
            source_name?: string | null;
            /**
             * @description Array of tags.
             * @example null
             */
            tags?: string[] | null;
            type: components["schemas"]["TransactionTypeProperty"];
        };
        TransactionSplitUpdate: {
            /**
             * Format: amount
             * @description Amount of the transaction.
             * @example 123.45
             */
            amount?: string;
            /**
             * Format: string
             * @description Optional. Use either this or the bill_name
             * @example 111
             */
            bill_id?: string | null;
            /**
             * Format: string
             * @description Optional. Use either this or the bill_id
             * @example Monthly rent
             */
            bill_name?: string | null;
            /** Format: date-time */
            book_date?: string | null;
            /**
             * Format: string
             * @description The budget ID for this transaction.
             * @example 4
             */
            budget_id?: string | null;
            /**
             * Format: string
             * @description The name of the budget to be used. If the budget name is unknown, the ID will be used or the value will be ignored.
             * @example Groceries
             */
            readonly budget_name?: string | null;
            /**
             * Format: string
             * @description The category ID for this transaction.
             * @example 43
             */
            category_id?: string | null;
            /**
             * Format: string
             * @description The name of the category to be used. If the category is unknown, it will be created. If the ID and the name point to different categories, the ID overrules the name.
             * @example Groceries
             */
            category_name?: string | null;
            /**
             * Format: string
             * @description Currency code. Default is the source account's currency, or the user's financial administration's primary currency. Can be used instead of currency_id.
             * @example EUR
             */
            currency_code?: string | null;
            /**
             * Format: int32
             * @description Number of decimals used in this currency.
             * @example 2
             */
            readonly currency_decimal_places?: number;
            /**
             * Format: string
             * @description Currency ID. Default is the source account's currency, or the user's financial administration's primary currency. Can be used instead of currency_code.
             * @example 12
             */
            currency_id?: string | null;
            /**
             * Format: string
             * @example Euro
             */
            readonly currency_name?: string;
            /**
             * Format: string
             * @example $
             */
            readonly currency_symbol?: string;
            /**
             * Format: date-time
             * @description Date of the transaction
             * @example 2026-03-01T00:00:00+00:00
             */
            date?: string;
            /**
             * Format: string
             * @description Description of the transaction.
             * @example Vegetables
             */
            description?: string;
            /**
             * Format: string
             * @example NL02ABNA0123456789
             */
            destination_iban?: string | null;
            /**
             * Format: string
             * @description ID of the destination account. For a deposit or a transfer, this must always be an asset account. For withdrawals this must be an expense account.
             * @example 2
             */
            destination_id?: string | null;
            /**
             * Format: string
             * @description Name of the destination account. You can submit the name instead of the ID. For everything except transfers, the account will be auto-generated if unknown, so submitting a name is enough.
             * @example Buy and Large
             */
            destination_name?: string | null;
            /** Format: date-time */
            due_date?: string | null;
            /**
             * Format: string
             * @description Reference to external ID in other systems.
             */
            external_id?: string | null;
            /**
             * Format: string
             * @description External, custom URL for this transaction.
             */
            external_url?: string | null;
            /**
             * Format: amount
             * @description The amount in a foreign currency.
             * @example 123.45
             */
            foreign_amount?: string | null;
            /**
             * Format: string
             * @description Currency code of the foreign currency. Default is NULL. Can be used instead of the foreign_currency_id, but this or the ID is required when submitting a foreign amount.
             * @example USD
             */
            foreign_currency_code?: string | null;
            /**
             * Format: int32
             * @description Number of decimals in the currency
             * @example 2
             */
            readonly foreign_currency_decimal_places?: number | null;
            /**
             * Format: string
             * @description Currency ID of the foreign currency. Default is null. Is required when you submit a foreign amount.
             * @example 17
             */
            foreign_currency_id?: string | null;
            /**
             * Format: string
             * @example $
             */
            readonly foreign_currency_symbol?: string | null;
            /** Format: date-time */
            interest_date?: string | null;
            /**
             * Format: string
             * @description Reference to internal reference of other systems.
             */
            internal_reference?: string | null;
            /** Format: date-time */
            invoice_date?: string | null;
            /**
             * Format: string
             * @example Some example notes
             */
            notes?: string | null;
            /**
             * Format: int32
             * @description Order of this entry in the list of transactions.
             * @example 0
             */
            order?: number | null;
            /** Format: date-time */
            payment_date?: string | null;
            /** Format: date-time */
            process_date?: string | null;
            /**
             * @description If the transaction has been reconciled already. When you set this, the amount can no longer be edited by the user.
             * @example false
             */
            reconciled?: boolean;
            /**
             * Format: string
             * @description SEPA Batch ID
             */
            sepa_batch_id?: string | null;
            /**
             * Format: string
             * @description SEPA Clearing Code
             */
            sepa_cc?: string | null;
            /**
             * Format: string
             * @description SEPA Creditor Identifier
             */
            sepa_ci?: string | null;
            /**
             * Format: string
             * @description SEPA Country
             */
            sepa_country?: string | null;
            /**
             * Format: string
             * @description SEPA end-to-end Identifier
             */
            sepa_ct_id?: string | null;
            /**
             * Format: string
             * @description SEPA Opposing Account Identifier
             */
            sepa_ct_op?: string | null;
            /**
             * Format: string
             * @description SEPA mandate identifier
             */
            sepa_db?: string | null;
            /**
             * Format: string
             * @description SEPA External Purpose indicator
             */
            sepa_ep?: string | null;
            /**
             * Format: string
             * @example NL02ABNA0123456789
             */
            source_iban?: string | null;
            /**
             * Format: string
             * @description ID of the source account. For a withdrawal or a transfer, this must always be an asset account. For deposits, this must be a revenue account.
             * @example 2
             */
            source_id?: string | null;
            /**
             * Format: string
             * @description Name of the source account. For a withdrawal or a transfer, this must always be an asset account. For deposits, this must be a revenue account. Can be used instead of the source_id. If the transaction is a deposit, the source_name can be filled in freely: the account will be created based on the name.
             * @example Checking account
             */
            source_name?: string | null;
            /**
             * @description Array of tags.
             * @example null
             */
            tags?: string[] | null;
            /**
             * Format: string
             * @description Transaction journal ID of current transaction (split).
             * @example 123
             */
            transaction_journal_id?: string;
            type?: components["schemas"]["TransactionTypeProperty"];
        };
        TransactionStore: {
            /**
             * @description Whether or not to apply rules when submitting transaction.
             * @example false
             */
            apply_rules?: boolean;
            /**
             * @description Break if the submitted transaction exists already.
             * @example false
             */
            error_if_duplicate_hash?: boolean;
            /**
             * @description Whether or not to fire the webhooks that are related to this event.
             * @default true
             * @example true
             */
            fire_webhooks: boolean;
            /**
             * Format: string
             * @description Title of the transaction if it has been split in more than one piece. Empty otherwise.
             * @example Split transaction title.
             */
            group_title?: string | null;
            transactions: components["schemas"]["TransactionSplitStore"][];
        };
        /** @enum {string} */
        TransactionTypeFilter: "all" | "withdrawal" | "withdrawals" | "expense" | "deposit" | "deposits" | "income" | "transfer" | "transfers" | "opening_balance" | "reconciliation" | "special" | "specials" | "default";
        /**
         * Format: string
         * @example withdrawal
         * @enum {string}
         */
        TransactionTypeProperty: "withdrawal" | "deposit" | "transfer" | "reconciliation" | "opening balance";
        TransactionUpdate: {
            /**
             * @description Whether or not to apply rules when submitting transaction.
             * @example false
             */
            apply_rules?: boolean;
            /**
             * @description Whether or not to fire the webhooks that are related to this event.
             * @default true
             * @example true
             */
            fire_webhooks: boolean;
            /**
             * Format: string
             * @description Title of the transaction if it has been split in more than one piece. Empty otherwise.
             * @example Split transaction title.
             */
            group_title?: string | null;
            transactions?: components["schemas"]["TransactionSplitUpdate"][];
        };
        UnauthenticatedResponse: {
            /**
             * Format: string
             * @example AuthenticationException
             */
            exception?: string;
            /**
             * Format: string
             * @example Unauthenticated
             */
            message?: string;
        };
        /** A single user */
        User: {
            /**
             * @description Boolean to indicate if the user is blocked.
             * @example false
             */
            blocked?: boolean;
            blocked_code?: components["schemas"]["UserBlockedCodeProperty"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: email
             * @description The new users email address.
             * @example james@firefly-iii.org
             */
            email: string;
            role?: components["schemas"]["UserRoleProperty"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        UserArray: {
            data: components["schemas"]["UserRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        /**
         * Format: string
         * @description If you say the user must be blocked, this will be the reason code.
         * @example email_changed
         * @enum {string|null}
         */
        UserBlockedCodeProperty: "email_changed" | null;
        UserGroupArray: {
            data: components["schemas"]["UserGroupRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        UserGroupRead: {
            attributes: components["schemas"]["UserGroupReadAttributes"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example user_groups
             */
            type: string;
        };
        UserGroupReadAttributes: {
            /**
             * @description Can the current user see the members of this user group?
             * @example true
             */
            readonly can_see_members?: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * @description Is this user group ('financial administration') currently the active administration?
             * @example false
             */
            readonly in_use?: boolean;
            members?: components["schemas"]["UserGroupReadMembers"][];
            /**
             * Format: string
             * @description Returns the primary currency code of the user group.
             * @example EUR
             */
            primary_currency_code?: string;
            /**
             * Format: int32
             * @description Returns the primary currency decimal places of the user group.
             * @example 2
             */
            readonly primary_currency_decimal_places?: number;
            /**
             * Format: string
             * @description Returns the primary currency ID of the user group.
             * @example 12
             */
            readonly primary_currency_id?: string;
            /**
             * Format: string
             * @description Returns the primary currency symbol of the user group.
             * @example $
             */
            readonly primary_currency_symbol?: string;
            /**
             * Format: string
             * @description Title of the user group. By default, it is the same as the user's email address.
             * @example demo@firefly
             */
            title?: string;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
        };
        UserGroupReadMembers: {
            roles?: components["schemas"]["UserGroupReadRole"][];
            /**
             * Format: email
             * @description The email address of the member
             * @example james@firefly-iii.org
             */
            readonly user_email?: string;
            /**
             * Format: string
             * @description The ID of the member.
             * @example 5
             */
            readonly user_id?: string;
            /**
             * @description Is this you? (the current user)
             * @example false
             */
            readonly you?: boolean;
        };
        /**
         * @description The possible roles of the user in this user group are documented here: https://docs.firefly-iii.org/references/firefly-iii/api/
         * @enum {string}
         */
        UserGroupReadRole: "ro" | "mng_trx" | "mng_meta" | "read_budgets" | "read_piggies" | "read_subscriptions" | "read_rules" | "read_recurring" | "read_webhooks" | "read_currencies" | "mng_budgets" | "mng_piggies" | "mng_subscriptions" | "mng_rules" | "mng_recurring" | "mng_webhooks" | "mng_currencies" | "view_reports" | "view_memberships" | "full" | "owner";
        UserGroupSingle: {
            data: components["schemas"]["UserGroupRead"];
        };
        UserGroupUpdate: {
            /**
             * Format: string
             * @description Use either primary_currency_id or primary_currency_code. This will set the primary currency for the user group ('financial administration').
             * @example EUR
             */
            primary_currency_code?: string;
            /**
             * Format: string
             * @description Use either primary_currency_id or primary_currency_code. This will set the primary currency for the user group ('financial administration').
             * @example 1
             */
            primary_currency_id?: string;
            /**
             * Format: string
             * @description A descriptive title for the user group.
             * @example New user group title
             */
            title: string;
        };
        UserRead: {
            attributes: components["schemas"]["User"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example users
             */
            type: string;
        };
        /**
         * Format: string
         * @description Role for the user. Can be empty or omitted.
         * @example owner
         * @enum {string|null}
         */
        UserRoleProperty: "owner" | "demo" | null;
        UserSingle: {
            data: components["schemas"]["UserRead"];
        };
        ValidationErrorResponse: {
            errors?: {
                blocked?: string[];
                blocked_code?: string[];
                date?: string[];
                email?: string[];
                end?: string[];
                field?: string[];
                force?: string[];
                iban?: string[];
                name?: string[];
                role?: string[];
                start?: string[];
                type?: string[];
            };
            /**
             * Format: string
             * @example The given data was invalid.
             */
            message?: string;
        };
        WebhookArray: {
            data: components["schemas"]["WebhookRead"][];
            links: components["schemas"]["PageLink"];
            meta: components["schemas"]["Meta"];
        };
        WebhookAttempt: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * Format: string
             * @description Internal log for this attempt. May contain sensitive user data.
             * @example Page not found
             */
            logs?: string | null;
            /**
             * Format: amount
             * @description Webhook receiver response for this attempt, if any. May contain sensitive user data.
             * @example Page not found
             */
            response?: string | null;
            /**
             * Format: int32
             * @description The HTTP status code of the error, if any.
             * @example 404
             */
            status_code?: number | null;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @description The ID of the webhook message this attempt belongs to.
             * @example 5
             */
            webhook_message_id?: string;
        };
        WebhookAttemptArray: {
            data: components["schemas"]["WebhookAttemptRead"][];
            meta: components["schemas"]["Meta"];
        };
        WebhookAttemptRead: {
            attributes: components["schemas"]["WebhookAttempt"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example webhook_attempts
             */
            type: string;
        };
        WebhookAttemptSingle: {
            data: components["schemas"]["WebhookAttemptRead"];
        };
        /**
         * Format: string
         * @description Format of the delivered response.
         * @example [
         *       "JSON"
         *     ]
         * @enum {string}
         */
        WebhookDelivery: "JSON";
        /**
         * @example [
         *       "JSON"
         *     ]
         */
        WebhookDeliveryArray: components["schemas"]["WebhookDelivery"][];
        WebhookMessage: {
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            /**
             * @description If this message has errored out.
             * @example false
             */
            errored?: boolean;
            /**
             * Format: string
             * @description The actual message that is sent or will be sent as JSON string.
             * @example {some:message}
             */
            message?: string | null;
            /**
             * @description If this message is sent yet.
             * @example false
             */
            sent?: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @description Long UUID string for identification of this webhook message.
             * @example 7a344c02-5b52-46b1-90e6-a437431dcf07
             */
            uuid?: string;
            /**
             * Format: string
             * @description The ID of the webhook this message belongs to.
             * @example 5
             */
            webhook_id?: string;
        };
        WebhookMessageArray: {
            data: components["schemas"]["WebhookMessageRead"][];
            meta: components["schemas"]["Meta"];
        };
        WebhookMessageRead: {
            attributes: components["schemas"]["WebhookMessage"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            /**
             * Format: string
             * @description Immutable value
             * @example webhook_messages
             */
            type: string;
        };
        WebhookMessageSingle: {
            data: components["schemas"]["WebhookMessageRead"];
        };
        /** A single webhook (read) */
        WebhookProperties: {
            /**
             * @description Boolean to indicate if the webhook is active
             * @example false
             */
            active?: boolean;
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly created_at?: string;
            deliveries?: components["schemas"]["WebhookDeliveryArray"];
            responses?: components["schemas"]["WebhookResponseArray"];
            /**
             * Format: string
             * @description A 24-character secret for the webhook. It's generated by Firefly III when saving a new webhook. If you submit a new secret through the PUT endpoint it will generate a new secret for the selected webhook, a new secret bearing no relation to whatever you just submitted.
             * @example iMLZLtLx2JHWhK9Dtyuoqyir
             */
            readonly secret?: string;
            /**
             * Format: string
             * @description A title for the webhook for easy recognition.
             * @example Update magic mirror on new transaction
             */
            title: string;
            triggers?: components["schemas"]["WebhookTriggerArray"];
            /**
             * Format: date-time
             * @example 2026-03-01T00:00:00+00:00
             */
            readonly updated_at?: string;
            /**
             * Format: string
             * @description The URL of the webhook. Has to start with `https`.
             * @example https://example.com
             */
            url: string;
        };
        WebhookRead: {
            attributes: components["schemas"]["WebhookProperties"];
            /**
             * Format: string
             * @example 2
             */
            id: string;
            links: components["schemas"]["ObjectLink"];
            /**
             * Format: string
             * @description Immutable value
             * @example webhooks
             */
            type: string;
        };
        /**
         * Format: string
         * @description Indicator for what Firefly III will deliver to the webhook URL.
         * @example RELEVANT
         * @enum {string}
         */
        WebhookResponse: "TRANSACTIONS" | "ACCOUNTS" | "BUDGET" | "RELEVANT" | "NONE";
        /**
         * @example [
         *       "TRANSACTIONS"
         *     ]
         */
        WebhookResponseArray: components["schemas"]["WebhookResponse"][];
        WebhookSingle: {
            data: components["schemas"]["WebhookRead"];
        };
        /** A single webhook (store) */
        WebhookStore: {
            /**
             * @description Boolean to indicate if the webhook is active
             * @example false
             */
            active?: boolean;
            deliveries?: components["schemas"]["WebhookDeliveryArray"];
            responses?: components["schemas"]["WebhookResponseArray"];
            /**
             * Format: string
             * @description A title for the webhook for easy recognition.
             * @example Update magic mirror on new transaction
             */
            title: string;
            triggers?: components["schemas"]["WebhookTriggerArray"];
            /**
             * Format: string
             * @description The URL of the webhook. Has to start with `https`.
             * @example https://example.com
             */
            url: string;
        };
        /**
         * Format: string
         * @description The trigger for the webhook.
         * @example DESTROY_TRANSACTION
         * @enum {string}
         */
        WebhookTrigger: "ANY" | "STORE_TRANSACTION" | "UPDATE_TRANSACTION" | "DESTROY_TRANSACTION" | "STORE_BUDGET" | "UPDATE_BUDGET" | "DESTROY_BUDGET" | "STORE_UPDATE_BUDGET_LIMIT";
        /**
         * @example [
         *       "STORE_TRANSACTION",
         *       "UPDATE_TRANSACTION"
         *     ]
         */
        WebhookTriggerArray: components["schemas"]["WebhookTrigger"][];
        /** A single webhook (update) */
        WebhookUpdate: {
            /**
             * @description Boolean to indicate if the webhook is active
             * @example false
             */
            active?: boolean;
            deliveries?: components["schemas"]["WebhookDeliveryArray"];
            responses?: components["schemas"]["WebhookResponseArray"];
            /**
             * Format: string
             * @description A 24-character secret for the webhook. It's generated by Firefly III when saving a new webhook. If you submit a new secret through the PUT endpoint it will generate a new secret for the selected webhook, a new secret bearing no relation to whatever you just submitted.
             * @example iMLZLtLx2JHWhK9Dtyuoqyir
             */
            secret?: string;
            /**
             * Format: string
             * @description A title for the webhook for easy recognition.
             * @example Update magic mirror on new transaction
             */
            title?: string;
            triggers?: components["schemas"]["WebhookTriggerArray"];
            /**
             * Format: string
             * @description The URL of the webhook. Has to start with `https`.
             * @example https://example.com
             */
            url?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    getAbout: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The available system information */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SystemInfo"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCurrentUser: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The user */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAccount: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. When added to the request, Firefly III will show the account's balance on that day. */
                date?: string;
                /** @description A date formatted YYYY-MM-DD. Must be after "start". Can not be the same as "start". May be omitted. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. May be omitted. */
                start?: string;
                /** @description Optional filter on the account type(s) returned */
                type?: components["schemas"]["AccountTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of accounts */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AccountArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeAccount: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array with the necessary account information or key=value pairs. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountStore"];
                "application/x-www-form-urlencoded": components["schemas"]["AccountStore"];
            };
        };
        responses: {
            /** @description New account stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AccountSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getAccount: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. When added to the request, Firefly III will show the account's balance on that day. */
                date?: string;
                /** @description A date formatted YYYY-MM-DD. Must be after "start". Can not be the same as "start". May be omitted. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD. May be omitted. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested account */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AccountSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateAccount: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or form-data with updated account information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["AccountUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["AccountUpdate"];
            };
        };
        responses: {
            /** @description Updated account stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AccountSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteAccount: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Account deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByAccount: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listPiggyBankByAccount: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy banks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByAccount: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned. */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachment: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeAttachment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary attachment information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttachmentStore"];
                "application/x-www-form-urlencoded": components["schemas"]["AttachmentStore"];
            };
        };
        responses: {
            /** @description New attachment stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getAttachment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the attachment. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested attachment */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateAttachment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the attachment. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated attachment information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttachmentUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["AttachmentUpdate"];
            };
        };
        responses: {
            /** @description Updated attachment stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteAttachment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the single attachment. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Attachment deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    downloadAttachment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the attachment. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested attachment */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    uploadAttachment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the attachment. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/octet-stream": string;
            };
        };
        responses: {
            /** @description Upload was a success */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getAccountsAC: {
        parameters: {
            query?: {
                /**
                 * @description If the account is an asset account or a liability, the autocomplete will also return the balance of the account on this date.
                 * @example 2026-03-01
                 */
                date?: string;
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
                /** @description Optional filter on the account type(s) used in the autocomplete. */
                types?: components["schemas"]["AccountTypeFilter"][];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of accounts with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteAccountArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getBillsAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of bills with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteBillArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getBudgetsAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budgets with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteBudgetArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCategoriesAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of categories with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteCategoryArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCurrenciesAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of currencies with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteCurrencyArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCurrenciesCodeAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of currencies with very basic information and the currency code between brackets. This endpoint is DEPRECATED and I suggest you DO NOT use it. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteCurrencyCodeArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getObjectGroupsAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of object groups with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteObjectGroupArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getPiggiesAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy banks with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompletePiggyArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getPiggiesBalanceAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy banks with very basic balance information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompletePiggyBalanceArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getRecurringAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of recurring transactions with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteRecurrenceArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getRuleGroupsAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rule groups with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteRuleGroupArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getRulesAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rules with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteRuleArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getSubscriptionsAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of subscriptions with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteBillArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTagAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of tags with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteTagArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTransactionTypesAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transaction types with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteTransactionTypeArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTransactionsAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transaction descriptions with very basic information. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteTransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTransactionsIDAC: {
        parameters: {
            query?: {
                /**
                 * @description The number of items returned.
                 * @example 10
                 */
                limit?: number;
                /**
                 * @description The autocomplete search query.
                 * @example string
                 */
                query?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions with very basic information. This endpoint is DEPRECATED and I suggest you DO NOT use it. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AutocompleteTransactionIDArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAvailableBudgets: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of available budget amounts. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AvailableBudgetArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getAvailableBudget: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the available budget. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested available budget */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AvailableBudgetSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    finishBatch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Empty response when the update was successful. A future improvement is to include the changed transactions. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBill: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. If it is added to the request, Firefly III will calculate the appropriate payment and paid dates. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. If it is are added to the request, Firefly III will calculate the appropriate payment and paid dates. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of bills */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BillArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeBill: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary bill information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["BillStore"];
                "application/x-www-form-urlencoded": components["schemas"]["BillStore"];
            };
        };
        responses: {
            /** @description New bill stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BillSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getBill: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. If it is added to the request, Firefly III will calculate the appropriate payment and paid dates. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD. If it is are added to the request, Firefly III will calculate the appropriate payment and paid dates. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the bill. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested bill */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BillSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateBill: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the bill. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with updated bill information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["BillUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["BillUpdate"];
            };
        };
        responses: {
            /** @description Updated bill stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BillSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteBill: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the bill. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Bill deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByBill: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the bill. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRuleByBill: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the bill. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rules */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByBill: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the bill. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBudgetLimit: {
        parameters: {
            query: {
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budget limits. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetLimitArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBudget: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD, to get info on how much the user has spent. You must submit both start and end. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD, to get info on how much the user has spent. You must submit both start and end. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budgets. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeBudget: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary budget information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetStore"];
                "application/x-www-form-urlencoded": components["schemas"]["BudgetStore"];
            };
        };
        responses: {
            /** @description New budget stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getBudget: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD, to get info on how much the user has spent. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD, to get info on how much the user has spent. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the requested budget. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested budget */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateBudget: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated budget information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["BudgetUpdate"];
            };
        };
        responses: {
            /** @description Updated budget stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteBudget: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Budget deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByBudget: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBudgetLimitByBudget: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the requested budget. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budget limits applicable to this budget. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetLimitArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeBudgetLimit: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary budget information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetLimitStore"];
                "application/x-www-form-urlencoded": components["schemas"]["BudgetLimitStore"];
            };
        };
        responses: {
            /** @description New budget limit stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetLimitSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getBudgetLimit: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. The budget limit MUST be associated to the budget ID. */
                id: string;
                /** @description The ID of the budget limit. The budget limit MUST be associated to the budget ID. */
                limitId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested budget limit */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetLimitSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateBudgetLimit: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. The budget limit MUST be associated to the budget ID. */
                id: string;
                /** @description The ID of the budget limit. The budget limit MUST be associated to the budget ID. */
                limitId: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated budget limit information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["BudgetLimitUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["BudgetLimitUpdate"];
            };
        };
        responses: {
            /** @description Updated budget limit stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetLimitSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteBudgetLimit: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. The budget limit MUST be associated to the budget ID. */
                id: string;
                /** @description The ID of the budget limit. The budget limit MUST be associated to the budget ID. */
                limitId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Budget limit deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByBudgetLimit: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description Optional filter on the transaction type(s) returned */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. The budget limit MUST be associated to the budget ID. */
                id: string;
                /** @description The ID of the budget limit. The budget limit MUST be associated to the budget ID. */
                limitId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByBudget: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the budget. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionWithoutBudget: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listCategory: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of categories. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CategoryArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeCategory: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary category information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryStore"];
                "application/x-www-form-urlencoded": components["schemas"]["CategoryStore"];
            };
        };
        responses: {
            /** @description New category stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CategorySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCategory: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD, to show spent and earned info. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD, to show spent and earned info. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the category. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested category */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CategorySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateCategory: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the category. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated category information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CategoryUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["CategoryUpdate"];
            };
        };
        responses: {
            /** @description Updated category stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CategorySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteCategory: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the category. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Category deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByCategory: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the category. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByCategory: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD, to limit the result list. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD, to limit the result list. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the category. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getChartAccountOverview: {
        parameters: {
            query: {
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /**
                 * @description Optional period to group the data by. If not provided, it will default to '1M' or whatever is deemed relevant for the range provided.
                 *
                 *     If you want to know which periods are available, see the enums or get the configuration value: `GET /api/v1/configuration/firefly.valid_view_ranges`
                 */
                period?: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
                /**
                 * @description Optional set of preselected accounts to limit the chart to. This may be easier than submitting all asset accounts manually, for example.
                 *     If you want to know which selection are available, see the enums here or get the configuration value: `GET /api/v1/configuration/firefly.preselected_accounts`
                 *
                 *     - `empty`: do not do a pre-selection
                 *     - `all`: select all asset and all liability accounts
                 *     - `assets`: select all asset accounts
                 *     - `liabilities`: select all liability accounts
                 *
                 *     If no accounts are found, the user's "frontpage accounts" preference will be used. If that is empty, all asset accounts will be used.
                 */
                preselected?: "empty" | "all" | "assets" | "liabilities";
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Line chart oriented chart information. Check out the model for more details. Each entry is a line (or bar) in the chart. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChartLine"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getChartBalance: {
        parameters: {
            query: {
                /**
                 * @description Limit the chart to these asset accounts or liabilities. Only asset accounts and liabilities will be accepted. Other types will be silently dropped.
                 *
                 *     This list of accounts will be OVERRULED by the `preselected` parameter.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /**
                 * @description Optional period to group the data by. If not provided, it will default to '1M' or whatever is deemed relevant for the range provided.
                 *
                 *     If you want to know which periods are available, see the enums or get the configuration value: `GET /api/v1/configuration/firefly.valid_view_ranges`
                 */
                period?: "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
                /**
                 * @description Optional set of preselected accounts to limit the chart to. This may be easier than submitting all asset accounts manually, for example.
                 *     If you want to know which selection are available, see the enums here or get the configuration value: `GET /api/v1/configuration/firefly.preselected_accounts`
                 *
                 *     - `empty`: do not do a pre-selection
                 *     - `all`: select all asset and all liability accounts
                 *     - `assets`: select all asset accounts
                 *     - `liabilities`: select all liability accounts
                 *
                 *     If no accounts are found, the user's "frontpage accounts" preference will be used. If that is empty, all asset accounts will be used.
                 */
                preselected?: "empty" | "all" | "assets" | "liabilities";
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Line chart oriented chart information. Check out the model for more details. Each entry is a line (or bar) in the chart. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChartLine"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getChartBudgetOverview: {
        parameters: {
            query: {
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Bar chart oriented chart information. Check out the model for more details. Each entry is a line (or bar) in the chart. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChartLine"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getChartCategoryOverview: {
        parameters: {
            query: {
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Line chart oriented chart information. Check out the model for more details. Each entry is a line (or bar) in the chart. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChartLine"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getConfiguration: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description System configuration values */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfigurationArray"];
                    "application/x-www-form-urlencoded": components["schemas"]["ConfigurationArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getSingleConfiguration: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The name of the configuration value you want to know. */
                name: components["schemas"]["ConfigValueFilter"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One system configuration value */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfigurationSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    setConfiguration: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The name of the configuration value you want to update. */
                name: components["schemas"]["ConfigValueUpdateFilter"];
            };
            cookie?: never;
        };
        /** @description JSON array with the necessary account information or key=value pairs. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConfigurationUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["ConfigurationUpdate"];
            };
        };
        responses: {
            /** @description New configuration value stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConfigurationSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCron: {
        parameters: {
            query?: {
                /**
                 * @description A date formatted YYYY-MM-DD. This can be used to make the cron job pretend it's running
                 *     on another day.
                 */
                date?: string;
                /**
                 * @description Forces the cron job to fire, regardless of whether it has fired before. This may result
                 *     in double transactions or weird budgets, so be careful.
                 */
                force?: boolean;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The CLI token of any user in Firefly III, required to run the cron job. */
                cliToken: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The result of the cron job(s) firing. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CronResult"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listCurrency: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of currencies. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary currency information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CurrencyStore"];
                "application/x-www-form-urlencoded": components["schemas"]["CurrencyStore"];
            };
        };
        responses: {
            /** @description New currency stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested currency */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated currency information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/vnd.api+json": components["schemas"]["CurrencyUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["CurrencyUpdate"];
            };
        };
        responses: {
            /** @description Updated currency stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAccountByCurrency: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. When added to the request, Firefly III will show the account's balance on that day. */
                date?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description Optional filter on the account type(s) returned */
                type?: components["schemas"]["AccountTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of accounts */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AccountArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAvailableBudgetByCurrency: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of available budgets */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AvailableBudgetArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBillByCurrency: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of bills. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BillArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBudgetLimitByCurrency: {
        parameters: {
            query?: {
                /** @description End date for the budget limit list. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description Start date for the budget limit list. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budget limits. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BudgetLimitArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    disableCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency was disabled. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Currency cannot be disabled, because it is still in use. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    enableCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency was enabled. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    primaryCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency has been made the primary currency. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRecurrenceByCurrency: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of recurring transactions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RecurrenceArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRuleByCurrency: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rules */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByCurrency: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD, to limit the list of transactions. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD, to limit the list of transactions. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code. */
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getPrimaryCurrency: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The primary currency */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CurrencySingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    bulkUpdateTransactions: {
        parameters: {
            query: {
                /** @description The JSON query. */
                query: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Empty response when the update was successful. A future improvement is to include the changed transactions. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    destroyData: {
        parameters: {
            query: {
                /** @description The type of data that you wish to destroy. You can only use one at a time. */
                objects: components["schemas"]["DataDestroyObject"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Empty response when data has been destroyed. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportAccounts: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportBills: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportBudgets: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportCategories: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportPiggies: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportRecurring: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportRules: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportTags: {
        parameters: {
            query?: {
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    exportTransactions: {
        parameters: {
            query: {
                /**
                 * @description Limit the export of transactions to these accounts only. Only asset accounts will be accepted. Other types will be silently dropped.
                 * @example 1,2,3
                 */
                accounts?: string;
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
                /** @description The file type the export file (CSV is currently the only option). */
                type?: components["schemas"]["ExportFileFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exported transaction in a file. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/octet-stream": string;
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    purgeData: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Empty response when data has been purged. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listCurrencyExchangeRates: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of all available currency exchange rates. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeCurrencyExchangeRate: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary exchange rate information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CurrencyExchangeRateStore"];
                "application/x-www-form-urlencoded": components["schemas"]["CurrencyExchangeRateStore"];
            };
        };
        responses: {
            /** @description New exchange stored, result in response. If a rate already exists for this currency pair and date, it will be updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listSpecificCurrencyExchangeRates: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code of the 'from' currency. */
                from: string;
                /** @description The currency code of the 'to' currency. */
                to: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of currency exchange rates. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteSpecificCurrencyExchangeRates: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code of the 'from' currency. */
                from: string;
                /** @description The currency code of the 'to' currency. */
                to: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency exchange rate(s) deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listSpecificCurrencyExchangeRateOnDate: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @example 2026-03-01 */
                date: string;
                /** @description The currency code of the 'from' currency. */
                from: string;
                /** @description The currency code of the 'to' currency. */
                to: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of currency exchange rates. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateCurrencyExchangeRateByDate: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @example 2026-03-01 */
                date: string;
                /** @description The currency code of the 'from' currency. */
                from: string;
                /** @description The currency code of the 'to' currency. */
                to: string;
            };
            cookie?: never;
        };
        /** @description JSON array or form-data with updated exchange rate information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CurrencyExchangeRateUpdateNoDate"];
                "application/x-www-form-urlencoded": components["schemas"]["CurrencyExchangeRateUpdate"];
            };
        };
        responses: {
            /** @description Updated exchange rate stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
        };
    };
    deleteSpecificCurrencyExchangeRateOnDate: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @example 2026-03-01 */
                date: string;
                /** @description The currency code of the 'from' currency. */
                from: string;
                /** @description The currency code of the 'to' currency. */
                to: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency exchange rate(s) deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listSpecificCurrencyExchangeRate: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the requested currency exchange rate. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The exchange rate requested. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateCurrencyExchangeRate: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the currency exchange rate. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or form-data with updated exchange rate information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CurrencyExchangeRateUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["CurrencyExchangeRateUpdate"];
            };
        };
        responses: {
            /** @description Updated exchange rate stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
        };
    };
    deleteSpecificCurrencyExchangeRate: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the requested currency exchange rate. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Currency exchange rate deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeCurrencyExchangeRatesByPair: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The currency code of the 'from' currency. */
                from: string;
                /** @description The currency code of the 'to' currency. */
                to: string;
            };
            cookie?: never;
        };
        /** @description JSON array with the necessary currency exchange rate information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CurrencyExchangeRateStoreByPair"];
            };
        };
        responses: {
            /** @description New exchange rates stored, result in response. If a rate already existed for any submitted entry, it will be updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeCurrencyExchangeRatesByDate: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @example 2026-03-01 */
                date: string;
            };
            cookie?: never;
        };
        /** @description JSON array with the necessary currency exchange rate information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["CurrencyExchangeRateStoreByDate"];
            };
        };
        responses: {
            /** @description New exchange rates stored, result in response. If a rate already existed for any submitted entry, it will be updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["CurrencyExchangeRateArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseAsset: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of asset accounts and expense details. Each asset account has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseBill: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description The bills to be included in the results. */
                "bills[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budget and expense details. Each budget has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseBudget: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description The budgets to be included in the results. */
                "budgets[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of budget and expense details. Each budget has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseCategory: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description The categories to be included in the results. */
                "categories[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of category and expense details. Each category has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseExpense: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you add the accounts ID's of expense accounts, only those accounts
                 *     are included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. You can combine both asset / liability and expense account ID's.
                 *     Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of expense accounts and expense details. Each expense account has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseNoBill: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of expense details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseNoBudget: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of expense details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseNoCategory: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of expense details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseNoTag: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of expense details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseTag: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
                /** @description The tags to be included in the results. */
                "tags[]"?: number[];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of tag and expense details. Each tag has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightExpenseTotal: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only withdrawals from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of sums in different currencies. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeAsset: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of asset accounts and income details. Each asset account has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeCategory: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description The categories to be included in the results. */
                "categories[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of category and income details. Each category has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeNoCategory: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of income details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeNoTag: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of income details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeRevenue: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you add the accounts ID's of revenue accounts, only those accounts
                 *     are included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. You can combine both asset / liability and deposit account ID's.
                 *     Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of revenue accounts and income details. Each revenue account has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeTag: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
                /** @description The tags to be included in the results. */
                "tags[]"?: number[];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of tag and income details. Each tag has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightIncomeTotal: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only deposits to those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of sums in different currencies. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightTransfers: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only transfers between those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of asset accounts and transfer details. Each asset account has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTransfer"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightTransferCategory: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only transfers between those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description The categories to be included in the results. */
                "categories[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of category and transfer details. Each category has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightTransferNoCategory: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only transfers between those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transfer details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightTransferNoTag: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only transfers from those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transfer details. One row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightTransferTag: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only transfers between those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
                /** @description The tags to be included in the results. */
                "tags[]"?: number[];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of tag and transfer details. Each tag has one row per currency. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightGroup"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    insightTransferTotal: {
        parameters: {
            query: {
                /**
                 * @description The accounts to be included in the results. If you include ID's of asset accounts or liabilities, only transfers between those
                 *     asset accounts / liabilities will be included. Other account ID's will be ignored.
                 */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of sums in different currencies. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InsightTotal"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listLinkType: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of link types. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["LinkTypeArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeLinkType: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array with the necessary link type information or key=value pairs. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["LinkType"];
                "application/x-www-form-urlencoded": components["schemas"]["LinkType"];
            };
        };
        responses: {
            /** @description New link type stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["LinkTypeSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getLinkType: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the link type. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested link type */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["LinkTypeSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateLinkType: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the link type. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or form-data with updated link type information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["LinkTypeUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["LinkTypeUpdate"];
            };
        };
        responses: {
            /** @description Updated link type stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["LinkTypeSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteLinkType: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the link type. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Link type deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByLinkType: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD, to limit the results. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD, to limit the results. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned. */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the link type. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listObjectGroups: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of object groups */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["ObjectGroupArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getObjectGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the object group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested object group */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["ObjectGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateObjectGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the object group */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated piggy bank information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ObjectGroupUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["ObjectGroupUpdate"];
            };
        };
        responses: {
            /** @description Updated object group stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["ObjectGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteObjectGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the object group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Object group deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listBillByObjectGroup: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of bills. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BillArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listPiggyBankByObjectGroup: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy banks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listPiggyBank: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy banks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storePiggyBank: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary piggy bank information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["PiggyBankStore"];
                "application/x-www-form-urlencoded": components["schemas"]["PiggyBankStore"];
            };
        };
        responses: {
            /** @description New piggy bank stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getPiggyBank: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the piggy bank. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested piggy bank */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updatePiggyBank: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the piggy bank */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated piggy bank information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["PiggyBankUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PiggyBankUpdate"];
            };
        };
        responses: {
            /** @description Updated piggy bank stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deletePiggyBank: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the piggy bank. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Piggy bank deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByPiggyBank: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the piggy bank. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listEventByPiggyBank: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the piggy bank */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy bank related events */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankEventArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listPreference: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of preferences. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PreferenceArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storePreference: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array with the necessary preference information or key=value pairs. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["Preference"];
                "application/x-www-form-urlencoded": components["schemas"]["Preference"];
            };
        };
        responses: {
            /** @description New account stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PreferenceSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getPreference: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The name of the preference. */
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A single preference. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PreferenceSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updatePreference: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The name of the preference. Will always overwrite. Will be created if it does not exist. */
                name: string;
            };
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary preference information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["PreferenceUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["PreferenceUpdate"];
            };
        };
        responses: {
            /** @description Updated preference. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PreferenceSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRecurrence: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of recurring transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RecurrenceArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeRecurrence: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary recurring transaction information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecurrenceStore"];
                "application/x-www-form-urlencoded": components["schemas"]["RecurrenceStore"];
            };
        };
        responses: {
            /** @description New recurring transaction stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RecurrenceSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getRecurrence: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the recurring transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested recurring transaction */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RecurrenceSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateRecurrence: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the recurring transaction. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated recurring transaction information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecurrenceUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["RecurrenceUpdate"];
            };
        };
        responses: {
            /** @description Updated recurring transaction stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RecurrenceSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteRecurrence: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the recurring transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Recurring transaction deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByRecurrence: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. Both the start and end date must be present. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. Both the start and end date must be present. */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the recurring transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    triggerRecurrenceRecurrence: {
        parameters: {
            query: {
                /** @description A date formatted YYYY-MM-DD. This is the date for which you want the recurrence to fire. You can take the date from the list of occurrences in the recurring transaction. */
                date: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the recurring transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions (always just 1) created by the recurrence, or a list of zero (0) when there is nothing to create for this date. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRuleGroup: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rule groups. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleGroupArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeRuleGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary rule group information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleGroupStore"];
                "application/x-www-form-urlencoded": components["schemas"]["RuleGroupStore"];
            };
        };
        responses: {
            /** @description New rule group stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getRuleGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested rule group */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateRuleGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule group. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated rule group information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleGroupUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["RuleGroupUpdate"];
            };
        };
        responses: {
            /** @description Updated rule group stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteRuleGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Rule group deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRuleByGroup: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rules. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    testRuleGroup: {
        parameters: {
            query?: {
                /** @description Limit the testing of the rule group to these asset accounts or liabilities. Only asset accounts and liabilities will be accepted. Other types will be silently dropped. */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the test will be applied to. Both the start date and the end date must be present. */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description Maximum number of transactions Firefly III will try. Don't set this too high, or it will take Firefly III very long to run the test. I suggest a max of 200. */
                search_limit?: number;
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the test will be applied to. Both the start date and the end date must be present. */
                start?: string;
                /** @description Maximum number of transactions the rule group can actually trigger on, before Firefly III stops. I would suggest setting this to 10 or 15. Don't go above the user's page size, because browsing to page 2 or 3 of a test result would fire the test again, making any navigation efforts very slow. */
                triggered_limit?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions that would be changed by any of the rules of the rule group. No changes will be made. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    fireRuleGroup: {
        parameters: {
            query?: {
                /** @description Limit the triggering of the rule group to these asset accounts or liabilities. Only asset accounts and liabilities will be accepted. Other types will be silently dropped. */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the actions will be applied to. Both the start date and the end date must be present. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the actions will be applied to. Both the start date and the end date must be present. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The rules in the group are executed. Due to the setup of this function (asynchronous job execution) the result cannot be displayed. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listRule: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of rules */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeRule: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary rule information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleStore"];
                "application/x-www-form-urlencoded": components["schemas"]["RuleStore"];
            };
        };
        responses: {
            /** @description New rule stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getRule: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the object. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested rule */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateRule: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the object. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated rule information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["RuleUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["RuleUpdate"];
            };
        };
        responses: {
            /** @description Updated rule stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["RuleSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteRule: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Rule deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    testRule: {
        parameters: {
            query?: {
                /** @description Limit the testing of the rule to these asset accounts or liabilities. Only asset accounts and liabilities will be accepted. Other types will be silently dropped. */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the test will be applied to. Both the start date and the end date must be present. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the test will be applied to. Both the start date and the end date must be present. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions that would be changed by the rule. No changes will be made. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    fireRule: {
        parameters: {
            query?: {
                /** @description Limit the triggering of the rule to these asset accounts or liabilities. Only asset accounts and liabilities will be accepted. Other types will be silently dropped. */
                "accounts[]"?: number[];
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the actions will be applied to. If the end date is not present, it will be set to today. If you use this field, both the start date and the end date must be present. */
                end?: string;
                /** @description A date formatted YYYY-MM-DD, to limit the transactions the actions will be applied to. If the start date is not present, it will be set to one year ago. If you use this field, both the start date and the end date must be present. */
                start?: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the rule. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The rules in the group are executed. Due to the setup of this function (asynchronous job execution) the result cannot be displayed. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    searchAccounts: {
        parameters: {
            query: {
                /** @description The account field(s) you want to search in. */
                field: components["schemas"]["AccountSearchFieldFilter"];
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description The query you wish to search for. */
                query: string;
                /** @description The type of accounts you wish to limit the search to. */
                type?: components["schemas"]["AccountTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of accounts. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AccountArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    searchTransactions: {
        parameters: {
            query: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description The query you wish to search for. */
                query: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getBasicSummary: {
        parameters: {
            query: {
                /** @description A currency code like EUR or USD, to filter the result. */
                currency_code?: string;
                /** @description A date formatted YYYY-MM-DD. */
                end: string;
                /** @description A date formatted YYYY-MM-DD. */
                start: string;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description An array of sums. It depends on the user what you can expect to get back, so please try this out on the demo site. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["BasicSummary"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTag: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of tags */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TagArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeTag: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary tag information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["TagModelStore"];
                "application/x-www-form-urlencoded": components["schemas"]["TagModelStore"];
            };
        };
        responses: {
            /** @description New tag stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TagSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTag: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description Either the tag itself or the tag ID. If you use the tag itself, and it contains international (non-ASCII) characters, your mileage may vary. */
                tag: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested tag */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TagSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateTag: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description Either the tag itself or the tag ID. If you use the tag itself, and it contains international (non-ASCII) characters, your mileage may vary. */
                tag: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated tag information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["TagModelUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["TagModelUpdate"];
            };
        };
        responses: {
            /** @description Updated tag stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TagSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteTag: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description Either the tag itself or the tag ID. If you use the tag itself, and it contains international (non-ASCII) characters, your mileage may vary. */
                tag: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tag deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByTag: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description Either the tag itself or the tag ID. */
                tag: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionByTag: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. This is the end date of the selected range (inclusive). */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. This is the start date of the selected range (inclusive). */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned. */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description Either the tag itself or the tag ID. */
                tag: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTransactionByJournal: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction journal (split). */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested transaction. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteTransactionJournal: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction journal (the split) you wish to delete. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Transaction journal (split) deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listLinksByJournal: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction journal / the split. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transaction links. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionLinkArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransactionLink: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transaction links */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionLinkArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeTransactionLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array with the necessary link type information or key=value pairs. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionLinkStore"];
                "application/x-www-form-urlencoded": components["schemas"]["TransactionLinkStore"];
            };
        };
        responses: {
            /** @description New transaction link stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionLinkSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTransactionLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction link. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested link */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionLinkSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateTransactionLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction link. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or form-data with updated link type information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionLinkUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["TransactionLinkUpdate"];
            };
        };
        responses: {
            /** @description Updated link type stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionLinkSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteTransactionLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction link. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Transaction link deleted */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listTransaction: {
        parameters: {
            query?: {
                /** @description A date formatted YYYY-MM-DD. This is the end date of the selected range (inclusive). */
                end?: string;
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
                /** @description A date formatted YYYY-MM-DD. This is the start date of the selected range (inclusive). */
                start?: string;
                /** @description Optional filter on the transaction type(s) returned. */
                type?: components["schemas"]["TransactionTypeFilter"];
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of transactions. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeTransaction: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary transaction information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionStore"];
                "application/x-www-form-urlencoded": components["schemas"]["TransactionStore"];
            };
        };
        responses: {
            /** @description New transaction stored(s), result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getTransaction: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested transaction. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateTransaction: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated transaction information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["TransactionUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["TransactionUpdate"];
            };
        };
        responses: {
            /** @description Updated transaction stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["TransactionSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteTransaction: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Transaction deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listAttachmentByTransaction: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of attachments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["AttachmentArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listEventByTransaction: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the transaction. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of piggy bank events. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["PiggyBankEventArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listUserGroups: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of user groups. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserGroupArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getUserGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the user group. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested user group */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateUserGroup: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The ID of the account. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array or form-data with new user group information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserGroupUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["UserGroupUpdate"];
            };
        };
        responses: {
            /** @description Updated user group is stored, result is in the response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserGroupSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listUser: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of users. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeUser: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary user information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["User"];
                "application/x-www-form-urlencoded": components["schemas"]["User"];
            };
        };
        responses: {
            /** @description New user stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The user ID. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested user. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateUser: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The user ID. */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated user information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["User"];
                "application/x-www-form-urlencoded": components["schemas"]["User"];
            };
        };
        responses: {
            /** @description Updated user stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["UserSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteUser: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The user ID. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description User deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    listWebhook: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of webhooks. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    storeWebhook: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description JSON array or key=value pairs with the necessary webhook information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebhookStore"];
                "application/x-www-form-urlencoded": components["schemas"]["WebhookStore"];
            };
        };
        responses: {
            /** @description New webhook stored, result in response. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getWebhook: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /**
                 * @description The webhook ID.
                 * @example 123
                 */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The requested webhook. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    updateWebhook: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /**
                 * @description The webhook ID.
                 * @example 123
                 */
                id: string;
            };
            cookie?: never;
        };
        /** @description JSON array with updated webhook information. See the model for the exact specifications. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["WebhookUpdate"];
                "application/x-www-form-urlencoded": components["schemas"]["WebhookUpdate"];
            };
        };
        responses: {
            /** @description Updated webhook stored, result in response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Validation error. The body will have the exact details. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationErrorResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteWebhook: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /**
                 * @description The webhook ID.
                 * @example 123
                 */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getWebhookMessages: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook ID. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of webhook messages. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookMessageArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getSingleWebhookMessage: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook ID. */
                id: string;
                /** @description The webhook message ID. */
                messageId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A single webhook message. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookMessageSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteWebhookMessage: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook ID. */
                id: string;
                /** @description The webhook message ID. */
                messageId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook message deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getWebhookMessageAttempts: {
        parameters: {
            query?: {
                /** @description Number of items per page. The default pagination is per 50 items. */
                limit?: number;
                /** @description Page number. The default pagination is per 50 items. */
                page?: number;
            };
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook ID. */
                id: string;
                /** @description The webhook message ID. */
                messageId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of webhook attempts. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookAttemptArray"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    getSingleWebhookMessageAttempt: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook attempt ID. */
                attemptId: number;
                /** @description The webhook ID. */
                id: string;
                /** @description The webhook message ID. */
                messageId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A single webhook attempt. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.api+json": components["schemas"]["WebhookAttemptSingle"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    deleteWebhookMessageAttempt: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook message attempt ID. */
                attemptId: number;
                /** @description The webhook ID. */
                id: string;
                /** @description The webhook message ID. */
                messageId: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook message attempt deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Unauthenticated */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnauthenticatedResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    submitWebhook: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook ID. */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description No messages to send, so did nothing. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
    triggerTransactionWebhook: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Unique identifier associated with this request.
                 * @example 40c71bbb-c676-4f24-83cf-cc725d7d7a00
                 */
                "X-Trace-Id"?: string;
            };
            path: {
                /** @description The webhook ID. */
                id: string;
                /** @description The transaction ID. */
                transactionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook triggered successfully. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BadRequestResponse"];
                };
            };
            /** @description Page not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotFoundResponse"];
                };
            };
            /** @description Internal exception */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InternalExceptionResponse"];
                };
            };
        };
    };
}
