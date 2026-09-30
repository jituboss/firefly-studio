/* eslint-disable */
// Generated from spec/firefly-iii-v1.yaml (v6.5.5).
// Run `pnpm spec:codegen` to regenerate. Do not edit. See scripts/spec-zod.ts.

import { z } from 'zod';

/** Laravel takes numbers as numbers or numeric strings. */
const num = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/, 'Expected a number')]);
/** …and booleans in any of the forms its `boolean` rule allows. */
const bool = z.union([z.boolean(), z.literal(0), z.literal(1), z.enum(['true', 'false', '0', '1'])]);
/** Ids are strings in the spec and numeric in Firefly's validators; both reach it. */
const id = z.union([z.string(), z.number().int()]);
/** Amounts are strings on the wire; a number is accepted and coerced by Firefly. */
const amount = z.union([z.string().regex(/^-?\d+(\.\d+)?$/, 'Expected an amount'), z.number()]);

const S: Record<string, z.ZodType> = {};
S.AccountRoleProperty = z.union([z.literal("defaultAsset"), z.literal("sharedAsset"), z.literal("savingAsset"), z.literal("ccAsset"), z.literal("cashWalletAsset"), z.literal(null)]).nullable();
S.AccountStore = z.looseObject({ "name": z.string(), "type": z.lazy(() => S.ShortAccountTypeProperty!), "iban": z.string().nullable().optional(), "bic": z.string().nullable().optional(), "account_number": z.string().nullable().optional(), "opening_balance": amount.optional(), "opening_balance_date": z.string().nullable().optional(), "virtual_balance": amount.optional(), "currency_id": id.optional(), "currency_code": z.string().optional(), "active": bool.optional(), "order": num.optional(), "include_net_worth": bool.optional(), "account_role": z.lazy(() => S.AccountRoleProperty!).optional(), "credit_card_type": z.lazy(() => S.CreditCardTypeProperty!).optional(), "monthly_payment_date": z.string().nullable().optional(), "liability_type": z.lazy(() => S.LiabilityTypeProperty!).optional(), "liability_direction": z.lazy(() => S.LiabilityDirectionProperty!).optional(), "interest": z.string().nullable().optional(), "interest_period": z.lazy(() => S.InterestPeriodProperty!).optional(), "notes": z.string().nullable().optional(), "latitude": num.nullable().optional(), "longitude": num.nullable().optional(), "zoom_level": num.nullable().optional() });
S.AccountUpdate = z.looseObject({ "name": z.string(), "iban": z.string().nullable().optional(), "bic": z.string().nullable().optional(), "account_number": z.string().nullable().optional(), "opening_balance": amount.optional(), "opening_balance_date": z.string().nullable().optional(), "virtual_balance": amount.optional(), "currency_id": id.optional(), "currency_code": z.string().optional(), "active": bool.optional(), "order": num.optional(), "include_net_worth": bool.optional(), "account_role": z.lazy(() => S.AccountRoleProperty!).optional(), "credit_card_type": z.lazy(() => S.CreditCardTypeProperty!).optional(), "monthly_payment_date": z.string().nullable().optional(), "liability_type": z.lazy(() => S.LiabilityTypeProperty!).optional(), "interest": z.string().nullable().optional(), "interest_period": z.lazy(() => S.InterestPeriodProperty!).optional(), "notes": z.string().nullable().optional(), "latitude": num.nullable().optional(), "longitude": num.nullable().optional(), "zoom_level": num.nullable().optional() });
S.AttachableType = z.enum(["Account", "Budget", "Bill", "TransactionJournal", "PiggyBank", "Tag"]);
S.AttachmentStore = z.looseObject({ "filename": z.string(), "attachable_type": z.lazy(() => S.AttachableType!), "attachable_id": id, "title": z.string().optional(), "notes": z.string().nullable().optional() });
S.AttachmentUpdate = z.looseObject({ "filename": z.string().optional(), "title": z.string().optional(), "notes": z.string().nullable().optional() });
S.AutoBudgetPeriod = z.union([z.literal("daily"), z.literal("weekly"), z.literal("monthly"), z.literal("quarterly"), z.literal("half-year"), z.literal("yearly"), z.literal(null)]).nullable();
S.AutoBudgetType = z.union([z.literal("reset"), z.literal("rollover"), z.literal("none"), z.literal(null)]).nullable();
S.BillRepeatFrequency = z.enum(["weekly", "monthly", "quarterly", "half-year", "yearly"]);
S.BillStore = z.looseObject({ "currency_id": id.optional(), "currency_code": z.string().optional(), "name": z.string(), "amount_min": amount, "amount_max": amount, "date": z.string(), "end_date": z.string().optional(), "extension_date": z.string().optional(), "repeat_freq": z.lazy(() => S.BillRepeatFrequency!), "skip": num.optional(), "active": bool.optional(), "notes": z.string().nullable().optional(), "object_group_id": id.nullable().optional(), "object_group_title": z.string().nullable().optional() });
S.BillUpdate = z.looseObject({ "currency_id": id.optional(), "currency_code": z.string().optional(), "name": z.string(), "amount_min": amount.optional(), "amount_max": amount.optional(), "date": z.string().optional(), "end_date": z.string().optional(), "extension_date": z.string().optional(), "repeat_freq": z.lazy(() => S.BillRepeatFrequency!).optional(), "skip": num.optional(), "active": bool.optional(), "notes": z.string().nullable().optional(), "object_group_id": id.nullable().optional(), "object_group_title": z.string().nullable().optional() });
S.BudgetLimitStore = z.looseObject({ "currency_id": id.optional(), "currency_code": z.string().optional(), "start": z.string(), "end": z.string(), "amount": amount, "notes": z.string().nullable().optional(), "fire_webhooks": bool.optional() });
S.BudgetLimitUpdate = z.looseObject({ "start": z.string().optional(), "end": z.string().optional(), "currency_id": id.optional(), "currency_name": z.string().optional(), "currency_code": z.string().optional(), "amount": amount.optional(), "notes": z.string().nullable().optional(), "fire_webhooks": bool.optional() });
S.BudgetStore = z.looseObject({ "name": z.string(), "active": bool.optional(), "notes": z.string().nullable().optional(), "fire_webhooks": bool.optional(), "auto_budget_type": z.lazy(() => S.AutoBudgetType!).optional(), "auto_budget_currency_id": id.nullable().optional(), "auto_budget_currency_code": z.string().nullable().optional(), "auto_budget_amount": amount.nullable().optional(), "auto_budget_period": z.lazy(() => S.AutoBudgetPeriod!).optional() });
S.BudgetUpdate = z.looseObject({ "name": z.string(), "active": bool.optional(), "order": num.optional(), "notes": z.string().nullable().optional(), "fire_webhooks": bool.optional(), "auto_budget_type": z.lazy(() => S.AutoBudgetType!).optional(), "auto_budget_currency_id": id.nullable().optional(), "auto_budget_currency_code": z.string().nullable().optional(), "auto_budget_amount": amount.nullable().optional(), "auto_budget_period": z.lazy(() => S.AutoBudgetPeriod!).optional() });
S.CategoryStore = z.looseObject({ "name": z.string(), "notes": z.string().nullable().optional() });
S.CategoryUpdate = z.looseObject({ "name": z.string(), "notes": z.string().nullable().optional() });
S.ConfigurationUpdate = z.looseObject({ "value": z.lazy(() => S.PolymorphicProperty!) });
S.CreditCardTypeProperty = z.union([z.literal("monthlyFull"), z.literal(null)]).nullable();
S.CurrencyExchangeRateStore = z.looseObject({ "date": z.string(), "from": z.string(), "to": z.string(), "rate": z.string().optional() });
S.CurrencyExchangeRateStoreByDate = z.looseObject({ "from": z.string(), "rates": z.record(z.string(), z.string()) });
S.CurrencyExchangeRateStoreByPair = z.record(z.string(), z.string());
S.CurrencyExchangeRateUpdate = z.looseObject({ "date": z.string(), "rate": z.string(), "from": z.string().nullable().optional(), "to": z.string().nullable().optional() });
S.CurrencyExchangeRateUpdateNoDate = z.looseObject({ "rate": z.string() });
S.CurrencyStore = z.looseObject({ "enabled": bool.optional(), "primary": bool.optional(), "code": z.string(), "name": z.string(), "symbol": z.string(), "decimal_places": num.optional() });
S.InterestPeriodProperty = z.union([z.literal("daily"), z.literal("weekly"), z.literal("monthly"), z.literal("quarterly"), z.literal("half-year"), z.literal("yearly"), z.literal(null)]).nullable();
S.LiabilityDirectionProperty = z.union([z.literal("credit"), z.literal("debit"), z.literal(null)]).nullable();
S.LiabilityTypeProperty = z.union([z.literal("loan"), z.literal("debt"), z.literal("mortgage"), z.literal(null)]).nullable();
S.LinkType = z.looseObject({ "name": z.string(), "inward": z.string(), "outward": z.string() });
S.LinkTypeUpdate = z.looseObject({ "name": z.string().optional(), "inward": z.string().optional(), "outward": z.string().optional() });
S.ObjectGroupUpdate = z.looseObject({ "title": z.string(), "order": num.optional() });
S.PiggyBankAccountStore = z.looseObject({ "id": z.string().nullable(), "name": z.string().nullable().optional(), "current_amount": amount.optional() });
S.PiggyBankAccountUpdate = z.looseObject({ "account_id": id.nullable().optional(), "name": z.string().nullable().optional(), "current_amount": amount.nullable().optional() });
S.PiggyBankStore = z.looseObject({ "name": z.string(), "accounts": z.array(z.lazy(() => S.PiggyBankAccountStore!)).optional(), "target_amount": amount.nullable(), "current_amount": amount.optional(), "start_date": z.string(), "target_date": z.string().nullable().optional(), "order": num.optional(), "notes": z.string().nullable().optional(), "object_group_id": id.nullable().optional(), "object_group_title": z.string().nullable().optional() });
S.PiggyBankUpdate = z.looseObject({ "name": z.string().optional(), "accounts": z.array(z.lazy(() => S.PiggyBankAccountUpdate!)).optional(), "target_amount": amount.nullable().optional(), "start_date": z.string().optional(), "target_date": z.string().nullable().optional(), "order": num.optional(), "notes": z.string().nullable().optional(), "object_group_id": id.nullable().optional(), "object_group_title": z.string().nullable().optional() });
S.PolymorphicProperty = z.union([bool, z.string(), z.record(z.string(), z.unknown()), z.array(z.lazy(() => S.StringArrayItem!))]);
S.Preference = z.looseObject({ "name": z.string(), "data": z.lazy(() => S.PolymorphicProperty!) });
S.PreferenceUpdate = z.looseObject({ "data": z.lazy(() => S.PolymorphicProperty!) });
S.RecurrenceRepetitionStore = z.looseObject({ "type": z.lazy(() => S.RecurrenceRepetitionType!), "moment": z.string(), "skip": num.optional(), "weekend": num.optional() });
S.RecurrenceRepetitionType = z.enum(["daily", "weekly", "ndom", "monthly", "yearly"]);
S.RecurrenceRepetitionUpdate = z.looseObject({ "type": z.lazy(() => S.RecurrenceRepetitionType!).optional(), "moment": z.string().optional(), "skip": num.optional(), "weekend": num.optional() });
S.RecurrenceStore = z.looseObject({ "type": z.lazy(() => S.RecurrenceTransactionType!), "title": z.string(), "description": z.string().optional(), "first_date": z.string(), "repeat_until": z.string().nullable(), "nr_of_repetitions": num.nullable().optional(), "apply_rules": bool.optional(), "active": bool.optional(), "notes": z.string().nullable().optional(), "repetitions": z.array(z.lazy(() => S.RecurrenceRepetitionStore!)), "transactions": z.array(z.lazy(() => S.RecurrenceTransactionStore!)) });
S.RecurrenceTransactionStore = z.looseObject({ "description": z.string(), "amount": amount, "foreign_amount": amount.nullable().optional(), "currency_id": id.optional(), "currency_code": z.string().optional(), "foreign_currency_id": id.nullable().optional(), "foreign_currency_code": z.string().nullable().optional(), "budget_id": id.optional(), "category_id": id.optional(), "source_id": id, "destination_id": id, "tags": z.array(z.string()).nullable().optional(), "piggy_bank_id": id.nullable().optional(), "bill_id": id.nullable().optional() });
S.RecurrenceTransactionType = z.enum(["withdrawal", "transfer", "deposit"]);
S.RecurrenceTransactionUpdate = z.looseObject({ "id": z.string(), "description": z.string().optional(), "amount": amount.optional(), "foreign_amount": amount.nullable().optional(), "currency_id": id.optional(), "currency_code": z.string().optional(), "foreign_currency_id": id.nullable().optional(), "budget_id": id.optional(), "category_id": id.optional(), "source_id": id.optional(), "destination_id": id.optional(), "tags": z.array(z.string()).nullable().optional(), "piggy_bank_id": id.nullable().optional(), "bill_id": id.nullable().optional() });
S.RecurrenceUpdate = z.looseObject({ "title": z.string().optional(), "description": z.string().optional(), "first_date": z.string().optional(), "repeat_until": z.string().nullable().optional(), "nr_of_repetitions": num.nullable().optional(), "apply_rules": bool.optional(), "active": bool.optional(), "notes": z.string().nullable().optional(), "repetitions": z.array(z.lazy(() => S.RecurrenceRepetitionUpdate!)).optional(), "transactions": z.array(z.lazy(() => S.RecurrenceTransactionUpdate!)).optional() });
S.RuleActionKeyword = z.enum(["user_action", "set_category", "clear_category", "set_budget", "clear_budget", "add_tag", "remove_tag", "remove_all_tags", "set_description", "append_description", "prepend_description", "set_source_account", "set_destination_account", "set_notes", "append_notes", "prepend_notes", "clear_notes", "link_to_bill", "convert_withdrawal", "convert_deposit", "convert_transfer", "delete_transaction"]);
S.RuleActionStore = z.looseObject({ "type": z.lazy(() => S.RuleActionKeyword!), "value": z.string().nullable(), "order": num.optional(), "active": bool.optional(), "stop_processing": bool.optional() });
S.RuleActionUpdate = z.looseObject({ "type": z.lazy(() => S.RuleActionKeyword!).optional(), "value": z.string().nullable().optional(), "order": num.optional(), "active": bool.optional(), "stop_processing": bool.optional() });
S.RuleGroupStore = z.looseObject({ "title": z.string(), "description": z.string().nullable().optional(), "order": num.optional(), "active": bool.optional() });
S.RuleGroupUpdate = z.looseObject({ "title": z.string().optional(), "description": z.string().nullable().optional(), "order": num.optional(), "active": bool.optional() });
S.RuleStore = z.looseObject({ "title": z.string(), "description": z.string().optional(), "rule_group_id": id, "rule_group_title": z.string().optional(), "order": num.optional(), "trigger": z.lazy(() => S.RuleTriggerType!), "active": bool.optional(), "strict": bool.optional(), "stop_processing": bool.optional(), "triggers": z.array(z.lazy(() => S.RuleTriggerStore!)), "actions": z.array(z.lazy(() => S.RuleActionStore!)) });
S.RuleTriggerKeyword = z.enum(["from_account_starts", "from_account_ends", "from_account_is", "from_account_contains", "to_account_starts", "to_account_ends", "to_account_is", "to_account_contains", "amount_less", "amount_exactly", "amount_more", "description_starts", "description_ends", "description_contains", "description_is", "transaction_type", "category_is", "budget_is", "tag_is", "currency_is", "has_attachments", "has_no_category", "has_any_category", "has_no_budget", "has_any_budget", "has_no_tag", "has_any_tag", "notes_contains", "notes_starts", "notes_end", "notes_are", "no_notes", "any_notes", "source_account_is", "destination_account_is", "source_account_starts"]);
S.RuleTriggerStore = z.looseObject({ "type": z.lazy(() => S.RuleTriggerKeyword!), "value": z.string(), "order": num.optional(), "active": bool.optional(), "prohibited": bool.optional(), "stop_processing": bool.optional() });
S.RuleTriggerType = z.enum(["store-journal", "update-journal", "manual-activation"]);
S.RuleTriggerUpdate = z.looseObject({ "type": z.lazy(() => S.RuleTriggerKeyword!).optional(), "value": z.string().optional(), "order": num.optional(), "active": bool.optional(), "stop_processing": bool.optional() });
S.RuleUpdate = z.looseObject({ "title": z.string().optional(), "description": z.string().optional(), "rule_group_id": id.optional(), "order": num.optional(), "trigger": z.lazy(() => S.RuleTriggerType!).optional(), "active": bool.optional(), "strict": bool.optional(), "stop_processing": bool.optional(), "triggers": z.array(z.lazy(() => S.RuleTriggerUpdate!)).optional(), "actions": z.array(z.lazy(() => S.RuleActionUpdate!)).optional() });
S.ShortAccountTypeProperty = z.enum(["asset", "expense", "import", "revenue", "cash", "liability", "liabilities", "initial-balance", "reconciliation"]);
S.StringArrayItem = z.string();
S.TagModelStore = z.looseObject({ "tag": z.string(), "date": z.string().nullable().optional(), "description": z.string().nullable().optional(), "latitude": num.nullable().optional(), "longitude": num.nullable().optional(), "zoom_level": num.nullable().optional() });
S.TagModelUpdate = z.looseObject({ "tag": z.string().optional(), "date": z.string().nullable().optional(), "description": z.string().nullable().optional(), "latitude": num.nullable().optional(), "longitude": num.nullable().optional(), "zoom_level": num.nullable().optional() });
S.TransactionLinkStore = z.looseObject({ "link_type_id": id, "link_type_name": z.string().optional(), "inward_id": id, "outward_id": id, "notes": z.string().nullable().optional() });
S.TransactionLinkUpdate = z.looseObject({ "link_type_id": id.optional(), "link_type_name": z.string().optional(), "inward_id": id.optional(), "outward_id": id.optional(), "notes": z.string().nullable().optional() });
S.TransactionSplitStore = z.looseObject({ "type": z.lazy(() => S.TransactionTypeProperty!), "date": z.string(), "amount": amount, "description": z.string(), "order": num.nullable().optional(), "currency_id": id.nullable().optional(), "currency_code": z.string().nullable().optional(), "foreign_amount": amount.nullable().optional(), "foreign_currency_id": id.nullable().optional(), "foreign_currency_code": z.string().nullable().optional(), "budget_id": id.nullable().optional(), "budget_name": z.string().nullable().optional(), "category_id": id.nullable().optional(), "category_name": z.string().nullable().optional(), "source_id": id.nullable().optional(), "source_name": z.string().nullable().optional(), "destination_id": id.nullable().optional(), "destination_name": z.string().nullable().optional(), "reconciled": bool.optional(), "piggy_bank_id": num.nullable().optional(), "piggy_bank_name": z.string().nullable().optional(), "bill_id": id.nullable().optional(), "bill_name": z.string().nullable().optional(), "tags": z.array(z.string()).nullable().optional(), "notes": z.string().nullable().optional(), "internal_reference": z.string().nullable().optional(), "external_id": id.nullable().optional(), "external_url": z.string().nullable().optional(), "sepa_cc": z.string().nullable().optional(), "sepa_ct_op": z.string().nullable().optional(), "sepa_ct_id": id.nullable().optional(), "sepa_db": z.string().nullable().optional(), "sepa_country": z.string().nullable().optional(), "sepa_ep": z.string().nullable().optional(), "sepa_ci": z.string().nullable().optional(), "sepa_batch_id": id.nullable().optional(), "interest_date": z.string().nullable().optional(), "book_date": z.string().nullable().optional(), "process_date": z.string().nullable().optional(), "due_date": z.string().nullable().optional(), "payment_date": z.string().nullable().optional(), "invoice_date": z.string().nullable().optional() });
S.TransactionSplitUpdate = z.looseObject({ "transaction_journal_id": id.optional(), "type": z.lazy(() => S.TransactionTypeProperty!).optional(), "date": z.string().optional(), "amount": amount.optional(), "description": z.string().optional(), "order": num.nullable().optional(), "currency_id": id.nullable().optional(), "currency_code": z.string().nullable().optional(), "foreign_amount": amount.nullable().optional(), "foreign_currency_id": id.nullable().optional(), "foreign_currency_code": z.string().nullable().optional(), "budget_id": id.nullable().optional(), "category_id": id.nullable().optional(), "category_name": z.string().nullable().optional(), "source_id": id.nullable().optional(), "source_name": z.string().nullable().optional(), "source_iban": z.string().nullable().optional(), "destination_id": id.nullable().optional(), "destination_name": z.string().nullable().optional(), "destination_iban": z.string().nullable().optional(), "reconciled": bool.optional(), "bill_id": id.nullable().optional(), "bill_name": z.string().nullable().optional(), "tags": z.array(z.string()).nullable().optional(), "notes": z.string().nullable().optional(), "internal_reference": z.string().nullable().optional(), "external_id": id.nullable().optional(), "external_url": z.string().nullable().optional(), "sepa_cc": z.string().nullable().optional(), "sepa_ct_op": z.string().nullable().optional(), "sepa_ct_id": id.nullable().optional(), "sepa_db": z.string().nullable().optional(), "sepa_country": z.string().nullable().optional(), "sepa_ep": z.string().nullable().optional(), "sepa_ci": z.string().nullable().optional(), "sepa_batch_id": id.nullable().optional(), "interest_date": z.string().nullable().optional(), "book_date": z.string().nullable().optional(), "process_date": z.string().nullable().optional(), "due_date": z.string().nullable().optional(), "payment_date": z.string().nullable().optional(), "invoice_date": z.string().nullable().optional() });
S.TransactionStore = z.looseObject({ "error_if_duplicate_hash": bool.optional(), "apply_rules": bool.optional(), "fire_webhooks": bool.optional(), "group_title": z.string().nullable().optional(), "transactions": z.array(z.lazy(() => S.TransactionSplitStore!)) });
S.TransactionTypeProperty = z.enum(["withdrawal", "deposit", "transfer", "reconciliation", "opening balance"]);
S.TransactionUpdate = z.looseObject({ "apply_rules": bool.optional(), "fire_webhooks": bool.optional(), "group_title": z.string().nullable().optional(), "transactions": z.array(z.lazy(() => S.TransactionSplitUpdate!)).optional() });
S.User = z.looseObject({ "email": z.string(), "blocked": bool.optional(), "blocked_code": z.lazy(() => S.UserBlockedCodeProperty!).optional(), "role": z.lazy(() => S.UserRoleProperty!).optional() });
S.UserBlockedCodeProperty = z.union([z.literal("email_changed"), z.literal(null)]).nullable();
S.UserGroupUpdate = z.looseObject({ "title": z.string(), "primary_currency_id": id.optional(), "primary_currency_code": z.string().optional() });
S.UserRoleProperty = z.union([z.literal("owner"), z.literal("demo"), z.literal(null)]).nullable();
S.WebhookDelivery = z.enum(["JSON"]);
S.WebhookDeliveryArray = z.array(z.lazy(() => S.WebhookDelivery!)).min(1).max(1);
S.WebhookResponse = z.enum(["TRANSACTIONS", "ACCOUNTS", "BUDGET", "RELEVANT", "NONE"]);
S.WebhookResponseArray = z.array(z.lazy(() => S.WebhookResponse!)).min(1).max(1);
S.WebhookStore = z.looseObject({ "active": bool.optional(), "title": z.string(), "triggers": z.lazy(() => S.WebhookTriggerArray!).optional(), "responses": z.lazy(() => S.WebhookResponseArray!).optional(), "deliveries": z.lazy(() => S.WebhookDeliveryArray!).optional(), "url": z.string() });
S.WebhookTrigger = z.enum(["ANY", "STORE_TRANSACTION", "UPDATE_TRANSACTION", "DESTROY_TRANSACTION", "STORE_BUDGET", "UPDATE_BUDGET", "DESTROY_BUDGET", "STORE_UPDATE_BUDGET_LIMIT"]);
S.WebhookTriggerArray = z.array(z.lazy(() => S.WebhookTrigger!)).min(1).max(3);
S.WebhookUpdate = z.looseObject({ "active": bool.optional(), "title": z.string().optional(), "secret": z.string().optional(), "triggers": z.lazy(() => S.WebhookTriggerArray!).optional(), "responses": z.lazy(() => S.WebhookResponseArray!).optional(), "deliveries": z.lazy(() => S.WebhookDeliveryArray!).optional(), "url": z.string().optional() });

