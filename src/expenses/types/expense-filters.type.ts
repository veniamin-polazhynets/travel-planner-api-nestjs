import { QueryExpensesDto } from '../dto';

export type ExpenseFilters = Omit<QueryExpensesDto, 'page' | 'limit'>;
