'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { ReactNode, useState } from 'react';

interface TeacherLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs: { label: string; href?: string }[];
}

const navigationItems = [
  {
    label: '生徒管理',
    icon: Users,
  },
  {
    label: '論題管理',
    icon: Settings,
  },
  {
    label: 'クラス管理',
    icon: Users,
  },
  {
    label: '進捗ダッシュボード',
    icon: LayoutDashboard,
  },
  {
    label: 'ランキング設定',
    icon: Settings,
  },
];

export const TeacherLayout = ({
  children,
  title,
  breadcrumbs,
}: TeacherLayoutProps) => {
  const [isSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* ヘッダー */}
      <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>

          {/* ブレッドクラム - モバイルでは非表示 */}
          <div className="hidden items-center space-x-2 md:flex">
            {breadcrumbs.map((item, index) => (
              <div key={`${item.label}`} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                )}
                {item.href ? (
                  <p className="text-sm text-gray-600 hover:text-gray-900">
                    {item.label}
                  </p>
                ) : (
                  <span className="text-sm text-gray-900">{item.label}</span>
                )}
              </div>
            ))}
          </div>

          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline">ログアウト</span>
          </button>
        </div>
      </header>

      {/* サイドバー - デスクトップ */}
      <div
        className={`fixed bottom-0 left-0 top-16 z-20 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-64'
          } hidden lg:block`}
      >
        <nav className="space-y-2 p-4">
          {navigationItems.map((item) => (
            <p
              key={item.label}
              className="flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors duration-200"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </p>
          ))}
        </nav>
      </div>

      {/* モバイルメニュー */}

      {isMobileMenuOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed bottom-0 left-0 top-16 z-50 w-64 bg-white lg:hidden"
          >
            <nav className="space-y-2 p-4">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors duration-200"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>
        </AnimatePresence>
      )}

      {/* メインコンテンツ */}
      <main
        className={`w-full pt-16 transition-all duration-300 ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        <div className="mx-auto w-full  p-6">
          {/* モバイル用ブレッドクラム */}
          <div className="mb-6 md:hidden">
            <div className="scrollbar-hide flex items-center space-x-2 overflow-x-auto">
              {breadcrumbs.map((item, index) => (
                <div
                  key={item.label}
                  className="flex items-center whitespace-nowrap"
                >
                  {index > 0 && (
                    <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
                  )}
                  {item.href ? (
                    <p className="text-sm text-gray-600 hover:text-gray-900">
                      {item.label}
                    </p>
                  ) : (
                    <span className="text-sm text-gray-900">{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
};
