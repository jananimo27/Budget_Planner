document.addEventListener('DOMContentLoaded', () => {
    const auth = window.auth;
    const db = window.db;

    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    const tabs = document.querySelectorAll('.tab-content');
    const modalForm = document.getElementById('modalForm');
    const dateForm = document.getElementById('dateForm');
    const budgetForm = document.getElementById('budgetForm');
    const goalForm = document.getElementById('goalForm');
    const reportForm = document.getElementById('reportForm');
    const logoutButton = document.getElementById('logoutButton');
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
    const currentBudget = document.getElementById('currentBudget');
    const remainingBudget = document.getElementById('remainingBudget');
    const reportPeriod = document.getElementById('reportPeriod');
    const reportEarnings = document.getElementById('reportEarnings');
    const reportExpenses = document.getElementById('reportExpenses');
    const reportSummary = document.getElementById('reportSummary');
    const currentGoal = document.getElementById('currentGoal');
    const goalAmountDisplay = document.getElementById('goalAmountDisplay');
    const amountSaved = document.getElementById('amountSaved');

    const earningsTableBody = document.getElementById('earningsTableBody');
    const expensesTableBody = document.getElementById('expensesTableBody');

    let user = null;
    let earnings = 0;
    let expenses = 0;
    let monthlyBudget = 0;
    let goal = { name: '', amount: 0, saved: 0 };
    const transactions = [];

    const earningCategories = ['Allowance', 'Monthly Salary', 'Freelance', 'Investment', 'Other'];
    const expenseCategories = ['Transportation', 'Food', 'Utility Bills', 'Rent', 'Entertainment', 'Healthcare', 'Education', 'Other'];

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const target = event.currentTarget.getAttribute('data-target');
            setActiveTab(target);
        });
    });

    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const date = document.getElementById('date').value;
        const note = document.getElementById('note').value;

        if (user) {
            const transaction = { type, category, amount, date, note, userId: user.uid };
            await db.collection('transactions').add(transaction);

            if (type === 'earning') {
                earnings += amount;
                earningsDiv.textContent = `Earnings: ₱${earnings.toFixed(2)}`;
            } else {
                expenses += amount;
                expensesDiv.textContent = `Expenses: ₱${expenses.toFixed(2)}`;
                updateRemainingBudget();
            }

            transactions.push(transaction);
            updateOverview();
            closeModal();
        }
    });

    dateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const summaryDate = document.getElementById('summaryDate').value;
        await viewDateSummary(summaryDate);
    });

    budgetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        monthlyBudget = parseFloat(document.getElementById('monthlyBudget').value);
        await db.collection('budgets').doc(user.uid).set({ monthlyBudget });
        currentBudget.textContent = monthlyBudget.toFixed(2);
        updateRemainingBudget();
    });

    goalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        goal.name = document.getElementById('goalName').value;
        goal.amount = parseFloat(document.getElementById('goalAmount').value);
        await db.collection('goals').doc(user.uid).set(goal);
        displayGoal();
    });

    reportForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const reportType = document.getElementById('reportType').value;
        const reportDate = document.getElementById('reportDate').value;
        await generateReport(reportType, reportDate);
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout failed: ", error);
            alert("Logout failed: " + error.message);
        }
    });

    document.getElementById('type').addEventListener('change', (event) => {
        updateCategoryOptions(event.target.value);
    });

    auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser) {
            user = currentUser;
            await loadUserData();
            setActiveTab('overview');
        } else {
            user = null;
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
        }
    });

    async function loadUserData() {
        const transactionsSnapshot = await db.collection('transactions').where('userId', '==', user.uid).get();
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            transactions.push(transaction);
            if (transaction.type === 'earning') {
                earnings += transaction.amount;
            } else {
                expenses += transaction.amount;
            }
        });
        earningsDiv.textContent = `Earnings: ₱${earnings.toFixed(2)}`;
        expensesDiv.textContent = `Expenses: ₱${expenses.toFixed(2)}`;

        const budgetDoc = await db.collection('budgets').doc(user.uid).get();
        if (budgetDoc.exists) {
            monthlyBudget = budgetDoc.data().monthlyBudget;
            currentBudget.textContent = monthlyBudget.toFixed(2);
            updateRemainingBudget();
        }

        const goalDoc = await db.collection('goals').doc(user.uid).get();
        if (goalDoc.exists) {
            goal = goalDoc.data();
            displayGoal();
        }

        updateOverview();
    }

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
        const currentMonth = new Date().toISOString().split('T')[0].slice(0, 7);
        const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
        const monthlyEarnings = monthlyTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0);
        const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        const remainingBudget = monthlyBudget - monthlyExpenses;

        document.getElementById('monthlyEarnings').textContent = `Earnings: ₱${monthlyEarnings.toFixed(2)}`;
        document.getElementById('monthlyExpenses').textContent = `Expenses: ₱${monthlyExpenses.toFixed(2)}`;
        document.getElementById('monthlyBudgetComparison').textContent = `You have ₱${remainingBudget.toFixed(2)} left from your budget.`;

        document.getElementById('dailyEarnings').textContent = `Earnings: ₱${dailyEarnings.toFixed(2)}`;
        document.getElementById('dailyExpenses').textContent = `Expenses: ₱${dailyExpenses.toFixed(2)}`;

        if (goal.name) {
            document.getElementById('goalProgress').textContent = `You have saved ₱${goal.saved.toFixed(2)} towards your goal: "${goal.name}"`;
        } else {
            document.getElementById('goalProgress').textContent = 'No active goals.';
        }

        // Assuming upcoming bills are transactions with a future date
        const upcomingBills = transactions.filter(t => new Date(t.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
        const upcomingBillsList = document.getElementById('upcomingBills');
        upcomingBillsList.innerHTML = '';
        if (upcomingBills.length > 0) {
            upcomingBills.forEach(bill => {
                const li = document.createElement('li');
                li.textContent = `${bill.category}: ₱${bill.amount.toFixed(2)} on ${bill.date}`;
                upcomingBillsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No upcoming bills';
            upcomingBillsList.appendChild(li);
        }

        const topCategories = {};
        monthlyTransactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                if (!topCategories[transaction.category]) {
                    topCategories[transaction.category] = 0;
                }
                topCategories[transaction.category] += transaction.amount;
            }
        });

        const sortedCategories = Object.keys(topCategories).sort((a, b) => topCategories[b] - topCategories[a]);
        const topCategoriesList = document.getElementById('topCategories');
        topCategoriesList.innerHTML = '';
        if (sortedCategories.length > 0) {
            sortedCategories.slice(0, 3).forEach(category => {
                const li = document.createElement('li');
                li.textContent = `${category}: ₱${topCategories[category].toFixed(2)}`;
                topCategoriesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No spending data available';
            topCategoriesList.appendChild(li);
        }

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

    async function viewDateSummary(date) {
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

    function updateRemainingBudget() {
        const remaining = monthlyBudget - expenses;
        remainingBudget.textContent = remaining.toFixed(2);
    }

    function displayGoal() {
        currentGoal.textContent = goal.name;
        goalAmountDisplay.textContent = goal.amount.toFixed(2);
        amountSaved.textContent = goal.saved.toFixed(2);
    }

    async function generateReport(type, date) {
        const period = type === 'monthly' ? date.split('-').slice(0, 2).join('-') : date.split('-')[0];
        reportPeriod.textContent = period;

        const filteredTransactions = transactions.filter(transaction => {
            const transactionPeriod = type === 'monthly' ? transaction.date.split('-').slice(0, 2).join('-') : transaction.date.split('-')[0];
            return transactionPeriod === period;
        });

        const earningsAmount = filteredTransactions.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0);
        const expensesAmount = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        if (reportPeriod) {
            reportPeriod.textContent = period;
        }

        if (reportEarnings) {
            reportEarnings.textContent = `Earnings: ₱${earningsAmount.toFixed(2)}`;
        }

        if (reportExpenses) {
            reportExpenses.textContent = `Expenses: ₱${expensesAmount.toFixed(2)}`;
        }

        if (reportSummary) {
            reportSummary.textContent = generateRecommendations(expensesAmount, earningsAmount);
        }

        earningsTableBody.innerHTML = '';
        expensesTableBody.innerHTML = '';

        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.category}</td>
                <td>${transaction.date}</td>
                <td>₱${transaction.amount.toFixed(2)}</td>
                <td>${transaction.note || ''}</td>
            `;

            if (transaction.type === 'earning') {
                earningsTableBody.appendChild(row);
            } else {
                expensesTableBody.appendChild(row);
            }
        });

        document.getElementById('reportOutput').classList.remove('hidden');
    }

    updateOverview();
});
