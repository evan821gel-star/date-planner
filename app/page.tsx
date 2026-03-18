'use client';

import { useEffect, useMemo, useState } from 'react';
import { JapanMap } from 'japanmap';

type User = {
  id: number;
  name: string | null;
  username?: string | null;
};

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
  createdBy?: User | null;
  createdByName?: string | null;
};

type PlanItem = {
  id: number;
  title: string | null;
  kind: 'PLACE' | 'CUSTOM';
  order: number;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  place?: Place | null;
  createdBy?: User | null;
  createdByName?: string | null;
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

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  createdBy?: User | null;
  createdByName?: string | null;
};

type Post = {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  createdBy?: User | null;
  createdByName?: string | null;
  comments: Comment[];
};

const prefectureOptions = [
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
];

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

const regionMap: Record<string, string[]> = {
  '北海道・東北': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  関東: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  中部: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
  近畿: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  中国: ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  四国: ['徳島県', '香川県', '愛媛県', '高知県'],
  '九州・沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
};

const dateKey = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('sv-SE');
};

const todayKey = () => new Date().toLocaleDateString('sv-SE');

export default function Home() {
  const [tab, setTab] = useState<'places' | 'timeline' | 'album'>('places');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [placeName, setPlaceName] = useState('');
  const [placeUrl, setPlaceUrl] = useState('');
  const [visitedFilter, setVisitedFilter] = useState<'ALL' | 'VISITED' | 'UNVISITED'>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL');
  const [memoDrafts, setMemoDrafts] = useState<Record<number, string>>({});

  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [calendarMonth, setCalendarMonth] = useState<string>(todayKey().slice(0, 7));
  const [planDay, setPlanDay] = useState<PlanDay | null>(null);
  const [planDays, setPlanDays] = useState<PlanDaySummary[]>([]);
  const [planTitle, setPlanTitle] = useState('');
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [planItemDrafts, setPlanItemDrafts] = useState<
    Record<number, { startTime: string; endTime: string; note: string }>
  >({});

  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  const [mapOpen, setMapOpen] = useState(false);
  const [gachaOpen, setGachaOpen] = useState(false);
  const [gachaResult, setGachaResult] = useState<Place | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [nextPlanText, setNextPlanText] = useState('');

  const resolveCreatorName = (name?: string | null, user?: User | null) =>
    name ?? user?.name ?? '不明';

  useEffect(() => {
    const stored = localStorage.getItem('next-plan-text');
    if (stored) setNextPlanText(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('next-plan-text', nextPlanText);
  }, [nextPlanText]);

  useEffect(() => {
    void loadMe();
    void loadPlaces();
    void loadPosts();
  }, []);

  useEffect(() => {
    void loadPlanDay(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    void loadPlanDays(calendarMonth);
  }, [calendarMonth]);

  useEffect(() => {
    const stored = localStorage.getItem('dp-display-name');
    if (stored) setDisplayName(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem('dp-display-name', displayName);
  }, [displayName]);

  useEffect(() => {
    if (planDay) {
      setPlanTitle(planDay.title);
      const nextDrafts: Record<number, { startTime: string; endTime: string; note: string }> = {};
      planDay.items.forEach((item) => {
        nextDrafts[item.id] = {
          startTime: item.startTime ?? '',
          endTime: item.endTime ?? '',
          note: item.note ?? '',
        };
      });
      setPlanItemDrafts(nextDrafts);
    } else {
      setPlanTitle('');
      setPlanItemDrafts({});
    }
  }, [planDay]);

  async function loadMe() {
    const res = await fetch('/api/auth/me');
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setCurrentUser(data);
  }

  async function loadPlaces() {
    const res = await fetch('/api/places');
    if (!res.ok) return;
    const data = await res.json();
    setPlaces(data);
  }

  async function loadPosts() {
    const res = await fetch('/api/posts');
    if (!res.ok) return;
    const data = await res.json();
    setPosts(data);
  }

  async function loadPlanDay(dateStr: string) {
    const res = await fetch(`/api/plan-day?date=${dateStr}`);
    if (!res.ok) {
      setPlanDay(null);
      return;
    }
    const data = await res.json();
    setPlanDay(data);
  }

  async function loadPlanDays(monthStr: string) {
    const res = await fetch(`/api/plan-days?month=${monthStr}`);
    if (!res.ok) return;
    const data = await res.json();
    setPlanDays(data);
  }

  const filteredPlaces = useMemo(() => {
    let list = [...places];

    if (visitedFilter === 'VISITED') {
      list = list.filter((p) => p.visited);
    } else if (visitedFilter === 'UNVISITED') {
      list = list.filter((p) => !p.visited);
    }

    if (regionFilter !== 'ALL') {
      const targets = regionMap[regionFilter] ?? [];
      list = list.filter((p) => (p.prefecture ? targets.includes(p.prefecture) : false));
    }

    if (creatorFilter !== 'ALL') {
      list = list.filter(
        (p) => resolveCreatorName(p.createdByName, p.createdBy) === creatorFilter,
      );
    }

    return list;
  }, [places, visitedFilter, regionFilter, creatorFilter, resolveCreatorName]);

  const visitedPlaces = useMemo(() => places.filter((p) => p.visited), [places]);
  const dateCoins = visitedPlaces.length;
  const visitedPrefectureSet = useMemo(() => {
    const set = new Set<string>();
    visitedPlaces.forEach((place) => {
      if (place.prefecture) set.add(place.prefecture);
    });
    return set;
  }, [visitedPlaces]);

  const planByDate = useMemo(() => {
    const map = new Map<string, PlanDaySummary>();
    planDays.forEach((plan) => {
      map.set(dateKey(plan.date), plan);
    });
    return map;
  }, [planDays]);

  const calendarCells = useMemo(() => {
    const [yearStr, monthStr] = calendarMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month)
      return [] as Array<{ date: string; day: number; plan: PlanDaySummary | null } | null>;

    const first = new Date(year, month - 1, 1);
    const startWeekday = first.getDay();
    const total = new Date(year, month, 0).getDate();

    const cells: Array<{ date: string; day: number; plan: PlanDaySummary | null } | null> = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= total; day += 1) {
      const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
      cells.push({ date: dateStr, day, plan: planByDate.get(dateStr) ?? null });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth, planByDate]);

  const mapData = useMemo(() => {
    const data: Array<{ id: string; fill: string; description: string }> = [];
    const byPref: Record<string, Place[]> = {};
    visitedPlaces.forEach((place) => {
      if (!place.prefecture) return;
      if (!byPref[place.prefecture]) byPref[place.prefecture] = [];
      byPref[place.prefecture].push(place);
    });

    Object.entries(byPref).forEach(([pref, list]) => {
      const id = prefectureCodeMap[pref];
      if (!id) return;
      const description = list
        .map((place) => `${place.name} (${formatDate(place.visitedAt || place.createdAt)})`)
        .join('\n');
      data.push({ id, fill: '#34d399', description });
    });

    return data;
  }, [visitedPlaces]);

  const creatorOptions = useMemo(() => {
    const names = new Set<string>();
    places.forEach((place) => {
      const name = resolveCreatorName(place.createdByName, place.createdBy);
      if (name && name !== '不明') names.add(name);
    });
    posts.forEach((post) => {
      const name = resolveCreatorName(post.createdByName, post.createdBy);
      if (name && name !== '不明') names.add(name);
    });
    if (displayName.trim() !== '') names.add(displayName.trim());
    return Array.from(names);
  }, [places, posts, displayName]);

  async function handleAddPlace() {
    const name = placeName.trim();
    if (!name) return;
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url: placeUrl.trim(), createdByName: displayName.trim() }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setPlaces((prev) => [data, ...prev]);
    setPlaceName('');
    setPlaceUrl('');
  }

  async function handleDeletePlace(placeId: number) {
    const res = await fetch('/api/places', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: placeId }),
    });
    if (!res.ok) return;
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
  }

  async function handleMemoSave(placeId: number) {
    const memo = memoDrafts[placeId] ?? '';
    const res = await fetch('/api/places', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: placeId, memo }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? updated : p)));
  }

  async function handlePrefectureChange(placeId: number, prefecture: string) {
    const res = await fetch('/api/places', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: placeId, prefecture }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? updated : p)));
  }

  async function handleVisitedChange(placeId: number, visited: boolean) {
    const res = await fetch('/api/places', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: placeId, visited }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? updated : p)));
  }

  async function handleCreatePlanDay() {
    if (!planTitle.trim()) return;
    const res = await fetch('/api/plan-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: planTitle.trim(), date: selectedDate }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setPlanDay({ ...data, items: [] });
    await loadPlanDays(calendarMonth);
  }

  async function handleUpdatePlanTitle() {
    if (!planDay) return;
    const res = await fetch('/api/plan-day', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: planDay.id, title: planTitle.trim() }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setPlanDay((prev) => (prev ? { ...prev, title: updated.title } : prev));
    await loadPlanDays(calendarMonth);
  }

  async function handleDeletePlanDay() {
    if (!planDay) return;
    const res = await fetch('/api/plan-day', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: planDay.id }),
    });
    if (!res.ok) return;
    setPlanDay(null);
    await loadPlanDays(calendarMonth);
  }

  async function handleAddPlanItem(placeId?: number, customTitle?: string) {
    if (!planDay) return;
    const body: { planDayId: number; placeId?: number; title?: string; createdByName?: string } = {
      planDayId: planDay.id,
    };
    if (placeId) body.placeId = placeId;
    if (customTitle) body.title = customTitle;
    if (displayName.trim() !== '') body.createdByName = displayName.trim();

    const res = await fetch('/api/plan-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const item = await res.json();
    setPlanDay((prev) => (prev ? { ...prev, items: [...prev.items, item] } : prev));
  }

  async function handleSavePlanItem(itemId: number) {
    const draft = planItemDrafts[itemId];
    if (!draft) return;
    const res = await fetch('/api/plan-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, startTime: draft.startTime, endTime: draft.endTime, note: draft.note }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setPlanDay((prev) =>
      prev ? { ...prev, items: prev.items.map((item) => (item.id === itemId ? updated : item)) } : prev,
    );
  }

  async function handleDeletePlanItem(itemId: number) {
    const res = await fetch('/api/plan-items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId }),
    });
    if (!res.ok) return;
    setPlanDay((prev) =>
      prev ? { ...prev, items: prev.items.filter((item) => item.id !== itemId) } : prev,
    );
  }

  async function handleCreatePost() {
    const content = postContent.trim();
    if (!content) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, imageUrl: postImageUrl.trim(), createdByName: displayName.trim() }),
    });
    if (!res.ok) return;
    const post = await res.json();
    setPosts((prev) => [post, ...prev]);
    setPostContent('');
    setPostImageUrl('');
  }

  async function handleAddComment(postId: number) {
    const content = (commentDrafts[postId] ?? '').trim();
    if (!content) return;
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content, createdByName: displayName.trim() }),
    });
    if (!res.ok) return;
    const comment = await res.json();
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)),
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const filteredPosts = useMemo(() => {
    if (creatorFilter === 'ALL') return posts;
    return posts.filter(
      (post) => resolveCreatorName(post.createdByName, post.createdBy) === creatorFilter,
    );
  }, [posts, creatorFilter, resolveCreatorName]);

  const albumPlaces = useMemo(() => visitedPlaces, [visitedPlaces]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-orange-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/95 p-4 backdrop-blur">
          <div>
            <h1 className="text-2xl font-bold">Date Planner</h1>
            <p className="text-sm text-slate-600">行きたい場所、プラン、思い出をふたりで共有。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/95 px-3 py-1 text-sm">
              <span className="text-slate-600">あなた</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                onBlur={() => setDisplayName((prev) => prev.trim())}
                className="w-24 bg-transparent text-sm font-medium text-slate-900 focus:outline-none"
                placeholder="表示名"
              />
            </div>
            <button
              onClick={() => setMapOpen(true)}
              className="rounded-full border border-emerald-300 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/30"
            >
              日本地図
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white/95"
            >
              ログアウト
            </button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab('places')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === 'places' ? 'bg-white text-slate-900' : 'border border-slate-200 text-slate-600'
            }`}
          >
            場所 & プラン
          </button>
          <button
            onClick={() => setTab('timeline')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === 'timeline' ? 'bg-white text-slate-900' : 'border border-slate-200 text-slate-600'
            }`}
          >
            タイムライン
          </button>
          <button
            onClick={() => setTab('album')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === 'album' ? 'bg-white text-slate-900' : 'border border-slate-200 text-slate-600'
            }`}
          >
            思い出アルバム
          </button>
        </div>

        {tab === 'places' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">行きたい場所</h2>
                  <p className="text-xs text-slate-600">保存数: {places.length} / 行った場所: {dateCoins}</p>
                </div>
                <button
                  onClick={() => {
                    if (places.length === 0) return;
                    const pick = places[Math.floor(Math.random() * places.length)];
                    setGachaResult(pick);
                    setGachaOpen(true);
                  }}
                  className="rounded-full border border-pink-300 bg-pink-100 px-4 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-500/30"
                >
                  ガチャで決める
                </button>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl border border-slate-200/70 bg-white p-4">
                <input
                  value={placeName}
                  onChange={(event) => setPlaceName(event.target.value)}
                  placeholder="場所の名前"
                  className="w-full rounded-lg border border-slate-200/70 bg-white/95 px-3 py-2 text-sm text-slate-900"
                />
                <input
                  value={placeUrl}
                  onChange={(event) => setPlaceUrl(event.target.value)}
                  placeholder="URL (任意)"
                  className="w-full rounded-lg border border-slate-200/70 bg-white/95 px-3 py-2 text-sm text-slate-900"
                />
                <button
                  onClick={handleAddPlace}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  保存する
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>訪問:</span>
                  <select
                    value={visitedFilter}
                    onChange={(event) => setVisitedFilter(event.target.value as 'ALL' | 'VISITED' | 'UNVISITED')}
                    className="rounded-lg border border-slate-200/70 bg-white px-2 py-1"
                  >
                    <option value="ALL">全部</option>
                    <option value="VISITED">行った</option>
                    <option value="UNVISITED">まだ</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span>エリア:</span>
                  <select
                    value={regionFilter}
                    onChange={(event) => setRegionFilter(event.target.value)}
                    className="rounded-lg border border-slate-200/70 bg-white px-2 py-1"
                  >
                    <option value="ALL">全部</option>
                    {Object.keys(regionMap).map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span>追加者:</span>
                  <select
                    value={creatorFilter}
                    onChange={(event) => setCreatorFilter(event.target.value)}
                    className="rounded-lg border border-slate-200/70 bg-white px-2 py-1"
                  >
                    <option value="ALL">全員</option>
                    {creatorOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 max-h-[520px] space-y-4 overflow-y-auto pr-2">
                {filteredPlaces.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    条件に合う場所がありません。
                  </div>
                )}
                {filteredPlaces.map((place) => (
                  <div key={place.id} className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="h-24 w-32 overflow-hidden rounded-xl bg-slate-50">
                        {place.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                            画像なし
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold">{place.name}</h3>
                          {place.url && (
                            <a
                              href={place.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-300 underline"
                            >
                              URL
                            </a>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">追加日: {formatDate(place.createdAt)}</p>
                        <p className="text-xs text-slate-500">
                          追加者: {resolveCreatorName(place.createdByName, place.createdBy)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={place.visited}
                              onChange={(event) => handleVisitedChange(place.id, event.target.checked)}
                              className="h-4 w-4"
                            />
                            行った
                          </label>
                          {place.visitedAt && (
                            <span className="text-xs text-emerald-300">{formatDate(place.visitedAt)}</span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-xs">
                          <select
                            value={place.prefecture ?? ''}
                            onChange={(event) => handlePrefectureChange(place.id, event.target.value)}
                            className="w-full rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1 text-sm"
                          >
                            <option value="">都道府県を選択</option>
                            {prefectureOptions.map((pref) => (
                              <option key={pref} value={pref}>
                                {pref}
                              </option>
                            ))}
                          </select>
                          <textarea
                            value={memoDrafts[place.id] ?? place.memo ?? ''}
                            onChange={(event) =>
                              setMemoDrafts((prev) => ({ ...prev, [place.id]: event.target.value }))
                            }
                            onBlur={() => handleMemoSave(place.id)}
                            placeholder="メモ"
                            className="min-h-[60px] w-full rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAddPlanItem(place.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-white/95"
                        >
                          プランに追加
                        </button>
                        <button
                          onClick={() => handleDeletePlace(place.id)}
                          className="rounded-lg border border-rose-300 px-3 py-1 text-xs text-rose-200 hover:bg-white0/20"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">1日のプラン</h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setCalendarMonth(event.target.value.slice(0, 7));
                    }}
                    className="rounded-lg border border-slate-200/70 bg-white px-2 py-1 text-sm"
                  />
                </div>

                <div className="mt-4 rounded-xl border border-slate-200/70 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={planTitle}
                      onChange={(event) => setPlanTitle(event.target.value)}
                      placeholder="プラン名 (例: 東京観光)"
                      className="flex-1 rounded-lg border border-slate-200/70 bg-white/95 px-3 py-2 text-sm"
                    />
                    {planDay ? (
                      <button
                        onClick={handleUpdatePlanTitle}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                      >
                        更新
                      </button>
                    ) : (
                      <button
                        onClick={handleCreatePlanDay}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                      >
                        作成
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {planDay ? 'プランを編集できます。' : 'この日のプランを作成します。'}
                  </p>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold">自由追加</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      value={customItemTitle}
                      onChange={(event) => setCustomItemTitle(event.target.value)}
                      placeholder="例: 電車で移動"
                      className="flex-1 rounded-lg border border-slate-200/70 bg-white/95 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!customItemTitle.trim()) return;
                        void handleAddPlanItem(undefined, customItemTitle.trim());
                        setCustomItemTitle('');
                      }}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
                    >
                      追加
                    </button>
                  </div>
                </div>

                <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-2">
                  {!planDay && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                      プランを作成すると、ここに行程が表示されます。
                    </div>
                  )}
                  {planDay?.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200/70 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {item.kind === 'PLACE' ? item.place?.name : item.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            追加者: {resolveCreatorName(item.createdByName, item.createdBy)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePlanItem(item.id)}
                          className="text-xs text-rose-200 hover:text-rose-100"
                        >
                          削除
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs">
                        <div className="flex gap-2">
                          <input
                            value={planItemDrafts[item.id]?.startTime ?? ''}
                            onChange={(event) =>
                              setPlanItemDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  startTime: event.target.value,
                                  endTime: prev[item.id]?.endTime ?? '',
                                  note: prev[item.id]?.note ?? '',
                                },
                              }))
                            }
                            onBlur={() => handleSavePlanItem(item.id)}
                            placeholder="開始"
                            className="w-24 rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1 text-xs"
                          />
                          <input
                            value={planItemDrafts[item.id]?.endTime ?? ''}
                            onChange={(event) =>
                              setPlanItemDrafts((prev) => ({
                                ...prev,
                                [item.id]: {
                                  startTime: prev[item.id]?.startTime ?? '',
                                  endTime: event.target.value,
                                  note: prev[item.id]?.note ?? '',
                                },
                              }))
                            }
                            onBlur={() => handleSavePlanItem(item.id)}
                            placeholder="終了"
                            className="w-24 rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1 text-xs"
                          />
                        </div>
                        <textarea
                          value={planItemDrafts[item.id]?.note ?? ''}
                          onChange={(event) =>
                            setPlanItemDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                startTime: prev[item.id]?.startTime ?? '',
                                endTime: prev[item.id]?.endTime ?? '',
                                note: event.target.value,
                              },
                            }))
                          }
                          onBlur={() => handleSavePlanItem(item.id)}
                          placeholder="メモ"
                          className="min-h-[50px] w-full rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {planDay && (
                  <button
                    onClick={handleDeletePlanDay}
                    className="mt-4 rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-200"
                  >
                    この日のプランを削除
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
                <h2 className="text-lg font-semibold">カレンダー</h2>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <button
                    onClick={() => {
                      const [yearStr, monthStr] = calendarMonth.split('-');
                      const year = Number(yearStr);
                      const month = Number(monthStr);
                      const prev = new Date(year, month - 2, 1);
                      const nextKey = prev.toLocaleDateString('sv-SE').slice(0, 7);
                      setCalendarMonth(nextKey);
                    }}
                    className="rounded-full border border-slate-200/70 px-3 py-1"
                  >
                    ← 前月
                  </button>
                  <span className="text-slate-600">{calendarMonth}</span>
                  <button
                    onClick={() => {
                      const [yearStr, monthStr] = calendarMonth.split('-');
                      const year = Number(yearStr);
                      const month = Number(monthStr);
                      const next = new Date(year, month, 1);
                      const nextKey = next.toLocaleDateString('sv-SE').slice(0, 7);
                      setCalendarMonth(nextKey);
                    }}
                    className="rounded-full border border-slate-200/70 px-3 py-1"
                  >
                    次月 →
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2 text-xs">
                  {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                    <div key={day} className="text-center text-slate-500">
                      {day}
                    </div>
                  ))}
                  {calendarCells.map((cell, index) => (
                    <div
                      key={`cell-${index}`}
                      className={`min-h-[64px] rounded-lg border border-white/5 p-1 text-xs ${
                        cell?.date === selectedDate ? 'bg-white text-slate-900' : 'bg-white'
                      }`}
                      onClick={() => {
                        if (!cell) return;
                        setSelectedDate(cell.date);
                      }}
                    >
                      {cell && (
                        <div>
                          <div className="text-right text-[11px]">{cell.day}</div>
                          {cell.plan && (
                            <div className="mt-1 rounded-md bg-emerald-400/20 px-1 py-0.5 text-[11px] text-emerald-700">
                              {cell.plan.title}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
                <h2 className="text-lg font-semibold">これから</h2>
                <textarea
                  value={nextPlanText}
                  onChange={(event) => setNextPlanText(event.target.value)}
                  placeholder="次の楽しみを書いておく"
                  className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-200/70 bg-white/95 px-3 py-2 text-sm"
                />
              </div>
            </section>
          </div>
        )}

        {tab === 'timeline' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">新規投稿</h2>
              <textarea
                value={postContent}
                onChange={(event) => setPostContent(event.target.value)}
                placeholder="今日のひとこと"
                className="mt-3 min-h-[120px] w-full rounded-xl border border-slate-200/70 bg-white/95 px-3 py-2 text-sm"
              />
              <input
                value={postImageUrl}
                onChange={(event) => setPostImageUrl(event.target.value)}
                placeholder="画像URL (任意)"
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/95 px-3 py-2 text-sm"
              />
              <button
                onClick={handleCreatePost}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                投稿する
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">タイムライン</h2>
                <select
                  value={creatorFilter}
                  onChange={(event) => setCreatorFilter(event.target.value)}
                  className="rounded-lg border border-slate-200/70 bg-white px-2 py-1 text-xs"
                >
                  <option value="ALL">全員</option>
                  {creatorOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 max-h-[620px] space-y-4 overflow-y-auto pr-2">
                {filteredPosts.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    投稿がまだありません。
                  </div>
                )}
                {filteredPosts.map((post) => (
                  <article key={post.id} className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{resolveCreatorName(post.createdByName, post.createdBy)}</span>
                      <span>{formatDateTime(post.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">{post.content}</p>
                    {post.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.imageUrl} alt="" className="mt-3 w-full rounded-xl object-cover" />
                    )}

                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1">
                          <span className="font-semibold">
                            {resolveCreatorName(comment.createdByName, comment.createdBy)}:
                          </span>{' '}
                          {comment.content}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={commentDrafts[post.id] ?? ''}
                        onChange={(event) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))
                        }
                        placeholder="コメントを追加"
                        className="flex-1 rounded-lg border border-slate-200/70 bg-white/95 px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
                      >
                        送信
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'album' && (
          <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 backdrop-blur">
            <h2 className="text-lg font-semibold">思い出アルバム</h2>
            <p className="mt-1 text-xs text-slate-600">行った場所だけをまとめています。</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {albumPlaces.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  まだ思い出がありません。
                </div>
              )}
              {albumPlaces.map((place) => (
                <div key={place.id} className="rounded-2xl border border-slate-200/70 bg-white p-3">
                  <div className="h-40 overflow-hidden rounded-xl bg-slate-50">
                    {place.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">画像なし</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold">{place.name}</h3>
                    <p className="text-xs text-slate-500">{place.prefecture ?? '都道府県未設定'}</p>
                    <p className="text-xs text-emerald-300">{formatDate(place.visitedAt)}</p>
                    {place.memo && <p className="mt-2 text-xs text-slate-600">{place.memo}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {mapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-950 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">行った県マップ</h2>
              <button
                onClick={() => setMapOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm"
              >
                閉じる
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <JapanMap size="560px" data={mapData} />
              </div>
              <div className="w-full max-w-xs space-y-2 text-xs text-slate-600">
                {Array.from(visitedPrefectureSet).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    まだチェックされた県がありません。
                  </div>
                )}
                {Array.from(visitedPrefectureSet).map((pref) => (
                  <div key={pref} className="rounded-xl border border-slate-200/70 bg-white/95 p-3">
                    <p className="font-semibold text-slate-900">{pref}</p>
                    <ul className="mt-2 space-y-1">
                      {visitedPlaces
                        .filter((place) => place.prefecture === pref)
                        .map((place) => (
                          <li key={place.id}>
                            {place.name} ({formatDate(place.visitedAt || place.createdAt)})
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {gachaOpen && gachaResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-slate-950 p-6 text-center">
            <h2 className="text-lg font-semibold">今日の行き先</h2>
            <div className="mt-4">
              <p className="text-xl font-bold text-pink-700">{gachaResult.name}</p>
              {gachaResult.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gachaResult.imageUrl} alt={gachaResult.name} className="mt-3 w-full rounded-xl object-cover" />
              )}
              {gachaResult.prefecture && <p className="mt-2 text-sm text-slate-600">{gachaResult.prefecture}</p>}
            </div>
            <button
              onClick={() => setGachaOpen(false)}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




