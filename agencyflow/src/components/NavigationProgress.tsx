'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    setVisible(true);
    setProgress(15);

    // Trickle progress from 15% up to 85%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        // Smooth logarithmic trickle
        const diff = (88 - prev) * 0.12;
        return Math.min(85, prev + Math.max(diff, 0.5));
      });
    }, 100);

    // Safety timeout: complete & hide after 8s if navigation gets cancelled or stuck
    safetyTimerRef.current = setTimeout(() => {
      completeProgress();
    }, 8000);
  }, []);

  const completeProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    setProgress(100);

    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 300);
    }, 200);
  }, []);

  // Complete progress whenever the pathname changes
  useEffect(() => {
    completeProgress();
  }, [pathname, completeProgress]);

  // Intercept anchor clicks and programmatic navigation
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      // Ignore modified clicks (Ctrl, Cmd, Shift, Alt) or non-primary mouse button
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // Ignore empty, javascript:, mailto:, tel:, or hash-only links (#, #features, etc.)
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return;
      }

      // Ignore links opening in new tab
      if (anchor.target && anchor.target !== '_self') return;

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Ignore external links
        if (targetUrl.origin !== currentUrl.origin) return;

        // Ignore same page & same search query navigation
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search
        ) {
          return;
        }

        // Real route transition beginning
        startProgress();
      } catch {
        // Ignore invalid URLs
      }
    };

    // Patch history.pushState & replaceState to catch router.push calls
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const targetPath = args[2];
      if (targetPath) {
        try {
          const targetUrl = new URL(targetPath.toString(), window.location.href);
          const currentUrl = new URL(window.location.href);
          if (
            targetUrl.pathname !== currentUrl.pathname ||
            targetUrl.search !== currentUrl.search
          ) {
            setTimeout(() => {
              startProgress();
            }, 0);
          }
        } catch {}
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener('click', handleAnchorClick, { capture: true });
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [startProgress]);

  if (!visible && progress === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #c0c1ff 0%, #d0bcff 60%, #4edea3 100%)',
          boxShadow: '0 0 12px rgba(192, 193, 255, 0.8), 0 0 6px rgba(78, 222, 163, 0.6)',
          transition: progress === 100 ? 'width 150ms ease-out' : 'width 120ms ease-in-out',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  );
}
