/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
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
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useState, FC, memo, useCallback, useMemo } from 'react';

// TeacherLayoutのインポートはコメントアウトしていますが、Canvas環境で動作させるために仮の型を定義します。
import { TeacherLayout } from '@/samples/debatespeech/components/TeacherLayout';

// === 型定義 ===
/** 生徒一人当たりのランキングデータ */
interface RankingStudentData {
  rank: number;
  name: string;
  nickname: string; // ニックネーム
  score: number; // Logic Training のポイント
  maxScore: number; // Debate の最高スコア
  class: string;
  grade: number;
}

/** ランキングの種別 (表示用フィルタ) */
type RankingType = 'logic' | 'debate';

/** フィルタータイプ */
type FilterType = 'all' | 'grade' | 'class';

/** 作成されたランキング全体の設定データ */
interface RankingData {
  id: string; // ランキングを一意に識別するID
  title: string;
  period: string; // 例: 'YYYY-MM-DD〜YYYY-MM-DD'
  target: string; // クラス名 ('全校生徒' または特定のクラス名)
  rankingData: RankingStudentData[];
  // isAutomaticがtrueの場合のみtypeを使用する想定
  type?: RankingType;
  isAutomatic: boolean; // true: Weekly/Monthly, false: Custom
}

/** SegmentedControlのタブアイテムの型 */
interface TabItem {
  id: string;
  label: string;
}

// === データモック ===
const MOCK_CLASSES: string[] = ['1年A組', '1年B組', '2年A組', '2年C組'];
const MOCK_GRADES: number[] = [1, 2, 3];
const STUDENT_COUNT = 200; // 全生徒数（クラスのメンバー数として利用）

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

/**
 * 今週の集計期間（月曜〜日曜）を計算する
 * @returns { period: string, start: Date, end: Date }
 */
const getWeeklyPeriod = () => {
  const currentDayOfWeek = today.getDay(); // 0:日, 1:月, ..., 6:土
  const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  const startOfWeek = dateAfterDays(today, -daysSinceMonday);
  const endOfWeek = dateAfterDays(startOfWeek, 6);

  return {
    period: `${formatDate(startOfWeek)}〜${formatDate(endOfWeek)}`,
    start: startOfWeek,
    end: endOfWeek,
  };
};

/**
 * 今月の集計期間（1日〜月末）を計算する
 * @returns { period: string, start: Date, end: Date }
 */
const getMonthlyPeriod = () => {
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    period: `${formatDate(startOfMonth)}〜${formatDate(endOfMonth)}`,
    start: startOfMonth,
    end: endOfMonth,
  };
};

// 生徒データ生成関数（200名）
const generateMockStudents = (
  className: string,
  count: number = STUDENT_COUNT,
): RankingStudentData[] => {
  const students: RankingStudentData[] = [];
  for (let i = 0; i < count; i++) {
    const score = Math.floor(Math.random() * 5000) + 1000;
    const maxScore = Math.floor(Math.random() * 100) + 70; // 70-170点の範囲
    students.push({
      rank: i + 1, // 初期ランクは適当
      name: `生徒 ${String(i + 1).padStart(3, '0')}号`,
      nickname: `Nemo${String(i + 1).padStart(3, '0')}`,
      score, // Logic Training Point
      maxScore, // Debate Max Score
      class: className,
      grade: parseInt(className.charAt(0), 10), // クラス名の最初の文字から学年を取得
    });
  }
  // Logic Training Scoreでソート
  students.sort((a, b) => b.score - a.score);
  students.forEach((s, index) => (s.rank = index + 1));
  return students;
};

// === 初期ダミーデータ (カスタム期間として修正) ===
const initialRankings: Omit<RankingData, 'type' | 'isAutomatic'>[] = [
  {
    id: '1A-initial', // IDを修正
    title: '1年A組 ランキング',
    period: `${formatDate(today)}〜${formatDate(dateAfterDays(today, 6))}`, // 7日間
    target: '1年A組',
    rankingData: generateMockStudents('1年A組', STUDENT_COUNT),
  },
  {
    id: '1B-initial', // IDを修正
    title: '1年B組 ランキング',
    period: '2025-09-01〜2025-09-30', // 期間終了
    target: '1年B組',
    rankingData: generateMockStudents('1年B組', STUDENT_COUNT),
  },
];

// === SegmentedControlコンポーネント ===

