/**
 * Kelola Keuangan Mandiri - Main Logic
 * Mata Kuliah: Pemrograman Web I - Universitas Pamulang
 */

// Storage Key (v2 untuk memastikan data awal bersih/kosong sesuai permintaan user)
const STORAGE_KEY = "kelola_keuangan_transaksi_v2";

// Kategori & Icon Mapping
const CATEGORIES = {
  expense: [
    { name: "Makanan & Minuman", icon: "fa-utensils" },
    { name: "Transportasi & Bensin", icon: "fa-gas-pump" },
    { name: "Belanja Harian", icon: "fa-cart-shopping" },
    { name: "Tagihan & Listrik", icon: "fa-receipt" },
    { name: "Hiburan & Liburan", icon: "fa-gamepad" },
    { name: "Pendidikan & Buku", icon: "fa-graduation-cap" },
    { name: "Kesehatan & Obat", icon: "fa-notes-medical" },
    { name: "Cicilan & Pinjaman", icon: "fa-credit-card" },
    { name: "Lainnya", icon: "fa-shapes" },
  ],
  income: [
    { name: "Gaji Bulanan", icon: "fa-money-bill-trend-up" },
    { name: "Bonus & THR", icon: "fa-award" },
    { name: "Hasil Usaha / Jualan", icon: "fa-store" },
    { name: "Proyek Freelance", icon: "fa-laptop-code" },
    { name: "Investasi & Dividen", icon: "fa-chart-line" },
    { name: "Uang Saku / Hadiah", icon: "fa-hand-holding-dollar" },
    { name: "Lainnya", icon: "fa-circle-dollar-to-slot" },
  ],
};

// State Data (Dibuat Kosong Total Secara Default)
let transactions = [];

// DOM Element References
const form = document.getElementById("transactionForm");
const txTypeRadios = document.querySelectorAll('input[name="txType"]');
const txTitleInput = document.getElementById("txTitle");
const txAmountInput = document.getElementById("txAmount");
const txCategorySelect = document.getElementById("txCategory");
const txDateInput = document.getElementById("txDate");
const txNotesInput = document.getElementById("txNotes");

const totalBalanceEl = document.getElementById("totalBalance");
const balanceStatusBadge = document.getElementById("balanceStatusBadge");
const balanceStatusText = document.getElementById("balanceStatusText");
const totalIncomeEl = document.getElementById("totalIncome");
const incomeCountEl = document.getElementById("incomeCount");
const totalExpenseEl = document.getElementById("totalExpense");
const expenseCountEl = document.getElementById("expenseCount");

// DOM References: Catatan & Batas Aman Bulanan
const budgetMonthSelect = document.getElementById("budgetMonthSelect");
const monthIncomeVal = document.getElementById("monthIncomeVal");
const monthIncomeCount = document.getElementById("monthIncomeCount");
const monthExpenseVal = document.getElementById("monthExpenseVal");
const monthExpenseCount = document.getElementById("monthExpenseCount");
const monthSafeLimitVal = document.getElementById("monthSafeLimitVal");
const monthSafeRemainingVal = document.getElementById("monthSafeRemainingVal");
const monthSafeRemainingHint = document.getElementById("monthSafeRemainingHint");
const budgetProgressLabel = document.getElementById("budgetProgressLabel");
const budgetCashflowRatio = document.getElementById("budgetCashflowRatio");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetAdviceBox = document.getElementById("budgetAdviceBox");
const adviceIcon = document.getElementById("adviceIcon");
const adviceTitle = document.getElementById("adviceTitle");
const adviceMessage = document.getElementById("adviceMessage");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const filterTypeSelect = document.getElementById("filterType");
const filterCategorySelect = document.getElementById("filterCategory");
const transactionListEl = document.getElementById("transactionList");
const emptyStateEl = document.getElementById("emptyState");
const filteredCountInfo = document.getElementById("filteredCountInfo");
const filteredNetTotal = document.getElementById("filteredNetTotal");

const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");
const toastEl = document.getElementById("toast");
const currentDateDisplay = document.getElementById("currentDateDisplay");

