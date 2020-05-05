import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: categoryRequested,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    let category = await categoriesRepository.findOne({
      title: categoryRequested,
    });

    // Create if category does not exists
    if (!category) {
      category = categoriesRepository.create({
        title: categoryRequested,
      });
      await categoriesRepository.save(category);
    }

    // Validate type
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Transaction Type invalid.');
    }

    // Check balance only if is an outcome transaction
    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();

      // Validate if has sufficient balance to proccess the transaction
      if (value > balance.total) {
        throw new AppError('Transaction unauthorized');
      }
    }
    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category,
    });
    return transactionsRepository.save(transaction);
  }
}

export default CreateTransactionService;
