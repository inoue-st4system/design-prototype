/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-plusplus */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable no-return-assign */
/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/no-array-index-key */
import {
  RefreshCw,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import React, { useState, FC, memo, useCallback } from 'react';

import { TeacherLayout } from '@/samples/debatespeech/components/TeacherLayout';

// === 型定義 ===
interface RankingStudentData {
  rank: number;
  name: string;
  score: number;
  class: string;
}

interface RankingData {
  id: string; // ランキングを一意に識別するID
  title: string;
  period: string; // 例: 'YYYY-MM-DD〜YYYY-MM-DD'
  target: string; // クラス名
  lastUpdated: string; // 例: '2025/10/28 00:00 JST'
  rankingData: RankingStudentData[];
}

// === データモック ===
const MOCK_CLASSES: string[] = ['1年A組', '1年B組', '2年A組', '3年C組'];
const STUDENT_COUNT = 200; // 全生徒数（クラスのメンバー数として利用）

// 生徒データ生成関数（200名）
const generateMockStudents = (
  className: string,
  count: number = STUDENT_COUNT,
): RankingStudentData[] => {
  const students: RankingStudentData[] = [];
  for (let i = 0; i < count; i++) {
    students.push({
      rank: i + 1,
      name: `生徒 ${String(i + 1).padStart(3, '0')}号`,
      score: Math.floor(Math.random() * 5000) + 1000,
      class: className,
    });
  }
  // スコアでソートし、ランキングを再割り当て
  students.sort((a, b) => b.score - a.score);
  students.forEach((s, index) => (s.rank = index + 1));
  return students;
};

// 日付ヘルパー
const today: Date = new Date();
today.setHours(0, 0, 0, 0);

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const dateAfterDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

// === 初期ダミーデータ (既に作成されたランキングを想定) ===
const initialRankings: RankingData[] = [
  {
    id: '1A-current',
    title: '1年A組 ランキング',
    period: `${formatDate(today)}〜${formatDate(dateAfterDays(today, 13))}`, // 期間内
    target: '1年A組',
    lastUpdated: `${new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })} JST`,
    rankingData: generateMockStudents('1年A組', STUDENT_COUNT),
  },
  {
    id: '1B-expired',
    title: '1年B組 ランキング',
    period: '2025-09-01〜2025-09-30', // 期間終了
    target: '1年B組',
    lastUpdated: '2025/09/30 00:00 JST',
    rankingData: generateMockStudents('1年B組', STUDENT_COUNT),
  },
  {
    id: '2A-current',
    title: '2年A組 ランキング',
    period: `${formatDate(today)}〜${formatDate(dateAfterDays(today, 6))}`, // 期間内
    target: '2年A組',
    lastUpdated: `${new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })} JST`,
    rankingData: generateMockStudents('2年A組', STUDENT_COUNT),
  },
];

// === コンポーネント: ランキング設定フォーム (上部左側) ===
interface CustomRankingFormProps {
  addOrUpdateRanking: (newRanking: RankingData) => void;
}

const CustomRankingForm: FC<CustomRankingFormProps> = memo(
  ({ addOrUpdateRanking }) => {
    const [startDate, setStartDate] = useState<string>(formatDate(today));
    const [endDate, setEndDate] = useState<string>(
      formatDate(dateAfterDays(today, 6)),
    ); // 7日間
    const [selectedClass, setSelectedClass] = useState<string>(MOCK_CLASSES[0]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // プリセット期間を設定するハンドラ
    const setPreset = useCallback((days: number) => {
      // daysは期間の日数。endDateは days - 1 日後となる
      const newEndDate: Date = dateAfterDays(today, days - 1);
      setStartDate(formatDate(today));
      setEndDate(formatDate(newEndDate));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      const rankingId = `${selectedClass}-${Date.now()}`; // IDは作成時刻でユニークにする

      const newRanking: RankingData = {
        id: rankingId,
        title: `${selectedClass} ランキング`,
        period: `${startDate}〜${endDate}`,
        target: selectedClass,
        lastUpdated: `${new Date().toLocaleString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })} JST`,
        rankingData: generateMockStudents(selectedClass, STUDENT_COUNT), // 200名生成
      };

      setTimeout(() => {
        addOrUpdateRanking(newRanking);
        setIsLoading(false);
        console.log('カスタムランキングが作成/更新されました！', newRanking);
      }, 1500);
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 h-full">
        <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-slate-800" />
          カスタムランキングの作成・更新
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 期間設定 (プリセット & 自由入力) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              集計期間を設定 (最長1年)
            </label>
            <div className="flex space-x-2 mb-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setPreset(7)}
                // 修正: slate-50 -> slate-100/slate-800へ変更
                className="px-3 py-1 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                1週間 (本日から)
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                // 修正: slate-50 -> slate-100/slate-800へ変更
                className="px-3 py-1 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                1か月 (本日から)
              </button>
              <button
                type="button"
                onClick={() => setPreset(90)}
                // 修正: slate-50 -> slate-100/slate-800へ変更
                className="px-3 py-1 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                3か月 (本日から)
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                // 修正: focus:ring-slate-500 -> focus:ring-slate-800
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
              />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                // 修正: focus:ring-slate-500 -> focus:ring-slate-800
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
              />
            </div>
          </div>

          {/* 対象クラス設定 */}
          <div className="space-y-2">
            <label
              htmlFor="targetClass"
              className="block text-sm font-medium text-gray-700"
            >
              対象クラス
            </label>
            <select
              id="targetClass"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              // 修正: focus:ring-slate-500 -> focus:ring-slate-800
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
            >
              {MOCK_CLASSES.map((cls: string) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* ランキング集計ボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-lg font-semibold text-white transition duration-200 shadow-md ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : // 修正: bg-slate-600 -> bg-slate-800, hover:bg-slate-700 -> hover:bg-slate-900
                  'bg-slate-800 hover:bg-slate-900 shadow-slate-300/50'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                集計中...
              </span>
            ) : (
              'ランキングを集計する'
            )}
          </button>
          <p className="text-xs text-center text-gray-500">
            同じクラスを再集計すると、前回のランキングは上書きされます。
          </p>
        </form>
      </div>
    );
  },
);

// === コンポーネント: 個別ランキングカード表示 (下部グリッド用) ===
interface RankingCardProps {
  ranking: RankingData;
  onDelete: (id: string) => void;
  onView: (ranking: RankingData) => void;
  isSelected: boolean;
}

const RankingCard: FC<RankingCardProps> = memo(
  ({ ranking, onDelete, onView, isSelected }) => {
    const endDateStr: string = ranking.period.split('〜')[1];
    const endDate: Date = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);

    const isPeriodActive: boolean = endDate >= today;

    return (
      <div
        className={`bg-white p-4 rounded-xl shadow-md border-2 cursor-pointer transition duration-150 ease-in-out
                  ${
                    isSelected
                      ? // 修正: 選択時のボーダーとリングをslate-800ベースに変更
                        'border-slate-800 ring-2 ring-slate-300'
                      : 'border-gray-200 hover:border-slate-400'
                  }`}
        onClick={() => onView(ranking)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-base text-gray-800 flex items-center">
            {/* 修正: アイコンカラーをslate-600 -> slate-800 */}
            <TrendingUp className="w-4 h-4 mr-1 text-slate-800" />
            {ranking.title}
          </h4>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPeriodActive
                ? 'bg-green-200 text-green-800'
                : 'bg-gray-300 text-gray-700'
            }`}
          >
            {isPeriodActive ? '期間内' : '期間終了'}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1 border-t pt-2 mt-2">
          <p className="flex items-center">
            <Users className="w-3 h-3 mr-1 text-gray-500" /> 対象:{' '}
            {ranking.target} (全{ranking.rankingData.length}名)
          </p>
          <p className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-gray-500" /> 期間:{' '}
            {ranking.period}
          </p>
          <p className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-gray-500" /> 最終更新:{' '}
            {ranking.lastUpdated.split(' ')[0]}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(ranking.id);
            }}
            className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition"
            title="ランキングを削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
);

// === コンポーネント: 現在表示中のランキング詳細 (上部右側) ===
interface CurrentRankingDetailProps {
  ranking: RankingData | null;
}

const CurrentRankingDetail: FC<CurrentRankingDetailProps> = memo(
  ({ ranking }) => {
    if (!ranking) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex items-center justify-center text-gray-500 italic">
          表示するランキングがありません。下のリストから選択するか、新しく作成してください。
        </div>
      );
    }

    const endDateStr: string = ranking.period.split('〜')[1];
    const endDate: Date = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);
    const isPeriodActive: boolean = endDate >= today;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-full">
        <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center">
          {/* 修正: アイコンカラーをslate-600 -> slate-800 */}
          <TrendingUp className="w-5 h-5 mr-2 text-slate-800" />
          ランキング詳細
        </h3>

        <div
          className={`p-4 rounded-lg mb-4 ${
            isPeriodActive
              ? 'bg-green-50 border border-green-200'
              : 'bg-gray-100 border border-gray-300'
          }`}
        >
          <h4 className="font-bold text-lg text-slate-700 mb-1">
            {ranking.title}
          </h4>
          <p className="flex items-center mt-1 text-xs font-medium">
            <Users className="w-3 h-3 mr-1 text-gray-500" /> 対象:{' '}
            {ranking.target} (全{ranking.rankingData.length}名)
          </p>
          <p className="flex items-center mt-1 text-xs font-medium">
            <Calendar className="w-3 h-3 mr-1 text-gray-500" /> 期間:{' '}
            {ranking.period}
          </p>
          <p
            className={`mt-1 text-xs font-medium ${
              isPeriodActive ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            <Clock className="w-3 h-3 mr-1 inline-block" />
            最終更新: {ranking.lastUpdated.split(' ')[0]}
          </p>
        </div>

        {/* ランキング詳細テーブル (全生徒表示) */}
        <h4 className="font-bold text-gray-700 mb-3">
          ランキングリスト (1位〜{ranking.rankingData.length}位)
        </h4>
        {/* 修正: リスト背景色を slate-50 -> slate-100、ボーダー/テキストをslate-800ベースに変更 */}
        <div className="bg-slate-100 px-3 rounded-lg max-h-80 overflow-y-auto shadow-inner">
          {/* ランキングヘッダー */}
          <div className="flex text-xs font-bold text-slate-800 border-b border-slate-400 pb-2 mb-1 sticky top-0 bg-slate-100 z-10 pt-3">
            <span className="w-12 text-center">順位</span>
            <span className="w-16 text-center">クラス</span>
            <span className="flex-1 ml-2">生徒名</span>
            <span className="w-20 text-right">スコア</span>
          </div>

          {/* ランキングリスト本体 (スクロール可能) */}
          {ranking.rankingData.map((student: RankingStudentData) => (
            <div
              key={student.rank}
              className="flex items-center py-1 hover:bg-slate-200 transition duration-100 rounded-sm"
            >
              <span
                className={`w-12 text-center font-bold text-sm ${
                  student.rank <= 3 ? 'text-yellow-700' : 'text-gray-700'
                }`}
              >
                #{student.rank}
              </span>
              <span className="w-16 text-xs text-center text-gray-500">
                {student.class}
              </span>
              <span className="flex-1 ml-2 text-sm text-gray-700 truncate">
                {student.name}
              </span>
              <span className="w-20 text-right font-semibold text-sm text-slate-800">
                {student.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

// === メインコンポーネント: RankingSettings (TeacherLayoutに組み込む) ===
export const RankingSettings = memo(() => {
  // 複数のカスタムランキング状態を配列で保持 (ダミーデータで初期化)
  const [customRankings, setCustomRankings] =
    useState<RankingData[]>(initialRankings);
  // 現在詳細表示しているランキング (最初のダミーデータを初期表示)
  const [currentView, setCurrentView] = useState<RankingData | null>(
    initialRankings[0] || null,
  );

  // ランキングの追加または上書きロジック
  const addOrUpdateRanking = useCallback((newRanking: RankingData) => {
    setCustomRankings((prevRankings) => {
      // 同じクラスのランキングがあるかチェック (クラス名で上書き対象を判断)
      const existingIndex = prevRankings.findIndex(
        (r) => r.target === newRanking.target,
      );

      if (existingIndex !== -1) {
        // 既存のランキングを上書き (同じクラスを再集計した場合、前回は保持されない要件に対応)
        const updatedRankings = [...prevRankings];
        // ランキングIDを維持して上書き
        newRanking.id = updatedRankings[existingIndex].id;
        updatedRankings[existingIndex] = newRanking;
        setCurrentView(newRanking);
        return updatedRankings;
      }
      // 新しいランキングとして追加
      setCurrentView(newRanking);
      return [...prevRankings, newRanking];
    });
  }, []);

  // ランキング削除ロジック
  const deleteRanking = useCallback(
    (id: string) => {
      setCustomRankings((prevRankings) => {
        const filteredRankings = prevRankings.filter((r) => r.id !== id);
        if (currentView?.id === id) {
          // 削除したランキングが表示中の場合は、新しい先頭を表示するかクリアする
          setCurrentView(
            filteredRankings.length > 0 ? filteredRankings[0] : null,
          );
        }
        return filteredRankings;
      });
      console.log(`ランキングID: ${id} が削除されました。`);
    },
    [currentView],
  );

  return (
    <TeacherLayout
      title="ランキング設定"
      breadcrumbs={[{ label: 'ランキング設定', href: '/' }]}
    >
      {/* 外部Layoutのpaddingを打ち消し、全画面幅で背景色を設定するためのCSSを適用 */}
      <div className="min-h-screen bg-gray-50 font-['Inter'] p-4 pb-6 sm:p-8 -m-4 sm:-m-8">
        <div className="max-w-7xl mx-auto">
          {/* UPPER SECTION: Form (Left) & Detail View (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* --- 1. カスタムランキング設定フォーム --- */}
            <CustomRankingForm addOrUpdateRanking={addOrUpdateRanking} />

            {/* --- 2. 現在表示中のランキング詳細 --- */}
            <CurrentRankingDetail ranking={currentView} />
          </div>

          {/* LOWER SECTION: Created Rankings Card Grid (3 Columns) */}
          <section className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
              <Clock className="w-5 h-5 mr-2 inline-block text-slate-800" />
              作成済みランキング一覧
            </h3>
            {customRankings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customRankings.map((ranking) => (
                  <RankingCard
                    key={ranking.id}
                    ranking={ranking}
                    onDelete={deleteRanking}
                    onView={setCurrentView}
                    isSelected={currentView?.id === ranking.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 italic bg-white rounded-xl shadow-lg border border-gray-200">
                まだカスタムランキングがありません。フォームから新しいランキングを作成してください。
              </div>
            )}
          </section>
        </div>
      </div>
    </TeacherLayout>
  );
});