// ==========================================
// Inisialisasi Aplikasi Saat DOM Siap
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  displayCurrentDate();
  txDateInput.value = getTodayDateString();
  
  // Bersihkan cache lama jika ada
  if (localStorage.getItem("kelola_keuangan_transaksi_v1")) {
    localStorage.removeItem("kelola_keuangan_transaksi_v1");
  }

  loadTransactions();
  updateCategoryDropdown("expense");
  updateFilterCategoryDropdown();
  renderApp();
  setupEventListeners();
});

// Format Tanggal Hari Ini (YYYY-MM-DD)
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Menampilkan Tanggal Bahasa Indonesia di Header
function displayCurrentDate() {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const todayStr = new Intl.DateTimeFormat("id-ID", options).format(new Date());
  if (currentDateDisplay) {
    currentDateDisplay.textContent = todayStr;
  }
}

// ==========================================
// Penyimpanan Data (LocalStorage)
// ==========================================
function loadTransactions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      transactions = JSON.parse(stored);
    } else {
      // Default benar-benar kosong sesuai permintaan user
      transactions = [];
      saveTransactions();
    }
  } catch (error) {
    console.error("Gagal membaca LocalStorage:", error);
    transactions = [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Gagal menyimpan ke LocalStorage:", error);
    showToast("Gagal menyimpan data ke peramban!", "error");
  }
}

// ==========================================
// Kategori Dropdown Handler
// ==========================================
function updateCategoryDropdown(type) {
  const list = CATEGORIES[type] || [];
  txCategorySelect.innerHTML = list
    .map((cat) => `<option value="${cat.name}">${cat.name}</option>`)
    .join("");
}

function updateFilterCategoryDropdown() {
  const allCategories = new Set();
  CATEGORIES.expense.forEach((c) => allCategories.add(c.name));
  CATEGORIES.income.forEach((c) => allCategories.add(c.name));

  const sorted = Array.from(allCategories).sort();
  filterCategorySelect.innerHTML =
    '<option value="all">Semua Kategori</option>' +
    sorted.map((name) => `<option value="${name}">${name}</option>`).join("");
}

// ==========================================
// Perhitungan Ringkasan & Rasio Arus Kas
// ==========================================
function updateSummary() {
  let incomeTotal = 0;
  let incomeCount = 0;
  let expenseTotal = 0;
  let expenseCount = 0;

  transactions.forEach((tx) => {
    const val = Number(tx.amount) || 0;
    if (tx.type === "income") {
      incomeTotal += val;
      incomeCount++;
    } else if (tx.type === "expense") {
      expenseTotal += val;
      expenseCount++;
    }
  });

  const netBalance = incomeTotal - expenseTotal;

  // Update Teks Ringkasan
  totalBalanceEl.textContent = formatRupiah(netBalance);
  totalIncomeEl.textContent = formatRupiah(incomeTotal);
  incomeCountEl.textContent = `${incomeCount} Transaksi`;
  totalExpenseEl.textContent = formatRupiah(expenseTotal);
  expenseCountEl.textContent = `${expenseCount} Transaksi`;

  // Status Badge & Text
  if (transactions.length === 0) {
    balanceStatusBadge.textContent = "Siap Catat";
    balanceStatusBadge.className = "badge-pill badge-neutral";
    balanceStatusText.textContent = "Mulai tambahkan catatan pemasukan & pengeluaran Anda.";
    totalBalanceEl.style.color = "#ffffff";
  } else if (netBalance > 0) {
    balanceStatusBadge.textContent = "Surplus / Hemat";
    balanceStatusBadge.className = "badge-pill badge-success";
    balanceStatusText.textContent = "Arus kas positif! Keuangan Anda saat ini terkontrol dengan baik.";
    totalBalanceEl.style.color = "#34d399";
  } else if (netBalance < 0) {
    balanceStatusBadge.textContent = "Defisit / Perhatian";
    balanceStatusBadge.className = "badge-pill badge-danger";
    balanceStatusText.textContent = "Pengeluaran lebih besar dari pemasukan. Pertimbangkan untuk berhemat.";
    totalBalanceEl.style.color = "#f87171";
  } else {
    balanceStatusBadge.textContent = "Seimbang (Rp 0)";
    balanceStatusBadge.className = "badge-pill badge-neutral";
    balanceStatusText.textContent = "Pemasukan dan pengeluaran sama besar.";
    totalBalanceEl.style.color = "#ffffff";
  }

}

// ==========================================
// Logika Catatan & Batas Aman Bulanan (Anti-Boros)
// ==========================================

// Mengambil Key Bulan Saat Ini (Format: YYYY-MM)
function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Format Label Bulan Bahasa Indonesia (contoh: "November 2026")
function formatMonthLabel(yearMonthStr) {
  if (!yearMonthStr) return "-";
  const [year, month] = yearMonthStr.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(dateObj);
}

// Mengisi Dropdown Pemilih Bulan
function populateMonthSelector() {
  if (!budgetMonthSelect) return;

  const currentMonthKey = getCurrentMonthKey();
  const monthSet = new Set();
  monthSet.add(currentMonthKey);

  transactions.forEach((tx) => {
    if (tx.date && tx.date.length >= 7) {
      monthSet.add(tx.date.substring(0, 7));
    }
  });

  const sortedMonths = Array.from(monthSet).sort().reverse();
  const previousSelection = budgetMonthSelect.value || currentMonthKey;

  budgetMonthSelect.innerHTML = sortedMonths
    .map((mKey) => {
      const isCurrent = mKey === currentMonthKey;
      const label = `${formatMonthLabel(mKey)}${isCurrent ? " (Bulan Ini)" : ""}`;
      return `<option value="${mKey}">${label}</option>`;
    })
    .join("");

  if (sortedMonths.includes(previousSelection)) {
    budgetMonthSelect.value = previousSelection;
  } else {
    budgetMonthSelect.value = currentMonthKey;
  }
}