export const REQUEST_SCHEMAS: Readonly<Record<string, z.ZodType>> = S;

export interface RequestBodyRule {
  readonly method: 'post' | 'put' | 'patch';
  readonly path: string;
  /** Anchored regex matching a concrete request path. */
  readonly pattern: string;
  /** Key into REQUEST_SCHEMAS. */
  readonly schema: string;
  readonly required: boolean;
}

export const REQUEST_BODIES: readonly RequestBodyRule[] = [
  { method: "post", path: "/v1/accounts", pattern: "^/v1/accounts$", schema: "AccountStore", required: true },
  { method: "put", path: "/v1/accounts/{id}", pattern: "^/v1/accounts/[^/]+$", schema: "AccountUpdate", required: true },
  { method: "post", path: "/v1/attachments", pattern: "^/v1/attachments$", schema: "AttachmentStore", required: true },
  { method: "put", path: "/v1/attachments/{id}", pattern: "^/v1/attachments/[^/]+$", schema: "AttachmentUpdate", required: true },
  { method: "post", path: "/v1/bills", pattern: "^/v1/bills$", schema: "BillStore", required: true },
  { method: "put", path: "/v1/bills/{id}", pattern: "^/v1/bills/[^/]+$", schema: "BillUpdate", required: true },
  { method: "post", path: "/v1/budgets", pattern: "^/v1/budgets$", schema: "BudgetStore", required: true },
  { method: "put", path: "/v1/budgets/{id}", pattern: "^/v1/budgets/[^/]+$", schema: "BudgetUpdate", required: true },
  { method: "post", path: "/v1/budgets/{id}/limits", pattern: "^/v1/budgets/[^/]+/limits$", schema: "BudgetLimitStore", required: true },
  { method: "put", path: "/v1/budgets/{id}/limits/{limitId}", pattern: "^/v1/budgets/[^/]+/limits/[^/]+$", schema: "BudgetLimitUpdate", required: true },
  { method: "post", path: "/v1/categories", pattern: "^/v1/categories$", schema: "CategoryStore", required: true },
  { method: "put", path: "/v1/categories/{id}", pattern: "^/v1/categories/[^/]+$", schema: "CategoryUpdate", required: true },
  { method: "put", path: "/v1/configuration/{name}", pattern: "^/v1/configuration/[^/]+$", schema: "ConfigurationUpdate", required: true },
  { method: "post", path: "/v1/currencies", pattern: "^/v1/currencies$", schema: "CurrencyStore", required: true },
  { method: "post", path: "/v1/exchange-rates", pattern: "^/v1/exchange-rates$", schema: "CurrencyExchangeRateStore", required: true },
  { method: "put", path: "/v1/exchange-rates/{from}/{to}/{date}", pattern: "^/v1/exchange-rates/[^/]+/[^/]+/[^/]+$", schema: "CurrencyExchangeRateUpdateNoDate", required: true },
  { method: "put", path: "/v1/exchange-rates/{id}", pattern: "^/v1/exchange-rates/[^/]+$", schema: "CurrencyExchangeRateUpdate", required: true },
  { method: "post", path: "/v1/exchange-rates/by-currencies/{from}/{to}", pattern: "^/v1/exchange-rates/by-currencies/[^/]+/[^/]+$", schema: "CurrencyExchangeRateStoreByPair", required: true },
  { method: "post", path: "/v1/exchange-rates/by-date/{date}", pattern: "^/v1/exchange-rates/by-date/[^/]+$", schema: "CurrencyExchangeRateStoreByDate", required: true },
  { method: "post", path: "/v1/link-types", pattern: "^/v1/link-types$", schema: "LinkType", required: true },
  { method: "put", path: "/v1/link-types/{id}", pattern: "^/v1/link-types/[^/]+$", schema: "LinkTypeUpdate", required: true },
  { method: "put", path: "/v1/object-groups/{id}", pattern: "^/v1/object-groups/[^/]+$", schema: "ObjectGroupUpdate", required: true },
  { method: "post", path: "/v1/piggy-banks", pattern: "^/v1/piggy-banks$", schema: "PiggyBankStore", required: true },
  { method: "put", path: "/v1/piggy-banks/{id}", pattern: "^/v1/piggy-banks/[^/]+$", schema: "PiggyBankUpdate", required: true },
  { method: "post", path: "/v1/preferences", pattern: "^/v1/preferences$", schema: "Preference", required: true },
  { method: "put", path: "/v1/preferences/{name}", pattern: "^/v1/preferences/[^/]+$", schema: "PreferenceUpdate", required: true },
  { method: "post", path: "/v1/recurrences", pattern: "^/v1/recurrences$", schema: "RecurrenceStore", required: true },
  { method: "put", path: "/v1/recurrences/{id}", pattern: "^/v1/recurrences/[^/]+$", schema: "RecurrenceUpdate", required: true },
  { method: "post", path: "/v1/rule-groups", pattern: "^/v1/rule-groups$", schema: "RuleGroupStore", required: true },
  { method: "put", path: "/v1/rule-groups/{id}", pattern: "^/v1/rule-groups/[^/]+$", schema: "RuleGroupUpdate", required: true },
  { method: "post", path: "/v1/rules", pattern: "^/v1/rules$", schema: "RuleStore", required: true },
  { method: "put", path: "/v1/rules/{id}", pattern: "^/v1/rules/[^/]+$", schema: "RuleUpdate", required: true },
  { method: "post", path: "/v1/tags", pattern: "^/v1/tags$", schema: "TagModelStore", required: true },
  { method: "put", path: "/v1/tags/{tag}", pattern: "^/v1/tags/[^/]+$", schema: "TagModelUpdate", required: true },
  { method: "post", path: "/v1/transaction-links", pattern: "^/v1/transaction-links$", schema: "TransactionLinkStore", required: true },
  { method: "put", path: "/v1/transaction-links/{id}", pattern: "^/v1/transaction-links/[^/]+$", schema: "TransactionLinkUpdate", required: true },
  { method: "post", path: "/v1/transactions", pattern: "^/v1/transactions$", schema: "TransactionStore", required: true },
  { method: "put", path: "/v1/transactions/{id}", pattern: "^/v1/transactions/[^/]+$", schema: "TransactionUpdate", required: true },
  { method: "put", path: "/v1/user-groups/{id}", pattern: "^/v1/user-groups/[^/]+$", schema: "UserGroupUpdate", required: true },
  { method: "post", path: "/v1/users", pattern: "^/v1/users$", schema: "User", required: true },
  { method: "put", path: "/v1/users/{id}", pattern: "^/v1/users/[^/]+$", schema: "User", required: true },
  { method: "post", path: "/v1/webhooks", pattern: "^/v1/webhooks$", schema: "WebhookStore", required: true },
  { method: "put", path: "/v1/webhooks/{id}", pattern: "^/v1/webhooks/[^/]+$", schema: "WebhookUpdate", required: true },
];
