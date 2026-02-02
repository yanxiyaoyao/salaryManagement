import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Row, Col, Statistic, DatePicker, Space, Table, Tag, Segmented, Spin, Empty, message, Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { fetchSummaryStats, fetchTrendStats, fetchCategoryPie } from '@/apis/stats'
import './index.scss'

const { RangePicker } = DatePicker

const Statistics = () => {
  const [mode, setMode] = useState('day') // day | month | year
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')])
  const [monthValue, setMonthValue] = useState(dayjs())
  const [yearValue, setYearValue] = useState(dayjs())
  const [tableData, setTableData] = useState([])
  const [pieData, setPieData] = useState([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState([
    { title: '筛选范围支出', value: 0, color: '#ef4444' },
    { title: '筛选范围收入', value: 0, color: '#16a34a' },
    { title: '筛选范围净结余', value: 0, color: '#2563eb' },
  ])

  const lineRef = useRef(null)
  const barRef = useRef(null)
  const pieRef = useRef(null)

  const params = useMemo(() => {
    if (mode === 'day') {
      return {
        granularity: 'day',
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
      }
    }
    if (mode === 'month') {
      return {
        granularity: 'month',
        months: 6,
      }
    }
    return {
      granularity: 'year',
      years: 5,
    }
  }, [mode, dateRange])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [trendRes, pieRes, summaryRes] = await Promise.all([
          fetchTrendStats(params),
          fetchCategoryPie(),
          fetchSummaryStats(
            mode === 'day'
              ? {
                  start_date: params.start_date,
                  end_date: params.end_date,
                }
              : undefined,
          ),
        ])

        if (trendRes.code === 200 && Array.isArray(trendRes.data?.items)) {
          const mapped = trendRes.data.items.map((d) => ({
            key: d.period,
            period: d.period,
            expense: d.expense || 0,
            income: d.income || 0,
            net: (d.income || 0) - (d.expense || 0),
          }))
          setTableData(mapped)
        } else {
          setTableData([])
        }

        if (pieRes.code === 200) {
          setPieData(
            (pieRes.data?.items || []).map((item) => ({
              name: item.name,
              value: item.amount ?? item.value ?? 0,
            })),
          )
        } else {
          setPieData([])
        }

        if (summaryRes.code === 200) {
          const { income = 0, expense = 0, net = 0 } = summaryRes.data?.totals || {}
          setSummary([
            { title: '筛选范围支出', value: expense, color: '#ef4444' },
            { title: '筛选范围收入', value: income, color: '#16a34a' },
            { title: '筛选范围净结余', value: net, color: '#2563eb' },
          ])
        } else {
          setSummary([
            { title: '筛选范围支出', value: 0, color: '#ef4444' },
            { title: '筛选范围收入', value: 0, color: '#16a34a' },
            { title: '筛选范围净结余', value: 0, color: '#2563eb' },
          ])
        }
      } catch (err) {
        message.error(err?.message || '加载统计失败')
        setTableData([])
        setPieData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  useEffect(() => {
    const palette = {
      expense: '#f43f5e',
      income: '#22c55e',
      net: '#6366f1',
      pie: ['#60a5fa', '#f472b6', '#fcd34d', '#34d399', '#a78bfa', '#f97316'],
    }

    if (!lineRef.current || !barRef.current || !pieRef.current) return

    const line = echarts.init(lineRef.current)
    const bar = echarts.init(barRef.current)
    const pie = echarts.init(pieRef.current)

    const categories = tableData.map((d) => d.period)
    const expenses = tableData.map((d) => d.expense)
    const incomes = tableData.map((d) => d.income)

    if (tableData.length) {
      line.setOption({
        color: [palette.expense, palette.income],
        tooltip: { trigger: 'axis' },
        legend: { data: ['支出', '收入'] },
        xAxis: { type: 'category', data: categories },
        yAxis: { type: 'value' },
        series: [
          { name: '支出', type: 'line', data: expenses, smooth: true, areaStyle: { opacity: 0.15 } },
          { name: '收入', type: 'line', data: incomes, smooth: true, areaStyle: { opacity: 0.15 } },
        ],
      })

      bar.setOption({
        color: [palette.expense, palette.income, palette.net],
        tooltip: { trigger: 'axis' },
        legend: { data: ['支出', '收入', '净结余'] },
        xAxis: { type: 'category', data: categories },
        yAxis: { type: 'value' },
        series: [
          { name: '支出', type: 'bar', data: expenses },
          { name: '收入', type: 'bar', data: incomes },
          {
            name: '净结余',
            type: 'bar',
            data: tableData.map((d) => (d.income || 0) - (d.expense || 0)),
          },
        ],
      })
    }

    if (pieData.length) {
      pie.setOption({
        color: palette.pie,
        tooltip: { trigger: 'item' },
        legend: { top: 'bottom' },
        series: [
          {
            type: 'pie',
            radius: ['35%', '65%'],
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { formatter: '{b}\n{d}%' },
            data: pieData,
          },
        ],
      })
    }

    const resize = () => {
      line.resize()
      bar.resize()
      pie.resize()
    }
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      line.dispose()
      bar.dispose()
      pie.dispose()
    }
  }, [tableData, pieData])

  const columns = [
    { title: mode === 'day' ? '日期' : mode === 'month' ? '月份' : '年份', dataIndex: 'period', key: 'period', width: 140 },
    {
      title: '支出',
      dataIndex: 'expense',
      key: 'expense',
      render: (v) => <span style={{ color: '#ef4444' }}>- {Number(v || 0).toFixed(2)}</span>,
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      render: (v) => <span style={{ color: '#16a34a' }}>+ {Number(v || 0).toFixed(2)}</span>,
    },
    {
      title: '净结余',
      dataIndex: 'net',
      key: 'net',
      render: (v, record) => {
        const net = v !== undefined ? v : (record.income || 0) - (record.expense || 0)
        return <Tag color={net >= 0 ? 'blue' : 'red'}>{net >= 0 ? '+' : '-'}{Math.abs(net).toFixed(2)}</Tag>
      },
    },
  ]

  const handleExportExcel = () => {
    try {
      // 动态导入 xlsx 库
      import('xlsx').then((XLSX) => {
        const wb = XLSX.utils.book_new()

        // ===== Sheet 1: 收支趋势数据 =====
        const trendData = tableData.map((item) => ({
          [mode === 'day' ? '日期' : mode === 'month' ? '月份' : '年份']: item.period,
          '支出': Number(item.expense || 0).toFixed(2),
          '收入': Number(item.income || 0).toFixed(2),
          '净结余': Number((item.income || 0) - (item.expense || 0)).toFixed(2),
        }))

        // 添加汇总行
        trendData.push({
          [mode === 'day' ? '日期' : mode === 'month' ? '月份' : '年份']: '合计',
          '支出': Number(summary[0].value).toFixed(2),
          '收入': Number(summary[1].value).toFixed(2),
          '净结余': Number(summary[2].value).toFixed(2),
        })

        const ws1 = XLSX.utils.json_to_sheet(trendData)
        ws1['!cols'] = [
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
        ]
        XLSX.utils.book_append_sheet(wb, ws1, '收支趋势')

        // ===== Sheet 2: 分类占比数据 =====
        if (pieData.length > 0) {
          const categoryData = pieData.map((item) => ({
            '分类': item.name,
            '金额': Number(item.value || 0).toFixed(2),
            '占比': `${((item.value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(2)}%`,
          }))

          // 添加合计行
          const totalAmount = pieData.reduce((sum, d) => sum + d.value, 0)
          categoryData.push({
            '分类': '合计',
            '金额': Number(totalAmount).toFixed(2),
            '占比': '100%',
          })

          const ws2 = XLSX.utils.json_to_sheet(categoryData)
          ws2['!cols'] = [
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
          ]
          XLSX.utils.book_append_sheet(wb, ws2, '分类占比')
        }

        // ===== Sheet 3: 汇总统计 =====
        const summaryData = [
          { '指标': '筛选范围支出', '金额': Number(summary[0].value).toFixed(2) },
          { '指标': '筛选范围收入', '金额': Number(summary[1].value).toFixed(2) },
          { '指标': '筛选范围净结余', '金额': Number(summary[2].value).toFixed(2) },
        ]

        const ws3 = XLSX.utils.json_to_sheet(summaryData)
        ws3['!cols'] = [
          { wch: 15 },
          { wch: 15 },
        ]
        XLSX.utils.book_append_sheet(wb, ws3, '汇总统计')

        // 生成文件名
        const fileName = `统计数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`

        // 导出文件
        XLSX.writeFile(wb, fileName)
        message.success('导出成功')
      }).catch(() => {
        message.error('导出失败')
      })
    } catch (err) {
      message.error('导出失败')
    }
  }

  return (
    <div className="statistics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">统计分析</h1>
          <p className="page-subtitle">按天 / 月 / 年查看收支趋势与分类贡献</p>
        </div>
      </div>

      <Card className="filters-card" bordered={false}>
        <div className="filters-wrapper">
          <Space size={[12, 12]} wrap align="center">
            <Segmented
              options={[
                { label: '按天', value: 'day' },
                { label: '按月', value: 'month' },
                { label: '按年', value: 'year' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {mode === 'day' && (
              <RangePicker
                value={dateRange}
                onChange={(v) => setDateRange(v || [null, null])}
              />
            )}
            {mode === 'month' && (
              <DatePicker
                picker="month"
                value={monthValue}
                onChange={(v) => setMonthValue(v)}
              />
            )}
            {mode === 'year' && (
              <DatePicker
                picker="year"
                value={yearValue}
                onChange={(v) => setYearValue(v)}
              />
            )}
          </Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            disabled={tableData.length === 0}
          >
            导出 Excel
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="summary-row">
        {summary.map((item) => (
          <Col xs={24} sm={8} key={item.title}>
            <Card bordered={false} className="summary-card">
              <Statistic
                title={item.title}
                value={item.value}
                precision={2}
                suffix="元"
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="收支折线图" bordered={false} className="chart-card">
            {tableData.length === 0 ? (
              <Empty description="暂无数据" />
            ) : (
              <div ref={lineRef} className="chart-container" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="分类占比（饼图）" bordered={false} className="chart-card">
            {pieData.length === 0 ? (
              <Empty description="暂无数据" />
            ) : (
              <div ref={pieRef} className="chart-container" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="收支柱状图" bordered={false} className="chart-card">
            {tableData.length === 0 ? (
              <Empty description="暂无数据" />
            ) : (
              <div ref={barRef} className="chart-container" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="数据明细" bordered={false} className="list-card">
            <Table
              dataSource={tableData}
              columns={columns}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Statistics