// Memperbarui Laporan Bulanan & Batas Pengeluaran Aman
function updateMonthlyBudgetGuide(customMonth) {
  const selectedMonth = customMonth || (budgetMonthSelect ? budgetMonthSelect.value : getCurrentMonthKey());

  // Saring transaksi pada bulan yang dipilih
  const monthlyTx = transactions.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));

  let monthIncome = 0;
  let monthIncomeCountNum = 0;
  let monthExpense = 0;
  let monthExpenseCountNum = 0;

  monthlyTx.forEach((tx) => {
    const val = Number(tx.amount) || 0;
    if (tx.type === "income") {
      monthIncome += val;
      monthIncomeCountNum++;
    } else if (tx.type === "expense") {
      monthExpense += val;
      monthExpenseCountNum++;
    }
  });

  // Aturan Finansial Sehat: Batas aman pengeluaran maksimal 70% dari pemasukan bulanan
  // (30% idealnya disisihkan untuk tabungan & investasi)
  const safeLimit = Math.round(monthIncome * 0.70);
  const safeRemaining = safeLimit - monthExpense;

  // Update Nilai di DOM
  if (monthIncomeVal) monthIncomeVal.textContent = formatRupiah(monthIncome);
  if (monthIncomeCount) monthIncomeCount.textContent = `${monthIncomeCountNum} Transaksi`;

  if (monthExpenseVal) monthExpenseVal.textContent = formatRupiah(monthExpense);
  if (monthExpenseCount) monthExpenseCount.textContent = `${monthExpenseCountNum} Transaksi`;

  if (monthSafeLimitVal) monthSafeLimitVal.textContent = formatRupiah(safeLimit);

  if (monthSafeRemainingVal && monthSafeRemainingHint) {
    if (monthIncome === 0 && monthExpense === 0) {
      monthSafeRemainingVal.textContent = "Rp 0";
      monthSafeRemainingVal.style.color = "var(--text-muted)";
      monthSafeRemainingHint.textContent = "Menunggu pemasukan tercatat";
    } else if (safeRemaining >= 0) {
      monthSafeRemainingVal.textContent = formatRupiah(safeRemaining);
      monthSafeRemainingVal.style.color = "var(--income-600)";
      monthSafeRemainingHint.textContent = "Sisa kuota aman bisa dibelanjakan 👍";
    } else {
      monthSafeRemainingVal.textContent = `- ${formatRupiah(Math.abs(safeRemaining))}`;
      monthSafeRemainingVal.style.color = "var(--expense-600)";
      monthSafeRemainingHint.textContent = "Melebihi batas aman belanja! ⚠️";
    }
  }

  // Rasio Pengeluaran terhadap Pemasukan (Presisi desimal agar tidak 0% saat nominal kecil)
  let cashflowRatio = 0;
  let ratioFormatted = "0";
  if (monthIncome > 0) {
    cashflowRatio = (monthExpense / monthIncome) * 100;
    // Tampilkan 1 desimal jika di bawah 10% dan tidak bulat (misal: 0.4% atau 2.5%)
    ratioFormatted = cashflowRatio < 10 && cashflowRatio % 1 !== 0
      ? cashflowRatio.toFixed(1)
      : Math.round(cashflowRatio).toString();
  }

  if (budgetCashflowRatio) {
    if (monthIncome === 0 && monthExpense > 0) {
      budgetCashflowRatio.textContent = `Pengeluaran ${formatRupiah(monthExpense)} (Belum ada pemasukan bulan ini)`;
    } else if (monthIncome === 0 && monthExpense === 0) {
      budgetCashflowRatio.textContent = "Rasio Pengeluaran: 0% dari Pemasukan";
    } else {
      budgetCashflowRatio.textContent = `Rasio Pengeluaran: ${ratioFormatted}% dari total pemasukan (${formatRupiah(monthExpense)} / ${formatRupiah(monthIncome)})`;
    }
  }

  // Persentase Pemakaian Batas Aman (70%)
  let safePercentUsed = 0;
  if (safeLimit > 0) {
    safePercentUsed = (monthExpense / safeLimit) * 100;
  } else if (monthExpense > 0) {
    safePercentUsed = 100;
  }

  const safePercentFormatted = safePercentUsed < 10 && safePercentUsed % 1 !== 0
    ? safePercentUsed.toFixed(1)
    : Math.round(safePercentUsed).toString();

  if (budgetProgressLabel) {
    budgetProgressLabel.textContent = `Pemakaian Batas Aman: ${safePercentFormatted}% (${formatRupiah(monthExpense)} / ${formatRupiah(safeLimit)})`;
  }

  // Progress Bar Width & Color
  if (budgetProgressBar) {
    // Beri minimal 3% lebar agar bar selalu terlihat aktif jika ada pengeluaran
    let barWidth = 0;
    if (monthExpense > 0) {
      barWidth = Math.max(3, Math.min(100, Math.round(safePercentUsed)));
    }
    budgetProgressBar.style.width = `${barWidth}%`;

    if (safePercentUsed <= 60) {
      budgetProgressBar.style.background = "linear-gradient(90deg, #10b981, #059669)";
    } else if (safePercentUsed <= 85) {
      budgetProgressBar.style.background = "linear-gradient(90deg, #f59e0b, #d97706)";
    } else {
      budgetProgressBar.style.background = "linear-gradient(90deg, #ef4444, #dc2626)";
    }
  }

  // Nasihat Finansial Anti-Boros
  updateAdviceBox(monthIncome, monthExpense, safeLimit, safeRemaining, safePercentUsed, ratioFormatted);
}

