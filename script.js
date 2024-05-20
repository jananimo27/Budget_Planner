document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    const tabs = document.querySelectorAll('.tab-content');
    const modalForm = document.getElementById('modalForm');
    const dateForm = document.getElementById('dateForm');
    const earningsDiv = document.getElementById('earnings');
    const expensesDiv = document.getElementById('expenses');
    const overviewText = document.getElementById('overviewText');
    const recommendations = document.getElementById('recommendations');
    const statsChart = document.getElementById('statsChart');
    const dateSummaryDetails = document.getElementById('dateSummaryDetails');
    const selectedDate = document.getElementById('selectedDate');
    const dateEarnings = document.getElementById('dateEarnings');
    const dateExpenses = document.getElementById('dateExpenses');
    const dateNotes = document.getElementById('dateNotes');

    let earnings = 0;
    let expenses = 0;
    const transactions = [];

    const earningCategories = ['Allowance', 'Monthly Salary', 'Freelance', 'Investment', 'Other'];
    const expenseCategories = ['Transportation', 'Food', 'Utility Bills', 'Rent', 'Entertainment', 'Healthcare', 'Education', 'Other'];

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const target = event.target.getAttribute('data-target');
            setActiveTab(target);
        });
    });

    modalForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const note = document.getElementById('note').value;

        if (type === 'earning') {
            earnings += amount;
            earningsDiv.textContent = `Earnings: ₱${earnings.toFixed(2)}`;
        } else {
            expenses += amount;
            expensesDiv.textContent = `Expenses: ₱${expenses.toFixed(2)}`;
        }

        transactions.push({ type, category, amount, date, note });
        updateOverview();
        closeModal();
    });

    dateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const summaryDate = document.getElementById('summaryDate').value;
        viewDateSummary(summaryDate);
    });

    document.getElementById('type').addEventListener('change', (event) => {
        updateCategoryOptions(event.target.value);
    });

    function openModal(type) {
        updateCategoryOptions(type);
    }

    function updateCategoryOptions(type) {
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">Select category</option>';

        if (type === 'earning') {
            earningCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } else {
            expenseCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }

    function closeModal() {
        modalForm.reset();
    }

    function updateOverview() {
        const today = new Date().toISOString().split('T')[0];
        const dailyTransactions = transactions.filter(t => t.date === today);
        const dailyEarnings = dailyTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0);
        const dailyExpenses = dailyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        overviewText.textContent = `You've spent ₱${dailyExpenses.toFixed(2)} and you've earned ₱${dailyEarnings.toFixed(2)} on this day.`;
        recommendations.textContent = generateRecommendations(dailyExpenses, dailyEarnings);
    }

    function generateRecommendations(expenses, earnings) {
        if (expenses > earnings) {
            return "You're spending more than you're earning. Consider cutting down on unnecessary expenses.";
        } else if (earnings > expenses) {
            return "Great job! You're earning more than you're spending. Keep up the good work!";
        } else {
            return "Your spending and earnings are balanced. Try to save more for future needs.";
        }
    }

    function viewStatistics() {
        const categories = {};
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                if (!categories[transaction.category]) {
                    categories[transaction.category] = 0;
                }
                categories[transaction.category] += transaction.amount;
            }
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);

        if (window.myPieChart) {
            window.myPieChart.destroy();
        }

        const ctx = statsChart.getContext('2d');
        statsChart.classList.remove('hidden');
        window.myPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(231, 76, 60, 0.2)',
                        'rgba(52, 152, 219, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(52, 152, 219, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                }
            }
        });
    }

    function viewDateSummary(date) {
        const dateTransactions = transactions.filter(t => t.date === date);
        const dateEarningsAmount = dateTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0);
        const dateExpensesAmount = dateTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const dateNotesList = dateTransactions.map(t => t.note).filter(note => note).join(', ');

        selectedDate.textContent = date;
        dateEarnings.textContent = `Earnings: ₱${dateEarningsAmount.toFixed(2)}`;
        dateExpenses.textContent = `Expenses: ₱${dateExpensesAmount.toFixed(2)}`;
        dateNotes.textContent = `Notes: ${dateNotesList || 'None'}`;

        dateSummaryDetails.classList.remove('hidden');
    }

    function setActiveTab(target) {
        tabs.forEach(tab => {
            tab.classList.add('hidden');
            tab.classList.remove('active');
        });
        document.getElementById(target).classList.remove('hidden');
        document.getElementById(target).classList.add('active');

        if (target === 'summary') {
            viewStatistics();
        }
    }

    updateOverview();
});
