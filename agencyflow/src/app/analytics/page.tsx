'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  Calendar,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Users,
  CheckCircle2,
  Trophy,
  Download,
  Target,
  BarChart3,
  Building2,
  FolderKanban,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();

  // State Management
  const [dateRange, setDateRange] = useState<'YTD' | 'MTD' | '30D' | '90D' | 'THIS_YEAR' | 'LAST_YEAR'>('YTD');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive Chart Legends Toggle
  const [showActuals, setShowActuals] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [activeHoverMonth, setActiveHoverMonth] = useState<number | null>(7); // Default to Aug

  // Date Range Display Labels
  const rangeLabels: Record<string, string> = {
    YTD: 'YTD (Full Year)',
    MTD: 'MTD (Month to Date)',
    '30D': 'Last 30 Days',
    '90D': 'Last 90 Days',
    THIS_YEAR: 'This Year (2026)',
    LAST_YEAR: 'Last Year (2025)',
  };

  // Fetch Analytics from API based on range
  const fetchAnalytics = async (rangeKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/analytics?range=${rangeKey}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAnalyticsData(json.data);
      } else {
        setError('Failed to compute agency performance metrics.');
      }
    } catch (err: any) {
      setError('Unable to connect to analytics server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!analyticsData) return;

    const { kpis, monthlyData, funnel, topClients, projectMetrics } = analyticsData;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `AgencyFlow Analytics Report - Period: ${rangeLabels[dateRange]}\n\n`;
    csvContent += 'KEY PERFORMANCE INDICATORS\n';
    csvContent += 'Metric,Value,Trend\n';
    csvContent += `Average Deal Size,${kpis.avgDealSize},${kpis.avgDealTrend}\n`;
    csvContent += `Average Sales Cycle,${kpis.avgSalesCycle},${kpis.cycleTrend}\n`;
    csvContent += `Win Rate,${kpis.winRate},${kpis.winRateTrend}\n`;
    csvContent += `Pipeline Value,${kpis.pipelineValue},${kpis.pipelineTrend}\n`;
    csvContent += `Active Deals,${kpis.activeDealsCount},N/A\n`;
    csvContent += `Total Tracked Revenue,${kpis.totalRevenue},${kpis.revenueGrowth}\n\n`;

    csvContent += 'MONTHLY REVENUE & FORECAST\n';
    csvContent += 'Month,Actual Revenue,Forecast Revenue,Variance\n';
    monthlyData.forEach((m: any) => {
      csvContent += `${m.month},${m.actual ? `$${m.actual}` : 'N/A'},$${m.forecast},${m.variance}\n`;
    });
    csvContent += '\n';

    csvContent += 'LEAD CONVERSION FUNNEL\n';
    csvContent += 'Stage,Lead Count,Conversion Rate %,Dropoff %\n';
    funnel.forEach((f: any) => {
      csvContent += `${f.stage},${f.count},${f.conversion}%,${f.dropoff}%\n`;
    });
    csvContent += '\n';

    csvContent += 'TOP CLIENTS PERFORMANCE\n';
    csvContent += 'Client Name,Annual Contribution,Status\n';
    topClients.forEach((c: any) => {
      csvContent += `${c.name},${c.retainerFormatted},${c.status}\n`;
    });
    csvContent += '\n';

    csvContent += 'PROJECT PERFORMANCE\n';
    csvContent += `Active Projects,${projectMetrics.activeProjectsCount}\n`;
    csvContent += `Projects On Track,${projectMetrics.projectsOnTrack}\n`;
    csvContent += `Projects At Risk,${projectMetrics.projectsAtRisk}\n`;
    csvContent += `Average Completion,${projectMetrics.avgProjectProgress}\n`;
    csvContent += `Overdue Tasks,${projectMetrics.overdueTasksCount}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AgencyFlow_Performance_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = analyticsData?.kpis || {
    avgDealSize: '$0',
    avgDealTrend: '0%',
    avgSalesCycle: '0 Days',
    cycleTrend: '0%',
    winRate: '0%',
    winRateTrend: '0%',
    pipelineValue: '$0',
    pipelineTrend: '$0',
    activeDealsCount: 0,
    revenueGrowth: '0%',
    totalRevenue: '$0',
    projectedRevenue: '$0',
  };
  const monthlyData = analyticsData?.monthlyData || [];
  const funnel = analyticsData?.funnel || [];
  const pipelineInsights = analyticsData?.pipelineInsights || {
    overallConversion: '0%',
    largestDropoff: 'N/A',
    avgTimeToClose: '0 days',
  };
  const topClients = analyticsData?.topClients || [];
  const projectMetrics = analyticsData?.projectMetrics || {
    activeProjectsCount: 0,
    projectsOnTrack: 0,
    projectsAtRisk: 0,
    overdueTasksCount: 0,
  };
  const insights = analyticsData?.insights || [];

  return (
    <AppShell>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 1. Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.01em', margin: 0 }}>
              Performance Analytics
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
              Comprehensive agency metrics, sales efficiency, and forecasting
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportCSV}
              disabled={loading || !analyticsData}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            >
              <Download size={16} /> Export CSV Report
            </button>

            {/* Date Range Dropdown Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="glass-card"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: 'rgba(28, 31, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--on-surface)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <Calendar size={16} color="var(--primary)" />
                <span>Range: {rangeLabels[dateRange]}</span>
                <ChevronDown size={16} color="var(--on-surface-variant)" style={{ marginLeft: '0.25rem' }} />
              </button>

              {isDropdownOpen && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    width: '200px',
                    background: '#1c1f2a',
                    borderRadius: '0.5rem',
                    padding: '0.4rem',
                    border: '1px solid rgba(255,255,255,0.12)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                >
                  {(['YTD', 'MTD', '30D', '90D', 'THIS_YEAR', 'LAST_YEAR'] as const).map((rngKey) => (
                    <button
                      key={rngKey}
                      onClick={() => {
                        setDateRange(rngKey);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.35rem',
                        textAlign: 'left',
                        background: dateRange === rngKey ? 'var(--surface-container-high)' : 'transparent',
                        color: dateRange === rngKey ? 'var(--primary)' : 'var(--on-surface)',
                        border: 'none',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        fontWeight: dateRange === rngKey ? 700 : 500,
                      }}
                    >
                      {rangeLabels[rngKey]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card skeleton-pulse" style={{ height: '110px', borderRadius: '0.75rem' }} />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-container)', border: '1px solid rgba(255, 185, 95, 0.3)' }}>
            <AlertTriangle size={32} color="var(--tertiary)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)' }}>{error}</h3>
            <button onClick={() => fetchAnalytics(dateRange)} className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : (
          <>
            {/* 2. Compact 6-Card KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              
              {/* KPI 1: Avg Deal Size */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AVG DEAL SIZE</span>
                  <Wallet size={16} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{kpis.avgDealSize}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  <TrendingUp size={12} /> <span>{kpis.avgDealTrend} vs prior</span>
                </div>
              </div>

              {/* KPI 2: Avg Sales Cycle */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AVG SALES CYCLE</span>
                  <Clock size={16} color="var(--secondary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{kpis.avgSalesCycle}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  <TrendingDown size={12} /> <span>{kpis.cycleTrend}</span>
                </div>
              </div>

              {/* KPI 3: Win Rate */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WIN RATE</span>
                  <Target size={16} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{kpis.winRate}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  <TrendingUp size={12} /> <span>{kpis.winRateTrend} win efficiency</span>
                </div>
              </div>

              {/* KPI 4: Pipeline Value */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PIPELINE VALUE</span>
                  <BarChart3 size={16} color="var(--tertiary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{kpis.pipelineValue}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  <TrendingUp size={12} /> <span>{kpis.pipelineTrend} active deals</span>
                </div>
              </div>

              {/* KPI 5: Active Deals */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ACTIVE DEALS</span>
                  <Users size={16} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--on-surface)' }}>{kpis.activeDealsCount} Deals</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>In active stages</div>
              </div>

              {/* KPI 6: Revenue Growth */}
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>REVENUE GROWTH</span>
                  <Trophy size={16} color="var(--secondary)" />
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>{kpis.revenueGrowth}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Year over year</div>
              </div>
            </div>

            {/* 3. Main Analytics: Monthly Revenue & Forecast + Revenue Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '1.25rem' }}>
              
              {/* Monthly Revenue & Forecast SVG Chart */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                      Monthly Revenue & Forecast
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.15rem 0 0 0' }}>
                      Tracked Revenue: <strong style={{ color: 'var(--on-surface)' }}>{kpis.totalRevenue}</strong>
                    </p>
                  </div>

                  {/* Interactive Legends */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => setShowActuals(!showActuals)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: showActuals ? 1 : 0.4,
                      }}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 6px rgba(192,193,255,0.6)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface)', fontWeight: 600 }}>Actuals</span>
                    </button>

                    <button
                      onClick={() => setShowForecast(!showForecast)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: showForecast ? 1 : 0.4,
                      }}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px dashed var(--primary)', background: 'rgba(192,193,255,0.3)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface)', fontWeight: 600 }}>Forecast</span>
                    </button>
                  </div>
                </div>

                {/* SVG Chart Container */}
                <div style={{ width: '100%', height: '240px', position: 'relative', marginTop: '0.5rem' }}>
                  {(() => {
                    const maxRevenueValue = Math.max(
                      ...monthlyData.map((m: any) => Math.max(m.actual || 0, m.forecast || 0)),
                      0
                    );
                    const hasRevenueData = maxRevenueValue > 0;
                    const chartCeiling = hasRevenueData ? maxRevenueValue * 1.15 : 10000;

                    // Coordinate helper: maps revenue value to SVG Y-axis (baseline = 170, top = 30)
                    const getYCoord = (val: number | null) => {
                      if (val === null) return 170;
                      if (!hasRevenueData || val <= 0) return 170;
                      const clamped = Math.min(val, chartCeiling);
                      return 170 - (clamped / chartCeiling) * 135;
                    };

                    // Compute (x, y) coordinates for all 12 months
                    interface MonthCoordItem {
                      x: number;
                      y: number;
                      actualY: number;
                      forecastY: number;
                      isForecastOnly: boolean;
                      raw: any;
                    }

                    const monthCoords: MonthCoordItem[] = monthlyData.map((m: any, i: number) => {
                      const x = 41.6 + i * 83.33;
                      const isForecastOnly = m.actual === null;
                      const val = isForecastOnly ? m.forecast : m.actual;
                      const y = getYCoord(val);
                      const actualY = getYCoord(m.actual);
                      const forecastY = getYCoord(m.forecast);
                      return { x, y, actualY, forecastY, isForecastOnly, raw: m };
                    });

                    // Helper to build smooth cubic bezier curve
                    const buildSvgPath = (points: Array<{ x: number; y: number }>) => {
                      if (points.length === 0) return '';
                      if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
                      let path = `M ${points[0].x},${points[0].y}`;
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = points[i];
                        const p1 = points[i + 1];
                        const cpX = (p0.x + p1.x) / 2;
                        path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
                      }
                      return path;
                    };

                    // Separate Actuals and Forecast point sets
                    const actualPoints = monthCoords.filter((p: MonthCoordItem) => !p.isForecastOnly).map((p: MonthCoordItem) => ({ x: p.x, y: p.actualY }));
                    const actualLinePath = buildSvgPath(actualPoints);
                    const actualAreaPath = actualPoints.length > 0
                      ? `${actualLinePath} L ${actualPoints[actualPoints.length - 1].x},170 L ${actualPoints[0].x},170 Z`
                      : '';

                    // Forecast connects from the last actual point through the end of the year
                    const lastActualPoint = actualPoints.length > 0 ? actualPoints[actualPoints.length - 1] : null;
                    const forecastPoints = [
                      ...(lastActualPoint ? [lastActualPoint] : []),
                      ...monthCoords.filter((p: MonthCoordItem) => p.isForecastOnly).map((p: MonthCoordItem) => ({ x: p.x, y: p.forecastY })),
                    ];
                    const forecastLinePath = buildSvgPath(forecastPoints);
                    const forecastAreaPath = forecastPoints.length > 0
                      ? `${forecastLinePath} L ${forecastPoints[forecastPoints.length - 1].x},170 L ${forecastPoints[0].x},170 Z`
                      : '';

                    return (
                      <>
                        <svg style={{ width: '100%', height: '200px' }} viewBox="0 0 1000 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#c0c1ff" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#c0c1ff" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#c0c1ff" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#c0c1ff" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid lines */}
                          <g stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth="1">
                            <line x1="0" y1="35" x2="1000" y2="35" />
                            <line x1="0" y1="80" x2="1000" y2="80" />
                            <line x1="0" y1="125" x2="1000" y2="125" />
                            <line x1="0" y1="170" x2="1000" y2="170" />
                          </g>

                          {/* Actuals Series */}
                          {showActuals && actualLinePath && (
                            <>
                              {hasRevenueData && <path d={actualAreaPath} fill="url(#areaGrad)" />}
                              <path
                                d={actualLinePath}
                                fill="none"
                                stroke="var(--primary)"
                                strokeWidth="3"
                                style={{ filter: 'drop-shadow(0 0 8px rgba(192,193,255,0.4))' }}
                              />
                            </>
                          )}

                          {/* Forecast Series */}
                          {showForecast && forecastLinePath && (
                            <>
                              {hasRevenueData && <path d={forecastAreaPath} fill="url(#foreGrad)" />}
                              <path
                                d={forecastLinePath}
                                fill="none"
                                stroke="var(--primary)"
                                strokeDasharray="6 6"
                                strokeWidth="2.5"
                                opacity="0.75"
                              />
                            </>
                          )}

                          {/* Month Data Point Nodes */}
                          {monthCoords.map((coord: MonthCoordItem, i: number) => {
                            return (
                              <g key={coord.raw.month} onMouseEnter={() => setActiveHoverMonth(i)} style={{ cursor: 'pointer' }}>
                                <circle
                                  cx={coord.x}
                                  cy={coord.y}
                                  r={activeHoverMonth === i ? 6 : 4}
                                  fill={coord.isForecastOnly ? 'transparent' : 'var(--primary)'}
                                  stroke="var(--primary)"
                                  strokeWidth="2"
                                />
                              </g>
                            );
                          })}

                          {/* X-Axis Labels */}
                          <g fill="var(--on-surface-variant)" fontSize="11" fontWeight="600">
                            {monthCoords.map((coord: MonthCoordItem) => (
                              <text key={coord.raw.month} x={coord.x} y="195" textAnchor="middle">
                                {coord.raw.month}
                              </text>
                            ))}
                          </g>
                        </svg>

                        {/* Zero-state hint when there's no revenue yet */}
                        {!hasRevenueData && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '38%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.4rem 0.9rem',
                              borderRadius: '20px',
                              background: 'rgba(20, 23, 34, 0.85)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'var(--on-surface-variant)',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              pointerEvents: 'none',
                              backdropFilter: 'blur(6px)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            }}
                          >
                            <span>No revenue recorded yet ($0 baseline)</span>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Active Hover Month Detailed Tooltip */}
                  {activeHoverMonth !== null && monthlyData[activeHoverMonth] && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '45px',
                        left: `${Math.min(Math.max((activeHoverMonth / 11) * 85, 5), 75)}%`,
                        padding: '0.6rem 0.85rem',
                        borderRadius: '0.5rem',
                        background: '#141722',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                        zIndex: 20,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.2rem' }}>
                        {monthlyData[activeHoverMonth].month} Revenue Overview
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--on-surface)' }}>
                        Actual: <strong>{monthlyData[activeHoverMonth].actual !== null ? `$${(monthlyData[activeHoverMonth].actual || 0).toLocaleString()}` : 'Pending'}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                        Forecast: <strong>${(monthlyData[activeHoverMonth].forecast || 0).toLocaleString()}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.2rem', fontWeight: 700 }}>
                        Variance: {monthlyData[activeHoverMonth].variance}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Revenue Summary Panel */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Revenue Context
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL TRACKED REVENUE</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.15rem' }}>{kpis.totalRevenue}</div>
                  </div>

                  <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>PROJECTED YEAR END</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.15rem' }}>{kpis.projectedRevenue}</div>
                  </div>

                  <div style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'rgba(0, 165, 114, 0.15)', border: '1px solid rgba(0, 165, 114, 0.3)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>PROJECTED GROWTH RATE</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.15rem' }}>{kpis.revenueGrowth || '0%'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Secondary Analytics: Lead Conversion Funnel + Pipeline Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '1.25rem' }}>
              
              {/* Progressive Lead Funnel */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    Lead Conversion Funnel
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0.15rem 0 0 0' }}>
                    Pipeline efficiency across lead acquisition & conversion stages
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {funnel.map((item: any, idx: number) => {
                    const widthPercent = Math.max(item.conversion, 15);
                    return (
                      <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '110px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)' }}>
                          {item.stage}
                        </div>
                        <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: '9999px', height: '26px', overflow: 'hidden', position: 'relative' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${widthPercent}%`,
                              background: idx === funnel.length - 1
                                ? 'linear-gradient(90deg, var(--secondary), #6ffbbe)'
                                : 'linear-gradient(90deg, var(--primary), #a5a6ff)',
                              borderRadius: '9999px',
                              transition: 'width 0.5s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              paddingRight: '0.75rem',
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#000' }}>{item.count} leads</span>
                          </div>
                        </div>
                        <div style={{ width: '60px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {item.conversion}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pipeline Insights Panel */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Target size={18} color="var(--primary)" /> Pipeline Insights
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>OVERALL CONVERSION</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.1rem' }}>
                      {pipelineInsights?.overallConversion || '0%'}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>LARGEST DROPOFF STAGE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--tertiary)', marginTop: '0.1rem' }}>
                      {pipelineInsights?.largestDropoff || 'No Dropoff'}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>AVERAGE TIME TO CLOSE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)', marginTop: '0.1rem' }}>
                      {pipelineInsights?.avgTimeToClose || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Business Performance: Top Clients + Project Performance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              {/* Top Clients Performance */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={18} color="var(--primary)" /> Top Clients Performance
                  </h3>
                  <Link href="/clients" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    View All <ArrowRight size={14} />
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {!topClients || topClients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--on-surface-variant)' }}>
                      <Building2 size={28} style={{ opacity: 0.35, margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.25rem' }}>No Clients Tracked</p>
                      <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>Add client organizations or convert leads to see performance.</p>
                    </div>
                  ) : (
                    topClients.map((client: any) => (
                      <div
                        key={client.id || client.name}
                        onClick={() => router.push('/clients')}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '0.5rem',
                          background: 'var(--surface-container-high)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          border: '1px solid rgba(255,255,255,0.04)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--on-surface)', fontSize: '0.875rem' }}>{client.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Status: {client.status}</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--secondary)', fontSize: '0.95rem' }}>{client.retainerFormatted}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{client.contractType || 'Prospect'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Project Performance Metrics */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FolderKanban size={18} color="var(--secondary)" /> Project Delivery Performance
                  </h3>
                  <Link href="/projects" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    View Projects <ArrowRight size={14} />
                  </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div onClick={() => router.push('/projects')} style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>ACTIVE PROJECTS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--on-surface)', marginTop: '0.2rem' }}>{projectMetrics?.activeProjectsCount ?? 0}</div>
                  </div>

                  <div onClick={() => router.push('/projects')} style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>PROJECTS ON TRACK</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.2rem' }}>{projectMetrics?.projectsOnTrack ?? 0}</div>
                  </div>

                  <div onClick={() => router.push('/projects')} style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>PROJECTS AT RISK</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tertiary)', marginTop: '0.2rem' }}>{projectMetrics?.projectsAtRisk ?? 0}</div>
                  </div>

                  <div onClick={() => router.push('/tasks')} style={{ padding: '0.85rem', borderRadius: '0.5rem', background: 'var(--surface-container-high)', cursor: 'pointer' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>OVERDUE TASKS</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--tertiary)', marginTop: '0.2rem' }}>{projectMetrics?.overdueTasksCount ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Key Data Insights */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface-container-low)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lightbulb size={18} color="var(--tertiary)" /> Executive Key Insights
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {insights.map((ins: any) => (
                  <div key={ins.id} style={{ padding: '1rem', borderRadius: '0.6rem', background: 'var(--surface-container-high)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      {ins.title}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
                      {ins.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
