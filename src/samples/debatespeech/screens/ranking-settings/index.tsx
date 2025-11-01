/* eslint-disable no-plusplus */
/* eslint-disable no-return-assign */
/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  RefreshCw,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import React, { useState, useMemo, FC, memo, useCallback } from 'react';

// ユーザー指定の外部コンポーネントをインポート
import { TeacherLayout } from '@/samples/debatespeech/components/TeacherLayout';

// === 型定義 ===
interface RankingStudentData {
  rank: number;
  name: string;
  score: number;
  class: string;
}

type RankingType = 'Custom';

interface RankingData {
  type: RankingType;
  title: string;
  period: string; // 例: 'YYYY-MM-DD - YYYY-MM-DD'
  target: string;
  isAuto: boolean; // カスタムでも期間内は自動更新される
  lastUpdated: string; // 例: '2025/10/28 00:00 JST'
  rankingData: RankingStudentData[];
}

// === データモック ===
const MOCK_CLASSES: string[] = ['1年A組', '1年B組', '2年A組', '3年C組'];
const STUDENT_COUNT = 200; // 全生徒数

// 新しい生徒データ生成関数（200名）
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

// 初期カスタムランキングデータ
const initialCustomRanking: RankingData = {
  type: 'Custom',
  title: 'カスタムランキング (初期表示)',
  period: '2025-10-01 - 2025-10-31',
  target: MOCK_CLASSES[0],
  isAuto: false,
  lastUpdated: '2025/11/01 10:00 JST',
  rankingData: generateMockStudents(MOCK_CLASSES[0], STUDENT_COUNT),
};

// 日付比較のために時刻をリセットした今日の日付
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

// === コンポーネント: ランキング設定フォーム ===
interface CustomRankingFormProps {
  updateRanking: (newRanking: RankingData) => void;
}

const CustomRankingForm: FC<CustomRankingFormProps> = memo(
  ({ updateRanking }) => {
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

      const newRanking: RankingData = {
        type: 'Custom',
        title: `カスタムランキング (${selectedClass})`,
        period: `${startDate} - ${endDate}`,
        target: selectedClass,
        isAuto: false, // カスタムは手動更新
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
        updateRanking(newRanking);
        setIsLoading(false);
        // NOTE: 本来はカスタムモーダルUIに置き換えるべき
        console.log('カスタムランキングが作成されました！', newRanking);
      }, 1500);
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
        <h3 className="text-xl font-bold text-slate-700 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          ランキング作成・更新
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
                className="px-3 py-1 text-sm rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                1週間 (本日から)
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                className="px-3 py-1 text-sm rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                1か月 (本日から)
              </button>
              <button
                type="button"
                onClick={() => setPreset(90)}
                className="px-3 py-1 text-sm rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
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
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-slate-500"
              />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-slate-500"
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-slate-500"
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
            // flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-700
            className={`w-full py-3 rounded-xl text-lg font-semibold text-white transition duration-200 shadow-md ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 shadow-slate-300/50'
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
            ボタンを押すと、現在のランキングは再計算され、上書きされます。
          </p>
        </form>
      </div>
    );
  },
);

// === コンポーネント: カスタムランキング表示 (フルリスト) ===
interface CustomRankingDisplayProps {
  ranking: RankingData;
}

const CustomRankingDisplay: FC<CustomRankingDisplayProps> = memo(
  ({ ranking }) => {
    const endDateStr: string = ranking.period.split(' - ')[1];
    const endDate: Date = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);

    const isPeriodActive: boolean = endDate >= today;

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div
          className={`p-4 border-b ${
            isPeriodActive ? 'bg-green-50' : 'bg-gray-100'
          }`}
        >
          <h4 className="font-bold text-lg flex items-center justify-between text-gray-800">
            <span className="text-gray-800 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-slate-600" />
              現在の公開ランキング
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPeriodActive
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {isPeriodActive ? '期間内' : '期間終了'}
            </span>
          </h4>
          <div className="mt-1 text-sm text-gray-600 space-y-1">
            <p className="flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-gray-500" /> 集計期間:{' '}
              {ranking.period}
            </p>
            <p className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-gray-500" /> 対象クラス:{' '}
              {ranking.target} (全{ranking.rankingData.length}名)
            </p>
          </div>
          <p
            className={`mt-2 text-xs font-medium ${
              isPeriodActive ? 'text-green-600' : 'text-gray-600'
            } flex items-center`}
          >
            <Clock className="w-3 h-3 mr-1" />
            最終更新: {ranking.lastUpdated}
            {isPeriodActive ? (
              <span className="ml-2 text-xs text-gray-500">
                (期間内のため毎日 0:00 JSTに自動更新)
              </span>
            ) : (
              <span className="ml-2 text-xs text-gray-500">
                (期間終了、手動更新があるまでこのランキングを保持)
              </span>
            )}
          </p>
        </div>

        {/* ランキング全生徒表示エリア (Scrollable) */}
        <div className="p-4">
          <h5 className="font-semibold text-gray-700 mb-2">
            ランキングリスト (1位〜{ranking.rankingData.length}位)
          </h5>

          {/* ランキングヘッダー */}
          <div className="flex text-xs font-bold text-gray-600 border-b border-gray-200 pb-2 mb-1 sticky top-0 bg-white z-10">
            <span className="w-12 text-center">順位</span>
            <span className="w-16 text-center">クラス</span>
            <span className="flex-1 ml-2">生徒名</span>
            <span className="w-20 text-right">スコア</span>
          </div>

          {/* ランキングリスト本体 (スクロール可能) */}
          <div className="max-h-96 overflow-y-auto">
            {ranking.rankingData.map(
              (student: RankingStudentData, index: number) => (
                <div
                  key={index}
                  className="flex items-center py-1.5 hover:bg-slate-50 transition duration-100 rounded-lg"
                >
                  <span
                    className={`w-12 text-center font-bold text-sm ${
                      student.rank <= 3 ? 'text-yellow-600' : 'text-gray-600'
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
                  <span className="w-20 text-right font-semibold text-sm text-slate-600">
                    {student.score.toLocaleString()}
                  </span>
                </div>
              ),
            )}
          </div>

          {ranking.rankingData.length === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-4">
              まだランキングデータがありません。ランキングを作成してください。
            </p>
          )}
        </div>
      </div>
    );
  },
);

// === メインコンポーネント: RankingSettings (TeacherLayoutに組み込む) ===
export const RankingSettings = memo(() => {
  // 単一のカスタムランキング状態を保持
  const [customRanking, setCustomRanking] =
    useState<RankingData>(initialCustomRanking);

  const updateCustomRanking = useCallback((newRanking: RankingData) => {
    setCustomRanking(newRanking);
  }, []);

  return (
    <TeacherLayout
      title="ランキング設定"
      breadcrumbs={[{ label: 'ランキング設定', href: '/' }]}
    >
      {/* 外部Layoutのpaddingを打ち消し、全画面幅で背景色を設定するためのCSSを適用 */}
      <div className="min-h-screen bg-gray-50 font-['Inter'] p-4 sm:p-8 -m-4 sm:-m-8">
        <div className="max-w-6xl mx-auto">
          {/* --- 1. カスタムランキング設定フォーム --- */}
          <section className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CustomRankingForm updateRanking={updateCustomRanking} />

            {/* --- 2. 既存ランキング一覧 --- */}
            <CustomRankingDisplay ranking={customRanking} />
          </section>
        </div>
      </div>
    </TeacherLayout>
  );
});
