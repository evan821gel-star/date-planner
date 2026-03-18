'use client';

import { useEffect, useMemo, useState } from 'react';
import { JapanMap } from 'japanmap';

type Place = {
  id: number;
  name: string;
  url: string | null;
  imageUrl: string | null;
  memo: string | null;
  prefecture: string | null;
  visited: boolean;
  visitedAt: string | null;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
  };
};

type PlanItem = {
  id: number;
  order: number;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  title: string | null;
  kind: 'PLACE' | 'CUSTOM';
  place: Place | null;
};

type PlanDay = {
  id: number;
  title: string;
  date: string;
  items: PlanItem[];
};

type PlanDaySummary = {
  id: number;
  title: string;
  date: string;
};

type User = {
  id: number;
  name: string;
};

type Post = {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
  };
  comments?: Comment[];
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
  };
};

const createdAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const monthLabelFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
});

const shortDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
});

const prefectureCodeMap: Record<string, string> = {
  北海道: 'JP01',
  青森県: 'JP02',
  岩手県: 'JP03',
  宮城県: 'JP04',
  秋田県: 'JP05',
  山形県: 'JP06',
  福島県: 'JP07',
  茨城県: 'JP08',
  栃木県: 'JP09',
  群馬県: 'JP10',
  埼玉県: 'JP11',
  千葉県: 'JP12',
  東京都: 'JP13',
  神奈川県: 'JP14',
  新潟県: 'JP15',
  富山県: 'JP16',
  石川県: 'JP17',
  福井県: 'JP18',
  山梨県: 'JP19',
  長野県: 'JP20',
  岐阜県: 'JP21',
  静岡県: 'JP22',
  愛知県: 'JP23',
  三重県: 'JP24',
  滋賀県: 'JP25',
  京都府: 'JP26',
  大阪府: 'JP27',
  兵庫県: 'JP28',
  奈良県: 'JP29',
  和歌山県: 'JP30',
  鳥取県: 'JP31',
  島根県: 'JP32',
  岡山県: 'JP33',
  広島県: 'JP34',
  山口県: 'JP35',
  徳島県: 'JP36',
  香川県: 'JP37',
  愛媛県: 'JP38',
  高知県: 'JP39',
  福岡県: 'JP40',
  佐賀県: 'JP41',
  長崎県: 'JP42',
  熊本県: 'JP43',
  大分県: 'JP44',
  宮崎県: 'JP45',
  鹿児島県: 'JP46',
  沖縄県: 'JP47',
};

const prefectureList = Object.entries(prefectureCodeMap).map(([name, id]) => ({
  name,
  id,
}));

const regionMap: Record<string, string[]> = {
  北海道: ['北海道'],
  東北: ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  関東: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  中部: [
    '新潟県',
    '富山県',
    '石川県',
    '福井県',
    '山梨県',
    '長野県',
    '岐阜県',
    '静岡県',
    '愛知県',
  ],
  近畿: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  中国: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  四国: ['徳島県', '香川県', '愛媛県', '高知県'],
  九州: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'],
  沖縄: ['沖縄県'],
};

const regionOptions = ['すべて', ...Object.keys(regionMap)];
const visitedOptions = ['すべて', '行った', '未訪問'];

