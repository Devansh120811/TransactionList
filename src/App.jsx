import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Income');
  const [editingId, setEditingId] = useState(null);
  const [balance, setBalance] = useState(0); // Account balance
  const [error, setError] = useState(''); // Error message

  // Fetch Transactions
  const fetchTransactions = async () => {
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    // Sort transactions by date in descending order (most recent first)
    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
  
    setTransactions(sortedData);
  
    // Calculate balance
    const totalBalance = sortedData.reduce((acc, transaction) => {
      return transaction.type === 'Income'
        ? acc + transaction.amount
        : acc - transaction.amount;
    }, 0);
    setBalance(totalBalance);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Add Transaction
  const addTransaction = async () => {
    if (!amount || !description) {
      setError('Amount and description are required!');
      return;
    }

    const parsedAmount = parseFloat(amount);

    // Validation for expense
    if ((type === 'Expense' && parsedAmount > balance) || (parsedAmount == 0)) {
      if(parsedAmount == 0)
        {
          setError("Cannot credit 0 amount")
        } 
        else{
          setError('Insufficient balance to update this expense!');
        }
      return;
    }
    const newTransaction = {
      amount: parsedAmount,
      description,
      type,
      date: new Date().toISOString(),
    };

    await addDoc(collection(db, 'transactions'), newTransaction);
    fetchTransactions();
    setAmount('');
    setDescription('');
    setType('Income');
    setError(''); // Clear error
  };

  // Update Transaction
  const updateTransaction = async id => {
    if (!amount || !description) {
      setError('Amount and description are required!');
      return;
    }

    const parsedAmount = parseFloat(amount);

    // Validation for expense update
    if ((type === 'Expense' && parsedAmount > balance) ||(type === 'Expense' && (parsedAmount == 0))  ) {
      if(parsedAmount == 0) setError("Cannot credit 0 amount")
       setError('Insufficient balance to update this expense!');
      return;
    }

    const updatedData = {
      amount: parsedAmount,
      description,
      type,
    };

    const transactionRef = doc(db, 'transactions', id);
    await updateDoc(transactionRef, updatedData);
    fetchTransactions();
    setEditingId(null);
    setAmount('');
    setDescription('');
    setType('Income');
    setError(''); // Clear error
  };

  // Delete Transaction
  const deleteTransaction = async id => {
    await deleteDoc(doc(db, 'transactions', id));
    fetchTransactions();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-6">Transaction Manager</h1>

      <div className="bg-white shadow-lg rounded-lg p-6 max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Balance: ${balance.toFixed(2)}</h2>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 font-medium">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          {editingId ? (
            <button
              onClick={() => updateTransaction(editingId)}
              className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Update
            </button>
          ) : (
            <button
              onClick={addTransaction}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          )}
        </div>

        <div className="space-y-4">
  {transactions.map(transaction => (
    <div
      key={transaction.id}
      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm"
    >
      <div>
        <p className="text-lg font-medium">
          ${transaction.amount} - {transaction.description}
        </p>
        <p
          className={`text-sm ${transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}
        >
          {transaction.type} - {new Date(transaction.date).toLocaleDateString()}{' '}
          {new Date(transaction.date).toLocaleTimeString()} {/* Timestamp */}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setEditingId(transaction.id);
            setAmount(transaction.amount);
            setDescription(transaction.description);
            setType(transaction.type);
          }}
          className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500"
        >
          Edit
        </button>
        <button
          onClick={() => deleteTransaction(transaction.id)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  ))}
</div>

      </div>
    </div>
  );
};

export default App;
