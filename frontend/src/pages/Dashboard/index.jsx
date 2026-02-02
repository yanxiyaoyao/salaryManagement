import { useEffect, useRef, useState } from 'react'
import { Card, Row, Col, Statistic, List, Spin, Empty, message } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import * as echarts from 'echarts'
import { fetchAnnualStats, fetchCategoryPie, fetchMonthlyStats, fetchSummaryStats } from '@/apis/stats'
import { fetchTransactions } from '@/apis/transactions'
import './index.scss'

const Dashboard = () => {
  const defaultCards = [
    {
      title: '总支出',
      value: 0,
      unit: '元',
      icon: <ArrowDownOutlined />,
      color: '#ef4444',
      description: '当前筛选范围',
    },
    {
      title: '总收入',
      value: 0,
      unit: '元',
      icon: <ArrowUpOutlined />,
      color: '#16a34a',
      description: '当前筛选范围',
    },
    {
      title: '净结余',
      value: 0,
      unit: '元',
      icon: <WalletOutlined />,
      color: '#2563eb',
      description: '收入大于支出',
    },
  ]

  const chartRef = useRef(null)
  const [pieData, setPieData] = useState([])
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState(defaultCards)
  const [monthly, setMonthly] = useState([])
  const [recent, setRecent] = useState([])
  const [annual, setAnnual] = useState({ income: 0, expense: 0, net: 0, year: new Date().getFullYear() })

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)
        const [summaryRes, monthlyRes, pieRes, recentRes, annualRes] = await Promise.all([
          fetchSummaryStats(),
          fetchMonthlyStats({ months: 6 }),
          fetchCategoryPie(),
          fetchTransactions({ page: 1, size: 8 }),
          fetchAnnualStats(),
        ])

        if (summaryRes.code === 200) {
          const { income = 0, expense = 0, net = 0 } = summaryRes.data?.totals || {}
          const { income: prevIncome = 0, expense: prevExpense = 0, net: prevNet = 0 } = summaryRes.data?.prev_totals || {}
          const toDesc = (cur, prev) => {
            if (!prev) return '暂无上期对比'
            const diff = cur - prev
            const rate = prev ? (diff / prev) * 100 : 0
            const sign = diff >= 0 ? '+' : ''
            return `${sign}${diff.toFixed(2)} (${sign}${rate.toFixed(1)}%)`
          }

          setCards([
            {
              title: '总支出',
              value: expense,
              unit: '元',
              icon: <ArrowDownOutlined />,
              color: '#ef4444',
              description: `较上期 ${toDesc(expense, prevExpense)}`,
            },
            {
              title: '总收入',
              value: income,
              unit: '元',
              icon: <ArrowUpOutlined />,
              color: '#16a34a',
              description: `较上期 ${toDesc(income, prevIncome)}`,
            },
            {
              title: '净结余',
              value: net,
              unit: '元',
              icon: <WalletOutlined />,
              color: net >= 0 ? '#2563eb' : '#ef4444',
              description: `较上期 ${toDesc(net, prevNet)}`,
            },
          ])
        } else {
          message.error(summaryRes.msg || '加载汇总失败')
        }

        if (monthlyRes.code === 200) {
          setMonthly(monthlyRes.data?.items || [])
        }

        if (pieRes.code === 200 && pieRes.data?.items?.length) {
          setPieData(
            pieRes.data.items.map((item) => ({
              name: item.name,
              amount: item.amount,
            })),
          )
        }

        if (recentRes.code === 200 && recentRes.data?.items) {
          setRecent(recentRes.data.items)
        }

        if (annualRes.code === 200 && annualRes.data?.totals) {
          setAnnual({
            year: annualRes.data.year,
            income: annualRes.data.totals.income,
            expense: annualRes.data.totals.expense,
            net: annualRes.data.totals.net,
          })
        }
      } catch (err) {
        message.error(err?.message || '加载概览失败')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  useEffect(() => {
    if (!chartRef.current || pieData.length === 0) return
    
    const chart = echarts.init(chartRef.current)
    chart.setOption({
      color: ['#60a5fa', '#f472b6', '#fcd34d', '#34d399', '#a78bfa', '#f97316'],
      tooltip: { trigger: 'item' },
      legend: { top: 'bottom' },
      series: [
        {
          type: 'pie',
          radius: ['35%', '65%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}\n{d}%' },
          data: pieData.map((c) => ({ value: c.amount, name: c.name })),
        },
      ],
    })
    
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [pieData])

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">记账概览</h1>
          <p className="page-subtitle">快速查看收入、支出与月度走势</p>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} className="overview-row">
          {[...cards, {
            title: `${annual.year} 年净结余`,
            value: annual.net,
            unit: '元',
            icon: <WalletOutlined />,
            color: annual.net >= 0 ? '#8b5cf6' : '#d946ef',
            description: `全年收入 ${annual.income.toFixed(2)} / 支出 ${annual.expense.toFixed(2)}`,
          }].map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card className="stat-card" bordered={false}>
                <div className="stat-card__icon" style={{ backgroundColor: `${item.color}1a` }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                </div>
                <Statistic
                  title={item.title}
                  value={item.value}
                  suffix={item.unit}
                  precision={2}
                  valueStyle={{ color: item.color }}
                />
                <div className="stat-card__description">{item.description}</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} className="content-row">
          <Col xs={24} lg={14}>
            <Card title="本月支出分类占比" bordered={false} className="chart-card" bodyStyle={{ height: 365, padding: 16 }}>
              {pieData.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="最近记账" bordered={false} className="activity-card" bodyStyle={{ height: 365, padding: 16 }}>
              <div style={{ height: '100%', overflowY: 'auto', paddingRight: 8 }}>
                {recent.length === 0 ? (
                  <Empty description="暂无最近记录" />
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={recent}
                    renderItem={(item) => (
                      <List.Item style={{ paddingInline: 4 }}>
                        <List.Item.Meta
                          title={item.category?.name || item.note || '未命名'}
                          description={item.occurred_on}
                        />
                        <span style={{ color: item.type === 'income' ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                          {item.type === 'income' ? '+' : '-'}
                          {Math.abs(Number(item.amount || 0)).toFixed(2)}
                        </span>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard

