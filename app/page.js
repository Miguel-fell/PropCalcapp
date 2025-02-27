"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  // State for form inputs
  const [loanAmount, setLoanAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(5);
  const [loanTerm, setLoanTerm] = useState(5);
  const [additionalPayment, setAdditionalPayment] = useState(0);
  
  // State for calculation results
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [payoffTime, setPayoffTime] = useState(0);
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [amortizationWithExtra, setAmortizationWithExtra] = useState([]);

  // Calculate loan details when inputs change
  useEffect(() => {
    if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
      calculateLoan();
    }
  }, [loanAmount, interestRate, loanTerm, additionalPayment]);

  const calculateLoan = () => {
    // Convert annual interest rate to monthly
    const monthlyRate = interestRate / 100 / 12;
    const termMonths = loanTerm * 12;
    
    // Calculate standard monthly payment (PMT formula)
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                   (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    setMonthlyPayment(payment || 0);
    
    // Generate amortization schedule without extra payments
    const standardSchedule = generateAmortizationSchedule(loanAmount, monthlyRate, termMonths, 0);
    setAmortizationSchedule(standardSchedule);
    setTotalPayment(standardSchedule.length > 0 ? standardSchedule[standardSchedule.length - 1].totalPaid : 0);
    setTotalInterest(standardSchedule.length > 0 ? standardSchedule[standardSchedule.length - 1].totalInterest : 0);
    
    // Generate amortization schedule with extra payments
    const extraSchedule = generateAmortizationSchedule(loanAmount, monthlyRate, termMonths, additionalPayment);
    setAmortizationWithExtra(extraSchedule);
    setPayoffTime(extraSchedule.length/12); // in years
  };

  const generateAmortizationSchedule = (principal, monthlyRate, termMonths, extraPayment) => {
    let balance = principal;
    let totalInterestPaid = 0;
    let totalPaid = 0;
    const schedule = [];
    
    // Calculate standard monthly payment
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    let month = 1;
    
    // Generate schedule until loan is paid off
    while (balance > 0 && month <= termMonths) {
      // Calculate interest for this month
      const interestPayment = balance * monthlyRate;
      
      // Calculate principal for this month
      let principalPayment = monthlyPayment - interestPayment;
      
      // Add extra payment
      principalPayment += extraPayment;
      
      // Adjust if we're paying more than remaining balance
      if (principalPayment > balance) {
        principalPayment = balance;
      }
      
      // Update balance
      balance -= principalPayment;
      
      // Update totals
      totalInterestPaid += interestPayment;
      totalPaid += (principalPayment + interestPayment);
      
      // Add to schedule
      schedule.push({
        month,
        payment: principalPayment + interestPayment,
        principalPayment,
        interestPayment,
        balance,
        totalInterest: totalInterestPaid,
        totalPaid,
      });
      
      // If balance is paid off, break
      if (balance <= 0) break;
      
      month++;
    }
    
    return schedule;
  };

  // Prepare chart data
  const chartData = {
    labels: Array.from({ length: Math.max(amortizationSchedule.length, amortizationWithExtra.length) }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Standard Payment',
        data: amortizationSchedule.map(item => item.balance),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'With Extra Payment',
        data: amortizationWithExtra.map(item => item.balance),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Loan Balance Over Time',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Remaining Balance ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Month',
        },
      },
    },
  };

  // Add this helper function for number formatting
  const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  // Update the input handlers to handle the "0" case
  const handleLoanAmountChange = (e) => {
    const value = e.target.value;
    setLoanAmount(value === '' ? 0 : Number(value));
  };

  const handleInterestRateChange = (e) => {
    const value = e.target.value;
    setInterestRate(value === '' ? 0 : Number(value));
  };

  const handleLoanTermChange = (e) => {
    const value = e.target.value;
    setLoanTerm(value === '' ? 0 : Number(value));
  };

  const handleAdditionalPaymentChange = (e) => {
    const value = e.target.value;
    setAdditionalPayment(value === '' ? 0 : Number(value));
  };

  // Replace the previous useEffect with this one
  useEffect(() => {
    // This function will be called after the component mounts (client-side only)
    const preventWheelChange = () => {
      const handleWheel = (e) => {
        // Prevent the default wheel behavior on number inputs
        e.preventDefault();
      };

      // Add the event listener to all number inputs
      const numberInputs = document.querySelectorAll('input[type="number"]');
      numberInputs.forEach(input => {
        input.addEventListener('wheel', handleWheel, { passive: false });
      });

      // Return cleanup function
      return () => {
        numberInputs.forEach(input => {
          input.removeEventListener('wheel', handleWheel);
        });
      };
    };

    // Only run this in the browser, not during server-side rendering
    const cleanup = typeof window !== 'undefined' ? preventWheelChange() : undefined;
    
    return cleanup;
  }, []); // Empty dependency array means this runs once after initial render

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Loan Payoff Calculator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Loan Details</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Loan Amount ($)</label>
              <input
                type="number"
                value={loanAmount === 0 ? '' : loanAmount}
                onChange={handleLoanAmountChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Annual Interest Rate (%)</label>
              <input
                type="number"
                value={interestRate === 0 ? '' : interestRate}
                onChange={handleInterestRateChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                step="0.1"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Loan Term (years)</label>
              <input
                type="number"
                value={loanTerm === 0 ? '' : loanTerm}
                onChange={handleLoanTermChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Additional Monthly Payment ($)</label>
              <input
                type="number"
                value={additionalPayment === 0 ? '' : additionalPayment}
                onChange={handleAdditionalPaymentChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Payment</p>
                <p className="text-xl font-bold">${formatCurrency(monthlyPayment)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Interest</p>
                <p className="text-xl font-bold">${formatCurrency(totalInterest)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Payment</p>
                <p className="text-xl font-bold">${formatCurrency(totalPayment)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payoff Time with Extra</p>
                <p className="text-xl font-bold">{payoffTime.toFixed(1)} years</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time Saved</p>
                <p className="text-xl font-bold">{(loanTerm - payoffTime).toFixed(1)} years</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Interest Saved</p>
                <p className="text-xl font-bold">
                  ${formatCurrency(totalInterest - (amortizationWithExtra.length > 0 ? 
                    amortizationWithExtra[amortizationWithExtra.length - 1].totalInterest : 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Loan Balance Over Time</h2>
          <div className="h-80">
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>
      </main>
    </div>
  );
}
