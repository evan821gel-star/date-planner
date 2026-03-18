'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setError('ログインに失敗しました');
      return;
    }

    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50">
      <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
        <div className="w-full rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">ログイン</h1>
          <p className="mt-1 text-sm text-slate-500">IDとパスワードを入力してください。</p>
          <div className="mt-6 space-y-3">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3"
              placeholder="ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white/90 p-3"
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white"
              onClick={handleLogin}
            >
              ログイン
            </button>
            <button
              className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-400"
              disabled
              title="現在は新規登録を停止しています"
            >
              新規登録（停止中）
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
