import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

type LevelId = 'NEWBIE' | 'SOFT' | 'HARD' | 'PRO' | 'PRO_PLUS' | 'MASTER';

const LEVELS: { id: LevelId; label: string; range: string; badgeClass: string; filterClass: string }[] = [
  { id: 'NEWBIE', label: 'Newbie', range: '0 vendas', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600', filterClass: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { id: 'SOFT', label: 'Soft', range: '1 a 10 mil', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-600', filterClass: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-600 dark:bg-rose-900/30 dark:text-rose-300' },
  { id: 'HARD', label: 'Hard', range: '10 mil a 100 mil', badgeClass: 'bg-slate-800 text-slate-100 border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-500', filterClass: 'border-slate-600 bg-slate-800 text-slate-100 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-200' },
  { id: 'PRO', label: 'Pro', range: '100 mil a 1 milhão', badgeClass: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-600', filterClass: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-600 dark:bg-violet-900/30 dark:text-violet-300' },
  { id: 'PRO_PLUS', label: 'Pro +', range: '1 milhão a 2 milhões', badgeClass: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-600', filterClass: 'border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300' },
  { id: 'MASTER', label: 'Master', range: '2 milhões +', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-600', filterClass: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
];

function getLevel(levelId: LevelId) {
  return LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
}

type MockProfile = {
  name: string;
  location: string;
  level: LevelId;
  nicho: string;
  imageUrl: string;
  tags: { icon: string; label: string }[];
};

// Mock profiles – frontend only, no API
const MOCK_PROFILES: MockProfile[] = [
  {
    name: 'Ricardo',
    location: 'São Paulo, SP',
    level: 'MASTER',
    nicho: 'Marketing Digital',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB0HMZu3MgpQRiHZkWgPPxKugufeGll-MrO67qB7LNB_LuSuNwOml-m_0jIvs0OONvHi0DiFaAwW97h5GWdvi_MCo4CNgWZFSWJHLJUh_ldBFf7_NkcnWrvlnBr-L0rxK0BKcBFWAkQOtxdzcN2iPUptI-dyU0bzjB7WfNnXXFBMyHrhUSxYEhtch0rgF2cu5aTY2GxcOcXirRazxV8Kz3kpvRrzewUj10DSNjAoP_qSaIzd8xshuVSYlHlXxjRsnKPTdaUhkPkBQk',
    tags: [
      { icon: 'sports_soccer', label: 'Football' },
      { icon: 'camera_alt', label: 'Photography' },
      { icon: 'headphones', label: 'Techno' },
      { icon: 'terminal', label: 'Coding' },
    ],
  },
  {
    name: 'Marina',
    location: 'Rio de Janeiro, RJ',
    level: 'HARD',
    nicho: 'Arte e Cultura',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
    tags: [
      { icon: 'palette', label: 'Arte' },
      { icon: 'menu_book', label: 'Leitura' },
      { icon: 'hiking', label: 'Trilhas' },
      { icon: 'coffee', label: 'Café' },
    ],
  },
  {
    name: 'Lucas',
    location: 'Belo Horizonte, MG',
    level: 'SOFT',
    nicho: 'Tech e Games',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    tags: [
      { icon: 'music_note', label: 'Música' },
      { icon: 'videogame_asset', label: 'Games' },
      { icon: 'restaurant', label: 'Gastronomia' },
      { icon: 'flight', label: 'Viagens' },
    ],
  },
  {
    name: 'Julia',
    location: 'Curitiba, PR',
    level: 'PRO_PLUS',
    nicho: 'Coaching e Desenvolvimento',
    imageUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80',
    tags: [
      { icon: 'psychology', label: 'Mindset' },
      { icon: 'fitness_center', label: 'Fitness' },
      { icon: 'eco', label: 'Sustainability' },
      { icon: 'groups', label: 'Networking' },
    ],
  },
];

export default function ComunidadePage() {
  const [profileIndex, setProfileIndex] = useState(0);
  const profile = MOCK_PROFILES[profileIndex];

  const nextProfile = () => {
    setProfileIndex((i) => (i + 1) % MOCK_PROFILES.length);
  };

  const breadcrumbs = [
    { label: 'Tinder do Fluxo' },
    { label: 'Comunidade' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-[calc(100vh-120px)] overflow-hidden font-display">
        <main className="flex-1 flex flex-col items-center p-8 bg-background-light dark:bg-background-dark overflow-y-auto pt-12">
          <div className="w-full max-w-4xl mb-8">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">
              Comunidade<span className="text-primary">.</span>
            </h1>
            <p className="text-slate-500 font-medium">Descubra novas conexões no fluxo.</p>
          </div>

          <div className="relative w-full max-w-md aspect-[3/4] group">
            <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/10 flex flex-col">
              <div
                className="relative h-2/3 w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${profile.imageUrl}')` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary text-background-dark text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg">
                    <span className="material-symbols-outlined text-sm filled-icon">verified</span>{' '}
                    Ativo Agora
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-end gap-2 mb-1">
                    <h2 className="text-3xl font-black">{profile.name}</h2>
                    <span className="material-symbols-outlined text-primary text-2xl filled-icon">
                      verified_user
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-200 text-sm">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {profile.location}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Nível de Assinatura
                    </span>
                    <span className={`px-3 py-1 text-[11px] font-bold rounded-lg border uppercase ${getLevel(profile.level).badgeClass}`}>
                      {getLevel(profile.level).label} · {getLevel(profile.level).range}
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] block mb-1">
                      Nicho
                    </span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {profile.nicho}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.tags.map((tag) => (
                      <div
                        key={tag.label}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700"
                      >
                        <span className="material-symbols-outlined text-sm">{tag.icon}</span>
                        {tag.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={nextProfile}
                    className="size-14 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center bg-white dark:bg-slate-800 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-3xl font-bold">close</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextProfile}
                    className="size-16 rounded-full bg-primary text-background-dark shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-4xl filled-icon">star</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextProfile}
                    className="size-14 rounded-full border-2 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center bg-white dark:bg-slate-800 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-3xl font-bold filled-icon">
                      favorite
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -left-16 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
              <span className="material-symbols-outlined text-6xl">arrow_back_ios</span>
            </div>
            <div className="absolute top-1/2 -right-16 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
              <span className="material-symbols-outlined text-6xl">arrow_forward_ios</span>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-8 text-slate-400 text-xs font-medium uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">42</span> Novos matches hoje
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              Deslize <span className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">E</span> ou{' '}
              <span className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">D</span>
            </div>
          </div>
        </main>

        <aside className="hidden xl:flex w-80 bg-white dark:bg-slate-900 border-l border-primary/10 flex-col p-6 overflow-y-auto">
          <h3 className="text-lg font-bold mb-6">Configurações de Descoberta</h3>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
              <div className="relative">
                <input
                  type="text"
                  onKeyDown={(e) => e.key === 'Enter' && nextProfile()}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-300"
                  placeholder="São Paulo, SP"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  location_on
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Nível</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={nextProfile}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 text-left"
                >
                  Todos os níveis
                </button>
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={nextProfile}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border text-left ${level.filterClass} hover:opacity-90`}
                  >
                    {level.label} · {level.range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">Distance (km)</label>
                <span className="text-xs font-bold text-primary">25 km</span>
              </div>
              <input
                type="range"
                onChange={nextProfile}
                className="w-full accent-primary h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Hobbies</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={nextProfile}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-primary bg-primary text-background-dark"
                >
                  Esportes
                </button>
                <button
                  type="button"
                  onClick={nextProfile}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Música
                </button>
                <button
                  type="button"
                  onClick={nextProfile}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Arte
                </button>
                <button
                  type="button"
                  onClick={nextProfile}
                  className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Tecnologia
                </button>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
