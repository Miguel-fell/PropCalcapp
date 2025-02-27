"use client";

import { useState, useEffect, useRef } from "react";
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
  Filler,
} from "chart.js";
import { useTheme } from "next-themes";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Home() {
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Chart reference for responsiveness
  const chartRef = useRef(null);
  
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
  
  // State for table display
  const [showFullTable, setShowFullTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12; // Show 1 year at a time
  
  // Format numbers with commas and 2 decimal places
  const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };
  
  // Format input numbers with commas
  const formatInputValue = (value) => {
    if (value === 0 || value === '') return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Parse input values with commas
  const parseInputValue = (value) => {
    if (value === '') return 0;
    return Number(value.replace(/,/g, ''));
  };
  
  // Handle input changes
  const handleLoanAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      setLoanAmount(rawValue === '' ? 0 : Number(rawValue));
    }
  };
  
  const handleInterestRateChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInterestRate(value === '' ? 0 : Number(value));
    }
  };
  
  const handleLoanTermChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setLoanTerm(value === '' ? 0 : Number(value));
    }
  };
  
  const handleAdditionalPaymentChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      setAdditionalPayment(rawValue === '' ? 0 : Number(rawValue));
    }
  };
  
  // Prevent wheel events from changing input values
  useEffect(() => {
    const preventWheelChange = () => {
      const handleWheel = (e) => {
        if (document.activeElement.type === 'number' || 
            document.activeElement.type === 'text') {
          e.preventDefault();
        }
      };
      
      const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
      inputs.forEach(input => {
        input.addEventListener('wheel', handleWheel, { passive: false });
      });
      
      return () => {
        inputs.forEach(input => {
          input.removeEventListener('wheel', handleWheel);
        });
      };
    };
    
    if (typeof window !== 'undefined') {
      return preventWheelChange();
    }
  }, []);
  
  // Set mounted state after component mounts (for theme)
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
    setPayoffTime(extraSchedule.length / 12); // in years
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
  
  // Pagination for amortization table
  const totalPages = Math.ceil(amortizationWithExtra.length / rowsPerPage);
  const paginatedData = amortizationWithExtra.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Prepare chart data with improved styling
  const chartData = {
    labels: Array.from({ length: Math.max(amortizationSchedule.length, amortizationWithExtra.length) }, (_, i) => i + 1),
    datasets: [
      {
        label: 'Standard Payment',
        data: amortizationSchedule.map(item => item.balance),
        borderColor: theme === 'dark' ? 'rgba(96, 165, 250, 1)' : 'rgba(59, 130, 246, 1)',
        backgroundColor: theme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'With Extra Payment',
        data: amortizationWithExtra.map(item => item.balance),
        borderColor: theme === 'dark' ? 'rgba(248, 113, 113, 1)' : 'rgba(239, 68, 68, 1)',
        backgroundColor: theme === 'dark' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };
  
  // Enhanced chart options with better interactivity
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6,
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: theme === 'dark' ? '#e5e7eb' : '#111827',
        bodyColor: theme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: theme === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.2)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title: (tooltipItems) => {
            return `Month ${tooltipItems[0].label}`;
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${formatCurrency(value)}`;
          },
          footer: (tooltipItems) => {
            const dataIndex = parseInt(tooltipItems[0].label) - 1;
            if (dataIndex < 0) return '';
            
            const schedule = tooltipItems[0].datasetIndex === 0 ? 
              amortizationSchedule : amortizationWithExtra;
            
            if (dataIndex >= schedule.length) return '';
            
            const item = schedule[dataIndex];
            return [
              `Payment: $${formatCurrency(item.payment)}`,
              `Principal: $${formatCurrency(item.principalPayment)}`,
              `Interest: $${formatCurrency(item.interestPayment)}`
            ];
          }
        }
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Remaining Balance ($)',
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: theme === 'dark' ? '#d1d5db' : '#6b7280',
          callback: (value) => {
            return '$' + formatCurrency(value);
          }
        },
        grid: {
          color: theme === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.2)',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Month',
          color: theme === 'dark' ? '#e5e7eb' : '#374151',
        },
        ticks: {
          color: theme === 'dark' ? '#d1d5db' : '#6b7280',
          maxTicksLimit: 12,
          callback: (value, index) => {
            // Show year markers
            return index % 12 === 0 ? `Year ${Math.floor(index / 12) + 1}` : '';
          }
        },
        grid: {
          color: theme === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.2)',
        }
      },
    },
  };
  
  // Don't render with server-side rendering for theme
  if (!mounted) return null;
  
  return (
    <div className={`min-h-screen p-4 md:p-8 font-[family-name:var(--font-geist-sans)] ${theme === 'dark' ? 'dark' : ''}`}>
      <main className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center dark:text-white">Loan Payoff Calculator</h1>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Loan Details</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Loan Amount ($)</label>
              <input
                type="text"
                value={loanAmount === 0 ? '' : formatInputValue(loanAmount)}
                onChange={handleLoanAmountChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g. 250,000"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Annual Interest Rate (%)</label>
              <input
                type="text"
                value={interestRate === 0 ? '' : interestRate}
                onChange={handleInterestRateChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                step="0.1"
                placeholder="e.g. 5.25"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Loan Term (years)</label>
              <input
                type="text"
                value={loanTerm === 0 ? '' : loanTerm}
                onChange={handleLoanTermChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g. 30"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Additional Monthly Payment ($)</label>
              <input
                type="text"
                value={additionalPayment === 0 ? '' : formatInputValue(additionalPayment)}
                onChange={handleAdditionalPaymentChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g. 100"
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Payment Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Payment</p>
                <p className="text-xl font-bold dark:text-white">${formatCurrency(monthlyPayment)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Interest</p>
                <p className="text-xl font-bold dark:text-white">${formatCurrency(totalInterest)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Payment</p>
                <p className="text-xl font-bold dark:text-white">${formatCurrency(totalPayment)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payoff Time with Extra</p>
                <p className="text-xl font-bold dark:text-white">{payoffTime.toFixed(1)} years</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time Saved</p>
                <p className="text-xl font-bold dark:text-white">{(loanTerm - payoffTime).toFixed(1)} years</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Interest Saved</p>
                <p className="text-xl font-bold dark:text-white">
                  ${formatCurrency(totalInterest - (amortizationWithExtra.length > 0 ? 
                    amortizationWithExtra[amortizationWithExtra.length - 1].totalInterest : 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Loan Balance Over Time</h2>
          <div className="h-80">
            <Line ref={chartRef} options={chartOptions} data={chartData} />
          </div>
        </div>
        
        {/* Amortization Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">Amortization Schedule</h2>
            <button 
              onClick={() => setShowFullTable(!showFullTable)}
              className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {showFullTable ? "Show Less" : "Show Full Table"}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Principal</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interest</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(showFullTable ? amortizationWithExtra : paginatedData).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{item.month}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${formatCurrency(item.payment)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${formatCurrency(item.principalPayment)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${formatCurrency(item.interestPayment)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">${formatCurrency(item.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!showFullTable && totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
