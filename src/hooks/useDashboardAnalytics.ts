/**
 * useDashboardAnalytics — Tracks key user interactions for behavior insights.
 * Wraps both Blink analytics and Firebase Analytics.
 * Add this hook to DashboardLayout to enable global tracking.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from '@tanstack/react-router';
import { blink } from '../blink/client';

// ── Event types ──────────────────────────────────────────────────────────────

export type DashboardEvent =
  | 'sidebar_click'
  | 'chart_hover'
  | 'chart_click'
  | 'table_sort'
  | 'table_filter'
  | 'table_row_click'
  | 'table_pagination'
  | 'kpi_card_click'
  | 'modal_open'
  | 'modal_close'
  | 'button_click'
  | 'tab_switch'
  | 'search_query'
  | 'export_click'
  | 'refresh_data'
  | 'notification_click'
  | 'external_link_click'
  | 'feature_tooltip_view';

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

// ── Tracking function ────────────────────────────────────────────────────────

function trackDashboardEvent(event: DashboardEvent, params?: EventParams) {
  // Blink analytics (always available)
  try {
    void blink.analytics.log(`dashboard_${event}`, params || {});
  } catch { /* no-op */ }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardAnalytics() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const sessionStart = useRef(Date.now());

  // Track navigation
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      trackDashboardEvent('sidebar_click', {
        from: prevPath.current,
        to: location.pathname,
        session_duration_s: Math.round((Date.now() - sessionStart.current) / 1000),
      });
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  // ── Specific tracking helpers (stable refs) ─────────────────────────────────

  const trackChartInteraction = useCallback((chartName: string, action: 'hover' | 'click', dataPoint?: string) => {
    trackDashboardEvent(action === 'click' ? 'chart_click' : 'chart_hover', {
      chart: chartName,
      data_point: dataPoint || '',
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackTableSort = useCallback((tableName: string, column: string, direction: 'asc' | 'desc') => {
    trackDashboardEvent('table_sort', {
      table: tableName,
      column,
      direction,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackTableFilter = useCallback((tableName: string, filterName: string, filterValue: string) => {
    trackDashboardEvent('table_filter', {
      table: tableName,
      filter: filterName,
      value: filterValue,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackTableRowClick = useCallback((tableName: string, rowId: string) => {
    trackDashboardEvent('table_row_click', {
      table: tableName,
      row_id: rowId,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackKPIClick = useCallback((kpiName: string, value: string | number) => {
    trackDashboardEvent('kpi_card_click', {
      kpi: kpiName,
      value: String(value),
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackTabSwitch = useCallback((tabGroup: string, tab: string) => {
    trackDashboardEvent('tab_switch', {
      group: tabGroup,
      tab,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackButtonClick = useCallback((buttonName: string, context?: string) => {
    trackDashboardEvent('button_click', {
      button: buttonName,
      context: context || '',
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackExport = useCallback((format: string, source: string) => {
    trackDashboardEvent('export_click', {
      format,
      source,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackSearch = useCallback((query: string, source: string) => {
    trackDashboardEvent('search_query', {
      query_length: query.length,
      source,
      page: location.pathname,
    });
  }, [location.pathname]);

  const trackNotificationClick = useCallback((type: string) => {
    trackDashboardEvent('notification_click', {
      type,
      page: location.pathname,
    });
  }, [location.pathname]);

  return {
    trackChartInteraction,
    trackTableSort,
    trackTableFilter,
    trackTableRowClick,
    trackKPIClick,
    trackTabSwitch,
    trackButtonClick,
    trackExport,
    trackSearch,
    trackNotificationClick,
    track: trackDashboardEvent,
  };
}