// Helper Nasihat Keuangan Cerdas Anti-Boros
function updateAdviceBox(income, expense, safeLimit, safeRemaining, safePercentUsed, ratioFormatted) {
  if (!budgetAdviceBox || !adviceIcon || !adviceTitle || !adviceMessage) return;

  if (income === 0 && expense === 0) {
    budgetAdviceBox.className = "advice-box advice-neutral";
    adviceIcon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    adviceTitle.textContent = "Status Keuangan: Menunggu Catatan Bulan Ini";
    adviceMessage.textContent = "Catat pemasukan (gaji, usaha, atau uang saku) untuk mengaktifkan batas aman pengeluaran otomatis.";
  } else if (income === 0 && expense > 0) {
    budgetAdviceBox.className = "advice-box advice-danger";
    adviceIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    adviceTitle.textContent = "Perhatian: Pengeluaran Tanpa Pemasukan Tercatat";
    adviceMessage.textContent = `Anda telah mengeluarkan ${formatRupiah(expense)} di bulan ini, namun belum mencatat pemasukan. Segera masukkan catatan pemasukan Anda agar batas belanja aman dapat dihitung.`;
  } else if (safePercentUsed <= 40) {
    budgetAdviceBox.className = "advice-box advice-safe";
    adviceIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    adviceTitle.textContent = "Status: Sangat Hemat & Aman (Arus Kas Prima) 🌟";
    adviceMessage.textContent = `Luar biasa! Pengeluaran baru ${ratioFormatted}% dari pemasukan (${safePercentUsed < 1 ? safePercentUsed.toFixed(1) : Math.round(safePercentUsed)}% dari kuota aman). Anda masih memiliki sisa kuota aman sebesar ${formatRupiah(safeRemaining)} untuk kebutuhan harian.`;
  } else if (safePercentUsed <= 75) {
    budgetAdviceBox.className = "advice-box advice-safe";
    adviceIcon.innerHTML = '<i class="fa-solid fa-thumbs-up"></i>';
    adviceTitle.textContent = "Status: Pengeluaran Wajar & Terkendali 👍";
    adviceMessage.textContent = `Pengeluaran Anda terkontrol dengan baik di angka ${ratioFormatted}% pemasukan. Sisa kuota belanja aman bulan ini adalah ${formatRupiah(safeRemaining)}. Pertahankan pola ini hingga akhir bulan.`;
  } else if (safePercentUsed <= 99) {
    budgetAdviceBox.className = "advice-box advice-caution";
    adviceIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    adviceTitle.textContent = "Status Waspada: Kuota Belanja Aman Hampir Habis! ⚠️";
    adviceMessage.textContent = `Pengeluaran sudah mencapai ${Math.round(safePercentUsed)}% dari batas aman 70%. Kuota belanja aman tersisa ${formatRupiah(safeRemaining)}. Disarankan untuk menunda belanja non-pokok (*wants*) agar tidak boros.`;
  } else {
    budgetAdviceBox.className = "advice-box advice-danger";
    adviceIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
    adviceTitle.textContent = "Peringatan Boros: Melebihi Batas Aman Belanja! 🚨";
    adviceMessage.textContent = `Pengeluaran bulan ini sudah ${ratioFormatted}% dari pemasukan (melampaui batas aman 70% sebesar ${formatRupiah(Math.abs(safeRemaining))}). Segera rem pengeluaran agar pos tabungan (30%) dan dana darurat tidak tergerus!`;
  }
}

