import re

with open("d:/KSAMart/src/pages/TrendPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. DateRange type
content = re.sub(
    r"type DateRange = 'TODAY' \| '7_DAYS' \| '30_DAYS' \| 'THIS_YEAR';\n+",
    "",
    content
)

# 2. State definition
content = re.sub(
    r"  const \[dateRange, setDateRange\] = useState<DateRange>\('7_DAYS'\);",
    """  const todayObj = new Date();
  const firstDay = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).toISOString().split('T')[0];
  const currentDay = todayObj.toISOString().split('T')[0];
  
  const [startDateStr, setStartDateStr] = useState(firstDay);
  const [endDateStr, setEndDateStr] = useState(currentDay);""",
    content
)

# 3. Date bounds calculation
old_calc = """    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let label = '7 Hari Terakhir';

    if (dateRange === 'TODAY') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(now.getDate() - 1);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(now.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
      label = 'Hari Ini';
    } else if (dateRange === '7_DAYS') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(now.getDate() - 13);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(now.getDate() - 7);
      prevEndDate.setHours(23, 59, 59, 999);
      label = '7 Hari Terakhir';
    } else if (dateRange === '30_DAYS') {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(now.getDate() - 59);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(now.getDate() - 30);
      prevEndDate.setHours(23, 59, 59, 999);
      label = '30 Hari Terakhir';
    } else if (dateRange === 'THIS_YEAR') {
      startDate = new Date(now.getFullYear(), 0, 1);
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
      prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = 'Tahun Ini';
    }"""

new_calc = """    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const isYearly = daysCount > 90;

    let startDate = new Date(startObj);
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(endObj);
    endDate.setHours(23, 59, 59, 999);

    let prevStartDate = new Date(startObj);
    prevStartDate.setDate(startObj.getDate() - daysCount);
    let prevEndDate = new Date(startObj);
    prevEndDate.setDate(startObj.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    let label = ${startDateStr} s/d ;"""

content = content.replace(old_calc, new_calc)

# 4. currentTxs and currentExps filter to use endDate
content = content.replace(
    "const currentTxs = filteredTransactions.filter(t => new Date(t.timestamp) >= startDate);",
    "const currentTxs = filteredTransactions.filter(t => { const d = new Date(t.timestamp); return d >= startDate && d <= endDate; });"
)
content = content.replace(
    "const currentExps = (expenses || []).filter(e => new Date(e.date) >= startDate);",
    "const currentExps = (expenses || []).filter(e => { const d = new Date(e.date); return d >= startDate && d <= endDate; });"
)

# 5. mapData key logic
old_map = """      let key = '';
      if (dateRange === 'THIS_YEAR') {
        key = d.toLocaleString('id-ID', { month: 'short' });
      } else {
        key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
      }"""
new_map = """      let key = '';
      if (isYearly) {
        key = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      } else {
        key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
      }"""
content = content.replace(old_map, new_map)

# 6. finalChartData build loop
old_final = """    let finalChartData = [];
    if (dateRange !== 'THIS_YEAR') {
      const daysCount = dateRange === 'TODAY' ? 1 : dateRange === '7_DAYS' ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), i, 1);
        const key = d.toLocaleString('id-ID', { month: 'short' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    }"""
new_final = """    let finalChartData = [];
    if (!isYearly) {
      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startObj);
        d.setDate(startObj.getDate() + i);
        const key = d.toLocaleString('id-ID', { day: '2-digit', month: 'short' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
      }
    } else {
      let curr = new Date(startObj);
      curr.setDate(1);
      while (curr <= endDate) {
        const key = curr.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        finalChartData.push(mapData.get(key) || { name: key, omset: 0, margin: 0, zakat: 0 });
        curr.setMonth(curr.getMonth() + 1);
      }
    }"""
content = content.replace(old_final, new_final)

# 7. Dependency array
content = content.replace(
    "}, [filteredTransactions, expenses, products, dateRange, activeBranchId]);",
    "}, [filteredTransactions, expenses, products, startDateStr, endDateStr, activeBranchId]);"
)

# 8. Render Date Pickers in UI
old_ui = """          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="text-sm font-bold text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="TODAY">Hari Ini</option>
            <option value="7_DAYS">7 Hari Terakhir</option>
            <option value="30_DAYS">30 Hari Terakhir</option>
            <option value="THIS_YEAR">Tahun Ini</option>
          </select>"""
new_ui = """          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDateStr} 
              onChange={e => setStartDateStr(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
            />
            <span className="text-slate-400 text-sm">s/d</span>
            <input 
              type="date" 
              value={endDateStr} 
              onChange={e => setEndDateStr(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none w-32"
            />
          </div>"""
content = content.replace(old_ui, new_ui)

with open("d:/KSAMart/src/pages/TrendPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