export default function Home() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [planDate, setPlanDate] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const [planDay, setPlanDay] = useState<PlanDay | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [planTitleDraft, setPlanTitleDraft] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Date().toLocaleDateString('sv-SE').slice(0, 7),
  );
  const [monthlyPlans, setMonthlyPlans] = useState<PlanDaySummary[]>([]);
  const [placeMemoDrafts, setPlaceMemoDrafts] = useState<Record<number, string>>({});
  const [planItemDrafts, setPlanItemDrafts] = useState<
    Record<number, { startTime?: string; endTime?: string; note?: string }>
  >({});
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userNameDraft, setUserNameDraft] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [visitedFilter, setVisitedFilter] = useState('すべて');
  const [regionFilter, setRegionFilter] = useState('すべて');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'me' | 'partner'>('all');
  const [activeTab, setActiveTab] = useState<'places' | 'timeline' | 'album'>('places');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postFilter, setPostFilter] = useState<'all' | 'me' | 'partner'>('all');
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [gachaResult, setGachaResult] = useState<Place | null>(null);
  const [nextPlanText, setNextPlanText] = useState<string>('未設定');

  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data);
    if (data.length > 0 && currentUserId === null) {
      setCurrentUserId(data[0].id);
    }
  }

  async function updateUserName() {
    if (!currentUserId) return;
    const trimmed = userNameDraft.trim();
    if (!trimmed) return;
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentUserId, name: trimmed }),
    });
    loadUsers();
  }

  async function loadPosts() {
    if (!currentUserId) return;
    const res = await fetch('/api/posts', {
      headers: { 'x-user-id': String(currentUserId) },
    });
    const data = await res.json();
    setPosts(data);
  }

  async function addPost() {
    if (!currentUserId) return;
    const trimmed = postContent.trim();
    if (!trimmed) return;
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ content: trimmed, imageUrl: postImageUrl }),
    });
    setPostContent('');
    setPostImageUrl('');
    loadPosts();
  }

  async function addComment(postId: number) {
    if (!currentUserId) return;
    const draft = commentDrafts[postId] ?? '';
    const trimmed = draft.trim();
    if (!trimmed) return;
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ postId, content: trimmed }),
    });
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    loadPosts();
  }

  async function loadPlaces() {
    if (!currentUserId) return;
    const res = await fetch('/api/places', {
      headers: { 'x-user-id': String(currentUserId) },
    });
    const data = await res.json();
    setPlaces(data);
    setLoading(false);
    setPlaceMemoDrafts({});
  }

  async function addPlace() {
    if (!currentUserId) return;
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName) return;

    await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ name: trimmedName, url: trimmedUrl }),
    });

    setName('');
    setUrl('');
    loadPlaces();
  }

  async function updatePlaceMemo(id: number, memo: string) {
    if (!currentUserId) return;
    await fetch('/api/places', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id, memo }),
    });
    loadPlaces();
  }

  async function updatePlacePrefecture(id: number, prefecture: string) {
    if (!currentUserId) return;
    await fetch('/api/places', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id, prefecture }),
    });
    loadPlaces();
  }

  async function toggleVisited(id: number, visited: boolean) {
    if (!currentUserId) return;
    await fetch('/api/places', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id, visited }),
    });
    loadPlaces();
  }

  async function loadPlanDay(dateStr: string) {
    if (!currentUserId) return;
    setPlanLoading(true);
    const res = await fetch(`/api/plan-day?date=${dateStr}`, {
      headers: { 'x-user-id': String(currentUserId) },
    });
    const data = await res.json();
    setPlanDay(data);
    setPlanLoading(false);
    setPlanItemDrafts({});
    setPlanTitleDraft(data?.title ?? '');
  }

  async function createPlanDay() {
    if (!currentUserId) return;
    const title = planTitleDraft.trim() || '今日のプラン';
    await fetch('/api/plan-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ title, date: planDate }),
    });
    loadPlanDay(planDate);
  }

  async function addToPlan(placeId: number) {
    if (!currentUserId) return;
    if (!planDay) return;
    await fetch('/api/plan-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ planDayId: planDay.id, placeId }),
    });
    loadPlanDay(planDate);
  }

  async function addCustomToPlan() {
    if (!currentUserId) return;
    if (!planDay) return;
    const trimmed = customTitle.trim();
    if (!trimmed) return;
    await fetch('/api/plan-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ planDayId: planDay.id, title: trimmed }),
    });
    setCustomTitle('');
    loadPlanDay(planDate);
  }

  async function updatePlanItem(
    id: number,
    fields: { startTime?: string; endTime?: string; note?: string },
  ) {
    if (!currentUserId) return;
    await fetch('/api/plan-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id, ...fields }),
    });
  }

  async function updatePlanTitle() {
    if (!currentUserId) return;
    if (!planDay) return;
    const trimmed = planTitleDraft.trim();
    if (!trimmed) return;
    await fetch('/api/plan-day', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id: planDay.id, title: trimmed }),
    });
    loadPlanDay(planDate);
  }

  async function loadMonthlyPlans(month: string) {
    if (!currentUserId) return;
    const res = await fetch(`/api/plan-days?month=${month}`, {
      headers: { 'x-user-id': String(currentUserId) },
    });
    const data = await res.json();
    setMonthlyPlans(data);
  }

  async function loadUpcomingPlan() {
    if (!currentUserId) return;
    const today = new Date();
    const monthStr = today.toLocaleDateString('sv-SE').slice(0, 7);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      .toLocaleDateString('sv-SE')
      .slice(0, 7);

    const fetchMonth = async (month: string) => {
      const res = await fetch(`/api/plan-days?month=${month}`, {
        headers: { 'x-user-id': String(currentUserId) },
      });
      return (await res.json()) as PlanDaySummary[];
    };

    const currentPlans = await fetchMonth(monthStr);
    const upcoming = currentPlans
      .map((plan) => ({ ...plan, dateObj: new Date(plan.date) }))
      .filter((plan) => plan.dateObj >= new Date(today.toDateString()))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

    if (upcoming) {
      setNextPlanText(
        `${shortDateFormatter.format(upcoming.dateObj)} ${upcoming.title}`,
      );
      return;
    }

    const nextPlans = await fetchMonth(nextMonth);
    const nextUpcoming = nextPlans
      .map((plan) => ({ ...plan, dateObj: new Date(plan.date) }))
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())[0];

    if (nextUpcoming) {
      setNextPlanText(
        `${shortDateFormatter.format(nextUpcoming.dateObj)} ${nextUpcoming.title}`,
      );
    } else {
      setNextPlanText('未設定');
    }
  }

  async function removePlanItem(id: number) {
    if (!currentUserId) return;
    await fetch('/api/plan-items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id }),
    });
    loadPlanDay(planDate);
  }

  async function deletePlanDay() {
    if (!currentUserId) return;
    if (!planDay) return;
    await fetch('/api/plan-day', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUserId) },
      body: JSON.stringify({ id: planDay.id }),
    });
    setPlanDay(null);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadPlaces();
      loadPlanDay(planDate);
    }
  }, [currentUserId, planDate]);

  useEffect(() => {
    if (currentUserId && activeTab === 'timeline') {
      loadPosts();
    }
  }, [currentUserId, activeTab]);

  useEffect(() => {
    const current = users.find((user) => user.id === currentUserId);
    setUserNameDraft(current?.name ?? '');
  }, [users, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadMonthlyPlans(calendarMonth);
    }
  }, [calendarMonth, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      loadUpcomingPlan();
    }
  }, [currentUserId, planDate]);

  useEffect(() => {
    setCalendarMonth(planDate.slice(0, 7));
  }, [planDate]);

  const monthDate = new Date(`${calendarMonth}-01T00:00:00`);
  const monthStartDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEndDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekday = monthStartDay.getDay();
  const daysInMonth = monthEndDay.getDate();
  const planByDate = new Map(
    monthlyPlans.map((plan) => [
      new Date(plan.date).toLocaleDateString('sv-SE'),
      plan,
    ]),
  );

  const filteredPlaces = useMemo(() => {
    const targetPrefectures =
      regionFilter === 'すべて' ? null : new Set(regionMap[regionFilter] ?? []);

    return places.filter((place) => {
      if (creatorFilter === 'me' && place.createdBy?.id !== currentUserId) return false;
      if (creatorFilter === 'partner' && place.createdBy?.id === currentUserId) return false;
      if (visitedFilter === '行った' && !place.visited) return false;
      if (visitedFilter === '未訪問' && place.visited) return false;
      if (targetPrefectures) {
        if (!place.prefecture) return false;
        if (!targetPrefectures.has(place.prefecture)) return false;
      }
      return true;
    });
  }, [places, visitedFilter, regionFilter, creatorFilter, currentUserId]);

  const filteredPosts = useMemo(() => {
    if (!currentUserId) return posts;
    if (postFilter === 'me') {
      return posts.filter((post) => post.createdBy?.id === currentUserId);
    }
    if (postFilter === 'partner') {
      return posts.filter((post) => post.createdBy?.id !== currentUserId);
    }
    return posts;
  }, [posts, postFilter, currentUserId]);

  const albumPlaces = useMemo(() => {
    return places
      .filter((place) => place.visited)
      .sort((a, b) => {
        const aTime = a.visitedAt ? new Date(a.visitedAt).getTime() : 0;
        const bTime = b.visitedAt ? new Date(b.visitedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [places]);

  const visitedPrefectures = useMemo(() => {
    const set = new Set<string>();
    for (const place of places) {
      if (place.visited && place.prefecture) {
        set.add(place.prefecture);
      }
    }
    return set;
  }, [places]);

  const visitedCount = useMemo(
    () => places.filter((place) => place.visited).length,
    [places],
  );

  const prefectureCount = visitedPrefectures.size;
  const badgeLabel =
    prefectureCount >= 20
      ? '全国チャレンジャー'
      : prefectureCount >= 10
        ? '地方マスター'
        : prefectureCount >= 5
          ? '旅のはじまり'
          : 'これから';

  const mapData = useMemo(() => {
    const visitedByPref = new Map<string, Place[]>();
    for (const place of places) {
      if (place.visited && place.prefecture) {
        const list = visitedByPref.get(place.prefecture) ?? [];
        list.push(place);
        visitedByPref.set(place.prefecture, list);
      }
    }

    return prefectureList.map((pref) => {
      const visitedPlaces = visitedByPref.get(pref.name) ?? [];
      const description =
        visitedPlaces.length === 0
          ? '未訪問'
          : visitedPlaces
              .map((place) => {
                const date = place.visitedAt
                  ? createdAtFormatter.format(new Date(place.visitedAt))
                  : '日付不明';
                return `${date} ${place.name}`;
              })
              .join('\n');

      return {
        id: pref.id,
        name: pref.name,
        description,
        fill: visitedPlaces.length > 0 ? '#34d399' : '#e2e8f0',
      };
    });
  }, [places]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50">
      <main className="mx-auto max-w-6xl p-6 md:p-10 space-y-8">
        <header className="rounded-3xl border border-white/70 bg-white/70 p-6 md:p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                For Two
              </p>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                行きたい場所リスト
              </h1>
              <p className="text-slate-600">
                ふたりの「行きたい」を集めて、1日のプランにまとめる。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs text-emerald-700">
                保存はDBに
              </div>
              <select
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs text-emerald-700"
                value={currentUserId ?? ''}
                onChange={(e) => setCurrentUserId(Number(e.target.value))}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <input
                className="w-28 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs text-emerald-700"
                value={userNameDraft}
                onChange={(e) => setUserNameDraft(e.target.value)}
                onBlur={updateUserName}
                placeholder="名前"
              />
              <button
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white"
                onClick={() => setIsMapOpen(true)}
              >
                訪問マップ
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className={`rounded-full px-3 py-1.5 text-xs ${
                activeTab === 'places'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600'
              }`}
              onClick={() => setActiveTab('places')}
            >
              保存・プラン
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-xs ${
                activeTab === 'timeline'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              ふたりのタイムライン
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-xs ${
                activeTab === 'album'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600'
              }`}
              onClick={() => setActiveTab('album')}
            >
              思い出アルバム
            </button>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs text-amber-700">
              デートコイン {visitedCount}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
              {badgeLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs text-emerald-700">
              次の予定: {nextPlanText}
            </span>
          </div>
        </header>

        {activeTab === 'places' ? (
          <div className="grid gap-6 md:grid-cols-5">
          <section className="md:col-span-2 space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">追加フォーム</h2>
              <p className="text-sm text-slate-500">URLは任意です。</p>
            </div>
            <div className="space-y-3">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3"
                placeholder="場所の名前"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
                onClick={addPlace}
              >
                追加する
              </button>
            </div>

            <div className="pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-700">保存した場所</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {filteredPlaces.length}件
                </span>
                <button
                  className="rounded-full bg-amber-600 px-3 py-1 text-xs text-white"
                  onClick={() => {
                    const pool = places.filter((place) => !place.visited);
                    const target = pool.length > 0 ? pool : places;
                    if (target.length === 0) {
                      setGachaResult(null);
                      return;
                    }
                    const pick = target[Math.floor(Math.random() * target.length)];
                    setGachaResult(pick);
                  }}
                >
                  ガチャで決める
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                  value={creatorFilter}
                  onChange={(e) =>
                    setCreatorFilter(e.target.value as 'all' | 'me' | 'partner')
                  }
                >
                  <option value="all">全員</option>
                  <option value="me">自分</option>
                  <option value="partner">相手</option>
                </select>
                <select
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                  value={visitedFilter}
                  onChange={(e) => setVisitedFilter(e.target.value)}
                >
                  {visitedOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  {regionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">読み込み中...</p>
            ) : (
              <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {filteredPlaces.map((place) => (
                  <li
                    key={place.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {place.imageUrl ? (
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        {place.url ? (
                          <a
                            className="font-medium text-slate-900 underline-offset-4 hover:underline"
                            href={place.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {place.name}
                          </a>
                        ) : (
                          <span className="font-medium text-slate-900">{place.name}</span>
                        )}
                        <p className="text-xs text-slate-500">
                          追加日: {createdAtFormatter.format(new Date(place.createdAt))}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={place.visited}
                              onChange={(e) => toggleVisited(place.id, e.target.checked)}
                            />
                            行った
                          </label>
                          {place.visitedAt && (
                            <span>
                              {createdAtFormatter.format(new Date(place.visitedAt))}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-white/90 p-2 text-sm"
                            value={place.prefecture ?? ''}
                            onChange={(e) => updatePlacePrefecture(place.id, e.target.value)}
                          >
                            <option value="">都道府県を選択</option>
                            {[
                              '北海道',
                              '青森県',
                              '岩手県',
                              '宮城県',
                              '秋田県',
                              '山形県',
                              '福島県',
                              '茨城県',
                              '栃木県',
                              '群馬県',
                              '埼玉県',
                              '千葉県',
                              '東京都',
                              '神奈川県',
                              '新潟県',
                              '富山県',
                              '石川県',
                              '福井県',
                              '山梨県',
                              '長野県',
                              '岐阜県',
                              '静岡県',
                              '愛知県',
                              '三重県',
                              '滋賀県',
                              '京都府',
                              '大阪府',
                              '兵庫県',
                              '奈良県',
                              '和歌山県',
                              '鳥取県',
                              '島根県',
                              '岡山県',
                              '広島県',
                              '山口県',
                              '徳島県',
                              '香川県',
                              '愛媛県',
                              '高知県',
                              '福岡県',
                              '佐賀県',
                              '長崎県',
                              '熊本県',
                              '大分県',
                              '宮崎県',
                              '鹿児島県',
                              '沖縄県',
                            ].map((pref) => (
                              <option key={pref} value={pref}>
                                {pref}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          追加した人: {place.createdBy?.name ?? '不明'}
                        </p>
                        <input
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white/90 p-2 text-sm"
                          placeholder="メモ"
                          value={placeMemoDrafts[place.id] ?? place.memo ?? ''}
                          onChange={(e) =>
                            setPlaceMemoDrafts((prev) => ({
                              ...prev,
                              [place.id]: e.target.value,
                            }))
                          }
                          onBlur={(e) => updatePlaceMemo(place.id, e.target.value)}
                        />
                      </div>
                      <div className="ml-auto flex flex-col items-end gap-2">
                        <button
                          className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700"
                          onClick={() => addToPlan(place.id)}
                          disabled={!planDay}
                        >
                          プランに追加
                        </button>
                        <button
                          className="text-xs text-rose-600"
                          onClick={async () => {
                            if (!currentUserId) return;
                            await fetch('/api/places', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-user-id': String(currentUserId),
                              },
                              body: JSON.stringify({ id: place.id }),
                            });
                            loadPlaces();
                          }}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="md:col-span-3 space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">一日のプラン</h2>
                <p className="text-sm text-slate-500">
                  日付を選んで、順番に並べていきましょう。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  className="rounded-2xl border border-slate-200 bg-white/90 p-2"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                />
                {!planDay && (
                  <button
                    className="rounded-2xl bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-800"
                    onClick={createPlanDay}
                  >
                    この日を作成
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  className="text-sm text-slate-500"
                  onClick={() => {
                    const prev = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
                    setCalendarMonth(prev.toLocaleDateString('sv-SE').slice(0, 7));
                  }}
                >
                  ← 前の月
                </button>
                <p className="text-sm font-semibold text-slate-900">
                  {monthLabelFormatter.format(monthDate)}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-slate-500"
                    onClick={() => {
                      const today = new Date().toLocaleDateString('sv-SE').slice(0, 7);
                      setCalendarMonth(today);
                    }}
                  >
                    今月
                  </button>
                  <button
                    className="text-sm text-slate-500"
                    onClick={() => {
                      const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
                      setCalendarMonth(next.toLocaleDateString('sv-SE').slice(0, 7));
                    }}
                  >
                    次の月 →
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                {['日', '月', '火', '水', '木', '金', '土'].map((label) => (
                  <div key={label}>{label}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {Array.from({ length: startWeekday }).map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateStr = new Date(
                    monthDate.getFullYear(),
                    monthDate.getMonth(),
                    day,
                  )
                    .toLocaleDateString('sv-SE')
                    .slice(0, 10);
                  const plan = planByDate.get(dateStr);
                  const hasPlan = Boolean(plan);
                  const isSelected = planDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      className={`rounded-xl border px-2 py-1 text-sm transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                      onClick={() => setPlanDate(dateStr)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{day}</span>
                        {hasPlan ? (
                          <span className="max-w-[4.5rem] truncate text-[10px] text-emerald-700">
                            {plan?.title ?? '予定'}
                          </span>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {planLoading ? (
              <p className="text-sm text-slate-500">読み込み中...</p>
            ) : planDay ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-1 text-sm font-semibold text-slate-900"
                    value={planTitleDraft}
                    onChange={(e) => setPlanTitleDraft(e.target.value)}
                    onBlur={updatePlanTitle}
                  />
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">
                    {planDay.items.length}件
                  </span>
                  <button
                    className="ml-auto text-xs text-rose-600"
                    onClick={deletePlanDay}
                  >
                    この日のプランを削除
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3"
                    placeholder="自由に追加（例: 09:30 電車で出発）"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                  <button
                    className="rounded-2xl bg-amber-600 px-3 py-2 text-white transition hover:bg-amber-500"
                    onClick={addCustomToPlan}
                  >
                    追加
                  </button>
                </div>

                {planDay.items.length === 0 ? (
                  <p className="text-sm text-slate-500">まだ追加されていません</p>
                ) : (
                  <ol className="space-y-4">
                    {planDay.items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              item.kind === 'CUSTOM'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.kind === 'CUSTOM' ? '自由' : '場所'}
                          </span>
                          <p className="font-semibold text-slate-900">
                            {item.place?.name ?? item.title ?? '（無題）'}
                          </p>
                          <button
                            className="ml-auto text-xs text-rose-600"
                            onClick={() => removePlanItem(item.id)}
                          >
                            削除
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <input
                            type="time"
                            className="rounded-xl border border-slate-200 bg-white/90 p-2"
                            value={planItemDrafts[item.id]?.startTime ?? item.startTime ?? ''}
                            onChange={(e) =>
                              setPlanItemDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  startTime: e.target.value,
                                },
                              }))
                            }
                            onBlur={(e) => updatePlanItem(item.id, { startTime: e.target.value })}
                          />
                          <span className="text-slate-400">〜</span>
                          <input
                            type="time"
                            className="rounded-xl border border-slate-200 bg-white/90 p-2"
                            value={planItemDrafts[item.id]?.endTime ?? item.endTime ?? ''}
                            onChange={(e) =>
                              setPlanItemDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  endTime: e.target.value,
                                },
                              }))
                            }
                            onBlur={(e) => updatePlanItem(item.id, { endTime: e.target.value })}
                          />
                        </div>

                        <input
                          className="mt-3 w-full rounded-xl border border-slate-200 bg-white/90 p-2"
                          placeholder="メモ"
                          value={planItemDrafts[item.id]?.note ?? item.note ?? ''}
                          onChange={(e) =>
                            setPlanItemDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...prev[item.id],
                                note: e.target.value,
                              },
                            }))
                          }
                          onBlur={(e) => updatePlanItem(item.id, { note: e.target.value })}
                        />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">この日のプランは未作成です</p>
            )}
          </section>
          </div>
        ) : activeTab === 'timeline' ? (
          <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">ふたりのタイムライン</h2>
                <p className="text-sm text-slate-500">メモや近況を気軽に残す場所。</p>
              </div>
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'すべて' },
                  { key: 'me', label: '自分' },
                  { key: 'partner', label: '相手' },
                ].map((option) => (
                  <button
                    key={option.key}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      postFilter === option.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600'
                    }`}
                    onClick={() => setPostFilter(option.key as 'all' | 'me' | 'partner')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3"
                rows={3}
                placeholder="今の気持ちや共有したいことを書いてみよう"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="flex-1 rounded-2xl border border-slate-200 bg-white/90 p-2 text-sm"
                  placeholder="画像URL（任意）"
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                />
                <button
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm text-white"
                  onClick={addPost}
                >
                  投稿
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4 max-h-[640px] overflow-y-auto pr-2">
              {filteredPosts.length === 0 ? (
                <p className="text-sm text-slate-500">まだ投稿がありません。</p>
              ) : (
                filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {post.createdBy?.name ?? '不明'}
                      </span>
                      <span>・</span>
                      <span>{createdAtFormatter.format(new Date(post.createdAt))}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-slate-900">{post.content}</p>
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="post"
                        className="mt-3 max-h-80 w-full rounded-2xl object-cover"
                      />
                    )}
                    <div className="mt-4 space-y-2">
                      {(post.comments ?? []).length === 0 ? (
                        <p className="text-xs text-slate-400">まだコメントがありません。</p>
                      ) : (
                        (post.comments ?? []).map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">
                                {comment.createdBy?.name ?? '不明'}
                              </span>
                              <span>・</span>
                              <span>
                                {createdAtFormatter.format(new Date(comment.createdAt))}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-slate-800">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="flex-1 rounded-2xl border border-slate-200 bg-white/90 p-2 text-sm"
                          placeholder="コメントを追加"
                          value={commentDrafts[post.id] ?? ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="rounded-2xl bg-slate-900 px-3 py-2 text-xs text-white"
                          onClick={() => addComment(post.id)}
                        >
                          送信
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">思い出アルバム</h2>
              <p className="text-sm text-slate-500">
                「行った」にチェックした場所を写真付きでまとめます。
              </p>
            </div>
            {albumPlaces.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                まだ訪問済みの場所がありません。
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {albumPlaces.map((place) => (
                  <article
                    key={place.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="h-40 w-full bg-slate-100">
                      {place.imageUrl ? (
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{place.prefecture ?? '都道府県未設定'}</span>
                        {place.visitedAt && (
                          <span>
                            {createdAtFormatter.format(new Date(place.visitedAt))}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{place.name}</h3>
                      {place.memo && (
                        <p className="text-sm text-slate-600">{place.memo}</p>
                      )}
                      <p className="text-xs text-slate-400">
                        追加した人: {place.createdBy?.name ?? '不明'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">訪問済みマップ</p>
                <h3 className="text-lg font-semibold text-slate-900">日本地図</h3>
              </div>
              <button
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white"
                onClick={() => setIsMapOpen(false)}
              >
                閉じる
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <JapanMap
                size="560px"
                bgColor="#f8fafc"
                strokeColor="#ffffff"
                data={mapData}
              />
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-emerald-400" />
                  訪問済み
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-slate-200" />
                  未訪問
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {gachaResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">次の行き先</p>
                <h3 className="text-lg font-semibold text-slate-900">ガチャ結果</h3>
              </div>
              <button
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-white"
                onClick={() => setGachaResult(null)}
              >
                閉じる
              </button>
            </div>
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {gachaResult.imageUrl ? (
                    <img
                      src={gachaResult.imageUrl}
                      alt={gachaResult.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{gachaResult.name}</p>
                  <p className="text-xs text-slate-500">
                    {gachaResult.prefecture ?? '都道府県未設定'}
                  </p>
                </div>
              </div>
              {gachaResult.url && (
                <a
                  className="text-sm text-emerald-700 underline-offset-4 hover:underline"
                  href={gachaResult.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  公式サイトを開く
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