const SegmentedControl: FC<{
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = memo(({ tabs, activeTab, onTabChange }) => {
  const baseClasses = 'bg-white border border-gray-200 text-gray-700 shadow-sm';
  const activeClasses = 'bg-slate-800 text-white font-semibold shadow-md';
  const hoverClasses = 'hover:bg-gray-100';
  const inactiveTextClasses = 'text-gray-700';

  return (
    <div className={`flex items-center rounded-lg p-1 ${baseClasses}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2 rounded-md transition-colors duration-200 text-sm whitespace-nowrap
            ${
              activeTab === tab.id
                ? activeClasses
                : `${hoverClasses} ${inactiveTextClasses}`
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});

// === コンポーネント: ランキング設定フォーム (上部左側) ===
interface CustomRankingFormProps {
  addOrUpdateRanking: (newRanking: RankingData) => void;
}

const CustomRankingForm: FC<CustomRankingFormProps> = memo(
  ({ addOrUpdateRanking }) => {
    // 画面を開いたときにデフォルトで本日〜7日間が設定されている挙動
    const [startDate, setStartDate] = useState<string>(formatDate(today));
    const [endDate, setEndDate] = useState<string>(
      formatDate(dateAfterDays(today, 6)),
    );
    const [selectedClass, setSelectedClass] = useState<string>(MOCK_CLASSES[0]);

    // **要件変更: カスタムランキング作成時に種別は選択しない**
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // プリセット期間を設定するハンドラ
    // ユーザーが設定した開始日を基準に終了日を設定する
    const setPreset = useCallback(
      (days: number) => {
        // startDateはユーザーが入力した値、それをDateオブジェクトに変換
        const baseDate: Date = new Date(startDate);
        // daysは期間の日数。endDateは days - 1 日後となる
        const newEndDate: Date = dateAfterDays(baseDate, days - 1);
        setEndDate(formatDate(newEndDate));
      },
      [startDate],
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      const rankingId = `${selectedClass}-custom-${Date.now()}`;

      const newRanking: RankingData = {
        id: rankingId,
        // **タイトル修正:** 【カスタム】X年X組 ランキング
        title: `${selectedClass} ランキング`,
        period: `${startDate}〜${endDate}`,
        target: selectedClass,
        rankingData: generateMockStudents(selectedClass, STUDENT_COUNT), // 200名生成
        isAutomatic: false, // カスタム期間
        // type: undefined (カスタムランキングには型を持たせない)
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
          カスタム期間ランキングの作成・更新
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 期間設定 (プリセット & 自由入力) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              集計期間を設定 (最長1年)
            </label>
            <div className="flex items-center space-x-3 mb-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
              />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
              />
            </div>
            {/* プリセットボタン: 開始日を基準に終了日を設定 */}
            <div className="flex space-x-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setPreset(7)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                1週間
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                1か月
              </button>
              <button
                type="button"
                onClick={() => setPreset(90)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
              >
                3か月
              </button>
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
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-300/50'
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

// === コンポーネント: 個別ランキングカード表示 ===
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

    // 自動更新かどうかでタイトルとアイコンを調整
    const titlePrefix = ranking.isAutomatic
      ? ranking.id.includes('weekly')
        ? '【毎週】'
        : '【毎月】'
      : '【カスタム】';
    const cardIcon = ranking.isAutomatic ? (
      <Clock className="w-4 h-4 mr-1 text-slate-800" />
    ) : (
      <TrendingUp className="w-4 h-4 mr-1 text-slate-800" />
    );
    const targetLabel =
      ranking.target === '全校生徒' ? '全校生徒' : ranking.target;

    // カスタム期間のみ削除ボタンを表示
    const showDelete = !ranking.isAutomatic;

    // **自動ランキングの場合、期間ラベルを非表示にする**
    const showPeriodLabel = !ranking.isAutomatic;

    return (
      <div
        className={`bg-white p-4 rounded-xl shadow-md border-2 cursor-pointer transition duration-150 ease-in-out
                  ${
                    isSelected
                      ? 'border-slate-800 ring-2 ring-slate-300'
                      : 'border-gray-200 hover:border-slate-400'
                  }`}
        onClick={() => onView(ranking)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-base text-gray-800 flex items-center">
            {cardIcon}
            {/* タイトルは既に所定の形式で設定されているため、そのまま表示 */}
            {titlePrefix}
            {ranking.title}
          </h4>
          {showPeriodLabel && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isPeriodActive
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {isPeriodActive ? '期間内' : '期間終了'}
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1 border-t pt-2 mt-2">
          <p className="flex items-center">
            <Users className="w-3 h-3 mr-1 text-gray-500" /> 対象: {targetLabel}{' '}
            (全{ranking.rankingData.length}名)
          </p>
          <p className="flex items-center">
            <Calendar className="w-3 h-3 mr-1 text-gray-500" /> 期間:{' '}
            {ranking.period}
          </p>
        </div>

        {showDelete && (
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
        )}
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
    // 画面切り替え用の状態
    const [currentViewType, setCurrentViewType] =
      useState<RankingType>('logic');

    // フィルター関連の状態（自動更新ランキングの場合のみ使用）
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedGrade, setSelectedGrade] = useState<number>(MOCK_GRADES[0]);
    const [selectedClass, setSelectedClass] = useState<string>(MOCK_CLASSES[0]);

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

    // フィルタリングされたデータを取得
    const filteredData = useMemo(() => {
      if (!ranking.isAutomatic) {
        // カスタムランキングの場合はフィルタリングしない
        return ranking.rankingData;
      }

      // 自動更新ランキングの場合のみフィルタリング
      switch (filterType) {
        case 'grade':
          return ranking.rankingData.filter((s) => s.grade === selectedGrade);
        case 'class':
          return ranking.rankingData.filter((s) => s.class === selectedClass);
        case 'all':
        default:
          return ranking.rankingData;
      }
    }, [
      ranking.rankingData,
      ranking.isAutomatic,
      filterType,
      selectedGrade,
      selectedClass,
    ]);

    // 現在表示中の種別に基づいてソートされたデータ
    const sortedRankingData = useMemo(() => {
      return [...filteredData]
        .sort((a, b) => {
          if (currentViewType === 'logic') {
            return b.score - a.score;
          }
          return b.maxScore - a.maxScore;
        })
        .map((student, index) => ({
          ...student,
          // ランキング種別によって順位を再計算
          rank: index + 1,
          // 表示するスコアを決定
          displayScore:
            currentViewType === 'logic' ? student.score : student.maxScore,
        }));
    }, [filteredData, currentViewType]);

    const scoreLabel =
      currentViewType === 'logic' ? '評価ポイント' : '最高スコア';

    // フィルター適用後の対象ラベル
    const getTargetLabel = () => {
      if (!ranking.isAutomatic) {
        return ranking.target === '全校生徒' ? '全校生徒' : ranking.target;
      }

      switch (filterType) {
        case 'grade':
          return `${selectedGrade}年生`;
        case 'class':
          return selectedClass;
        case 'all':
        default:
          return '全校生徒';
      }
    };

    const targetLabel = getTargetLabel();

    const titlePrefix = ranking.isAutomatic
      ? ranking.id.includes('weekly')
        ? '【毎週】'
        : '【毎月】'
      : '【カスタム】';

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 h-full">
        <h3 className="text-xl font-bold text-gray-700 mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-slate-800" />
          ランキング詳細
        </h3>

        <div
          className={`p-4 rounded-lg mb-4 ${
            isPeriodActive && !ranking.isAutomatic
              ? 'bg-green-50 border border-green-200'
              : 'bg-gray-100 border border-gray-300'
          }`}
        >
          <h4 className="font-bold text-lg text-slate-700 mb-1">
            {titlePrefix}
            {ranking.title}
          </h4>
          <p className="flex items-center mt-1 text-xs font-medium">
            <Users className="w-3 h-3 mr-1 text-gray-500" /> 対象: {targetLabel}{' '}
            (全{sortedRankingData.length}名)
          </p>
          <p className="flex items-center mt-1 text-xs font-medium">
            <Calendar className="w-3 h-3 mr-1 text-gray-500" /> 期間:{' '}
            {ranking.period}
          </p>
        </div>

        {/* 自動更新ランキングの場合のみフィルターとランキング種別タブを表示 */}
        {ranking.isAutomatic && (
          <div className="mb-4">
            {/* 上段: 全体・学年・クラスタブ + 集計期間 */}
            <div className="flex items-center justify-between mb-4">
              <SegmentedControl
                tabs={[
                  { id: 'all', label: '全体' },
                  { id: 'grade', label: '学年' },
                  { id: 'class', label: 'クラス' },
                ]}
                activeTab={filterType}
                onTabChange={(tabId) => setFilterType(tabId as FilterType)}
              />

              <div>
                {/* 学年選択 */}
                {filterType === 'grade' && (
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(Number(e.target.value))}
                    className="p-2 text-sm border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
                  >
                    {MOCK_GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}年
                      </option>
                    ))}
                  </select>
                )}

                {/* クラス選択 */}
                {filterType === 'class' && (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="p-2 text-sm border border-gray-300 rounded-lg focus:ring-slate-800 focus:border-slate-800"
                  >
                    {MOCK_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* 下段: Logic Training / Debate タブ */}
            <div className="mb-3">
              <SegmentedControl
                tabs={[
                  { id: 'logic', label: 'Logic Training' },
                  { id: 'debate', label: 'Debate' },
                ]}
                activeTab={currentViewType}
                onTabChange={(tabId) =>
                  setCurrentViewType(tabId as RankingType)
                }
              />
            </div>
          </div>
        )}

        {/* カスタムランキングの場合は従来通りのタブ表示 */}
        {!ranking.isAutomatic && (
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-bold text-gray-700">ランキングリスト</h4>
            <SegmentedControl
              tabs={[
                { id: 'logic', label: 'Logic Training' },
                { id: 'debate', label: 'Debate' },
              ]}
              activeTab={currentViewType}
              onTabChange={(tabId) => setCurrentViewType(tabId as RankingType)}
            />
          </div>
        )}

        <div className="bg-slate-100 px-3 rounded-lg max-h-80 overflow-y-auto shadow-inner">
          {/* ランキングヘッダー */}
          <div className="grid grid-cols-[3rem_1fr_1fr_3rem_1fr_1fr] gap-2 text-xs font-bold text-slate-800 border-b border-slate-400 pb-2 mb-1 sticky top-0 bg-slate-100 z-10 pt-3">
            <span className="text-center">順位</span>
            <span className="text-left">名前</span>
            <span className="text-left">ニックネーム</span>
            <span className="text-center">学年</span>
            <span className="text-center">クラス</span>
            <span className="text-right">{scoreLabel}</span>
          </div>

          {/* ランキングリスト本体 (スクロール可能) */}
          {sortedRankingData.map((student) => (
            <div
              key={`${student.name}-${student.rank}`}
              className="grid grid-cols-[3rem_1fr_1fr_3rem_1fr_1fr] gap-2 items-center py-1 hover:bg-slate-200 transition duration-100 rounded-sm"
            >
              <span
                className={`text-center font-bold text-sm ${
                  student.rank <= 3 ? 'text-yellow-700' : 'text-gray-700'
                }`}
              >
                #{student.rank}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {student.name}
              </span>
              <span className="text-sm text-gray-500 truncate">
                {student.nickname}
              </span>
              <span className="text-center text-xs text-gray-500">
                {student.grade}年
              </span>
              <span className="text-center text-xs text-gray-500">
                {student.class}
              </span>
              <span className="text-right font-semibold text-sm text-slate-800">
                {student.displayScore.toLocaleString()}
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
  // 週間・月間ランキングの期間を計算
  const weeklyPeriod = getWeeklyPeriod();
  const monthlyPeriod = getMonthlyPeriod();

  // デフォルトの自動ランキングデータ生成（Weekly/Monthly）
  const getAutomaticRankings = useCallback(() => {
    // 全校生徒のダミーデータ（集計対象が「全校生徒」であるため）
    const allStudents = MOCK_CLASSES.flatMap((cls) =>
      generateMockStudents(cls, STUDENT_COUNT / MOCK_CLASSES.length),
    );

    const weeklyLogic: RankingData = {
      id: 'auto-weekly',
      // **タイトル修正:** 【毎週】ランキング
      title: 'ランキング',
      period: weeklyPeriod.period,
      target: '全校生徒',
      rankingData: [...allStudents].sort((a, b) => b.score - a.score),
      type: 'logic', // 自動更新ランキングは種別を持つ
      isAutomatic: true,
    };
    // Monthly Debate
    const monthlyDebate: RankingData = {
      id: 'auto-monthly',
      // **タイトル修正:** 【毎月】ランキング
      title: 'ランキング',
      period: monthlyPeriod.period,
      target: '全校生徒',
      rankingData: [...allStudents].sort((a, b) => b.maxScore - a.maxScore),
      type: 'debate', // 自動更新ランキングは種別を持つ
      isAutomatic: true,
    };

    return [weeklyLogic, monthlyDebate];
  }, [monthlyPeriod.period, weeklyPeriod.period]);

  // 既存のカスタムランキングデータ（初期値はisAutomatic: falseを設定）
  const initialCustomRankings: RankingData[] = [
    ...initialRankings.map((r) => ({ ...r, isAutomatic: false })),
  ];

  const [customRankings, setCustomRankings] = useState<RankingData[]>(
    initialCustomRankings,
  );

  // 自動ランキングを取得
  const automaticRankings = useMemo(
    () => getAutomaticRankings(),
    [getAutomaticRankings],
  );

  // 現在詳細表示しているランキング (最初はWeekly Logicを初期表示)
  const [currentView, setCurrentView] = useState<RankingData | null>(
    automaticRankings.find((r) => r.id === 'auto-weekly') ||
      automaticRankings[0] ||
      null,
  );

  // currentViewが削除された場合の処理
  React.useEffect(() => {
    if (currentView) {
      const allRankings = [...automaticRankings, ...customRankings];
      if (!allRankings.find((r) => r.id === currentView.id)) {
        setCurrentView(allRankings[0] || null);
      }
    }
  }, [automaticRankings, customRankings, currentView]);

  // ランキングの追加または上書きロジック (カスタムランキングのみが対象)
  const addOrUpdateRanking = useCallback((newRanking: RankingData) => {
    setCustomRankings((prevRankings) => {
      // 同じクラスのカスタムランキングがあるかチェック (カスタムは種別を持たないためクラス名のみ)
      const existingIndex = prevRankings.findIndex(
        (r) => r.target === newRanking.target,
      );

      if (existingIndex !== -1) {
        // 既存のランキングを上書き
        const updatedRankings = [...prevRankings];
        newRanking.id = updatedRankings[existingIndex].id;
        // typeはカスタム期間では不要なので削除
        delete newRanking.type;
        updatedRankings[existingIndex] = newRanking;
        // 現在表示中のランキングが上書きされたランキングだった場合、表示を更新
        setCurrentView((v) => (v && v.id === newRanking.id ? newRanking : v));
        return updatedRankings;
      }
      // 新しいランキングとして追加
      setCurrentView(newRanking);
      return [...prevRankings, newRanking];
    });
  }, []);

  // ランキング削除ロジック (カスタムランキングのみが対象)
  const deleteRanking = useCallback((id: string) => {
    setCustomRankings((prevRankings) => {
      const filteredRankings = prevRankings.filter((r) => r.id !== id);
      return filteredRankings;
    });
    console.log(`ランキングID: ${id} が削除されました。`);
  }, []);

  return (
    <TeacherLayout
      title="ランキング設定"
      breadcrumbs={[{ label: 'ランキング設定', href: '/' }]}
    >
      {/* 外部Layoutのpaddingを打ち消し、全画面幅で背景色を設定するためのCSSを適用 */}
      <div className="min-h-screen bg-gray-50 font-sans p-4 pb-6 sm:p-8 -m-4 sm:-m-8">
        <div className="max-w-7xl mx-auto">
          {/* UPPER SECTION: Form (Left) & Detail View (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* --- 1. カスタムランキング設定フォーム --- */}
            <CustomRankingForm addOrUpdateRanking={addOrUpdateRanking} />

            {/* --- 2. 現在表示中のランキング詳細 --- */}
            <CurrentRankingDetail ranking={currentView} />
          </div>

          {/* AUTOMATIC RANKINGS SECTION: Weekly & Monthly Rankings */}
          <section className="mt-8 mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
              <Zap className="w-5 h-5 mr-2 inline-block text-amber-600" />
              自動更新ランキング
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              以下のランキングは自動で更新されます。集計ボタンを押す必要はありません。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {automaticRankings.map((ranking) => (
                <RankingCard
                  key={ranking.id}
                  ranking={ranking}
                  onDelete={deleteRanking}
                  onView={setCurrentView}
                  isSelected={currentView?.id === ranking.id}
                />
              ))}
            </div>
          </section>

          {/* CUSTOM RANKINGS SECTION */}
          <section className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
              <Clock className="w-5 h-5 mr-2 inline-block text-slate-800" />
              カスタム期間ランキング一覧
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
                カスタムランキングがまだありません。上のフォームから作成してください。
              </div>
            )}
          </section>
        </div>
      </div>
    </TeacherLayout>
  );
});