// ==========================================
// Render Riwayat Transaksi
// ==========================================
function renderTransactions() {
  const filterType = filterTypeSelect.value;
  const filterCat = filterCategorySelect.value;
  const searchTerm = searchInput.value.trim().toLowerCase();

  // Filter Data
  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCat !== "all" && tx.category !== filterCat) return false;
    if (searchTerm) {
      const matchTitle = (tx.title || "").toLowerCase().includes(searchTerm);
      const matchNotes = (tx.notes || "").toLowerCase().includes(searchTerm);
      const matchCat = (tx.category || "").toLowerCase().includes(searchTerm);
      if (!matchTitle && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  // Urutkan dari tanggal terbaru
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Tampilkan Empty State jika tidak ada data
  if (filtered.length === 0) {
    transactionListEl.innerHTML = "";
    emptyStateEl.style.display = "flex";

    if (transactions.length === 0) {
      emptyStateEl.querySelector("h4").textContent = "Belum Ada Transaksi";
      emptyStateEl.querySelector("p").textContent =
        "Daftar keuangan Anda saat ini masih kosong. Silakan gunakan formulir di samping untuk mulai mencatat transaksi pertama Anda!";
    } else {
      emptyStateEl.querySelector("h4").textContent = "Tidak Ditemukan";
      emptyStateEl.querySelector("p").textContent =
        "Tidak ada transaksi yang sesuai dengan kata kunci pencarian atau filter yang Anda pilih.";
    }
  } else {
    emptyStateEl.style.display = "none";
    transactionListEl.innerHTML = filtered
      .map((tx) => {
        const isIncome = tx.type === "income";
        const iconClass = getCategoryIcon(tx.type, tx.category);
        const sign = isIncome ? "+" : "-";
        const formattedAmount = `${sign} ${formatRupiah(tx.amount)}`;

        return `
          <div class="tx-card ${tx.type}" data-id="${tx.id}">
            <div class="tx-main-info">
              <div class="tx-icon-box">
                <i class="fa-solid ${iconClass}"></i>
              </div>
              <div class="tx-texts">
                <div class="tx-top-line">
                  <h4 class="tx-title">${escapeHtml(tx.title)}</h4>
                  <span class="tx-tag">${escapeHtml(tx.category)}</span>
                </div>
                <div class="tx-bottom-line">
                  <span class="tx-date"><i class="fa-regular fa-calendar-check"></i> ${formatDateIndo(tx.date)}</span>
                  ${
                    tx.notes
                      ? `<span class="tx-notes-text"><i class="fa-regular fa-comment-dots"></i> ${escapeHtml(tx.notes)}</span>`
                      : ""
                  }
                </div>
              </div>
            </div>
            <div class="tx-amount-col">
              <span class="tx-price">${formattedAmount}</span>
              <button type="button" class="btn-delete" data-id="${tx.id}" title="Hapus catatan transaksi">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Ringkasan Footer Hasil Filter
  let filteredSum = 0;
  filtered.forEach((tx) => {
    if (tx.type === "income") filteredSum += Number(tx.amount) || 0;
    else filteredSum -= Number(tx.amount) || 0;
  });

  filteredCountInfo.textContent = `${filtered.length} dari total ${transactions.length} transaksi`;
  filteredNetTotal.textContent = `${filteredSum >= 0 ? "+" : ""}${formatRupiah(filteredSum)}`;
  filteredNetTotal.style.color = filteredSum >= 0 ? "#10b981" : "#ef4444";
}

// Icon Finder Helper
function getCategoryIcon(type, categoryName) {
  const catList = CATEGORIES[type] || [];
  const found = catList.find((c) => c.name === categoryName);
  if (found) return found.icon;
  return type === "income" ? "fa-arrow-up" : "fa-arrow-down";
}

// Format Rupiah
function formatRupiah(number) {
  const num = Number(number) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Format Angka dengan Titik Pemisah Ribuan (contoh: 50.000)
function formatNumberWithDots(value) {
  if (value === null || value === undefined || value === "") return "";
  const cleanStr = value.toString().replace(/\D/g, "");
  if (!cleanStr) return "";
  return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format Tanggal Indonesia (contoh: 2 Nov 2026)
function formatDateIndo(dateStr) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dateObj);
}

// Escape HTML untuk proteksi XSS
function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Render Aplikasi Menyeluruh
function renderApp() {
  populateMonthSelector();
  updateSummary();
  updateMonthlyBudgetGuide();
  renderTransactions();
}

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
  // Pemilih Periode Bulan pada Catatan & Batas Aman
  if (budgetMonthSelect) {
    budgetMonthSelect.addEventListener("change", (e) => {
      updateMonthlyBudgetGuide(e.target.value);
    });
  }

  // Switcher Tipe Transaksi (Pengeluaran vs Pemasukan)
  txTypeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      updateCategoryDropdown(e.target.value);
    });
  });

  // Format otomatis titik ribuan saat user mengetik nominal
  txAmountInput.addEventListener("input", (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    e.target.value = raw ? formatNumberWithDots(raw) : "";
  });

  // Tombol Tambah Cepat Nominal (+10rb, +50rb, dll)
  const chipButtons = document.querySelectorAll(".chip-btn");
  chipButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const addVal = Number(btn.getAttribute("data-add")) || 0;
      const currentRaw = txAmountInput.value.replace(/\D/g, "");
      const currentVal = Number(currentRaw) || 0;
      const nextVal = currentVal + addVal;
      txAmountInput.value = formatNumberWithDots(nextVal);
      txAmountInput.focus();
    });
  });

  // Submit Form Tambah Transaksi
  form.addEventListener("submit", handleAddTransaction);

  // Search input live
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      clearSearchBtn.style.display = "block";
    } else {
      clearSearchBtn.style.display = "none";
    }
    renderTransactions();
  });

  // Tombol bersihkan pencarian
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    renderTransactions();
    searchInput.focus();
  });

  // Filter dropdowns
  filterTypeSelect.addEventListener("change", renderTransactions);
  filterCategorySelect.addEventListener("change", renderTransactions);

  // Event Delegation untuk Tombol Hapus
  transactionListEl.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest(".btn-delete");
    if (!deleteBtn) return;
    const id = deleteBtn.getAttribute("data-id");
    handleDeleteTransaction(id);
  });

  // Ekspor CSV
  exportBtn.addEventListener("click", exportTransactionsToCSV);

  // Reset Semua Data
  resetBtn.addEventListener("click", handleResetData);
}

// Handler Tambah Transaksi
function handleAddTransaction(e) {
  e.preventDefault();

  const title = txTitleInput.value.trim();
  const rawAmount = txAmountInput.value.replace(/\D/g, "");
  const amount = parseFloat(rawAmount);
  const type = document.querySelector('input[name="txType"]:checked').value;
  const category = txCategorySelect.value;
  const date = txDateInput.value;
  const notes = txNotesInput.value.trim();

  // Validasi Input
  if (!title) {
    showToast("Harap isi judul transaksi!", "error");
    txTitleInput.focus();
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showToast("Nominal transaksi harus lebih besar dari 0!", "error");
    txAmountInput.focus();
    return;
  }

  if (!date) {
    showToast("Harap pilih tanggal transaksi!", "error");
    txDateInput.focus();
    return;
  }

  // Buat objek transaksi baru
  const newTx = {
    id: "tx-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    title,
    amount,
    type,
    category,
    date,
    notes,
  };

  // Tambahkan transaksi baru ke daftar paling depan
  transactions.unshift(newTx);
  saveTransactions();
  renderApp();

  // Reset form untuk input berikutnya
  form.reset();
  document.getElementById("typeExpense").checked = true;
  updateCategoryDropdown("expense");
  txDateInput.value = getTodayDateString();

  showToast(`Transaksi "${title}" berhasil disimpan!`, "success");
}

// Handler Hapus Transaksi
function handleDeleteTransaction(id) {
  const tx = transactions.find((t) => t.id === id);
  if (!tx) return;

  const konfirmasi = confirm(`Hapus transaksi "${tx.title}" (${formatRupiah(tx.amount)})?`);
  if (!konfirmasi) return;

  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  renderApp();
  showToast(`Transaksi "${tx.title}" telah dihapus.`, "info");
}

// Handler Reset Semua Data
function handleResetData() {
  if (transactions.length === 0) {
    showToast("Data transaksi sudah kosong!", "info");
    return;
  }

  const konfirmasi = confirm(
    "Apakah Anda yakin ingin mengosongkan seluruh data transaksi? Data yang dihapus tidak dapat dipulihkan."
  );
  if (!konfirmasi) return;

  transactions = [];
  saveTransactions();
  renderApp();
  showToast("Seluruh data transaksi berhasil dikosongkan.", "info");
}

// Ekspor Transaksi ke CSV
function exportTransactionsToCSV() {
  if (transactions.length === 0) {
    showToast("Belum ada data transaksi untuk diekspor!", "error");
    return;
  }

  const headers = ["ID", "Tanggal", "Tipe", "Kategori", "Judul", "Nominal (Rp)", "Catatan"];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === "income" ? "Pemasukan" : "Pengeluaran",
    `"${(t.category || "").replace(/"/g, '""')}"`,
    `"${(t.title || "").replace(/"/g, '""')}"`,
    t.amount,
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "\uFEFF" +
    [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `laporan-keuangan-${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Laporan CSV berhasil diunduh!", "success");
}

// ==========================================
// Toast Notifikasi
// ==========================================
let toastTimeout;
function showToast(message, type = "info") {
  if (!toastEl) return;

  clearTimeout(toastTimeout);

  toastEl.className = `toast ${type} show`;
  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-exclamation";

  toastEl.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;

  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 3200);
}
