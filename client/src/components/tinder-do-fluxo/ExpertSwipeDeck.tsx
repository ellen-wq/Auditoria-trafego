import { useCallback, useState } from 'react';
import { api } from '../../services/api';

export type ExpertUser = {
  id: number | string;
  name: string;
  tinder_mentor_profiles?: { city?: string; niche?: string; photo_url?: string } | null;
  tinder_expert_profiles?: {
    is_expert?: boolean;
    is_coproducer?: boolean;
    goal_text?: string;
    search_bio?: string;
    preferences_json?: Record<string, unknown> | { niches?: string[] };
  } | null;
};

function getExpertProfile(u: ExpertUser) {
  const e = Array.isArray(u.tinder_expert_profiles) ? u.tinder_expert_profiles[0] : u.tinder_expert_profiles;
  return e;
}

function getTags(u: ExpertUser): string[] {
  const e = getExpertProfile(u);
  const prefs = e?.preferences_json;
  if (!prefs || typeof prefs !== 'object') return [];
  if (Array.isArray((prefs as any).niches)) return (prefs as any).niches;
  if (Array.isArray((prefs as any).tags)) return (prefs as any).tags;
  return [];
}

function getTypeLabel(u: ExpertUser): string {
  const e = getExpertProfile(u);
  if (!e) return '';
  const parts: string[] = [];
  if (e.is_expert) parts.push('Expert');
  if (e.is_coproducer) parts.push('Coprodutor');
  return parts.join(' / ') || 'Perfil';
}

function getMentorProfile(u: ExpertUser) {
  const m = Array.isArray(u.tinder_mentor_profiles) ? u.tinder_mentor_profiles[0] : u.tinder_mentor_profiles;
  return m;
}

function getCity(u: ExpertUser): string {
  return getMentorProfile(u)?.city ?? '';
}

function getPhotoUrl(u: ExpertUser): string {
  return getMentorProfile(u)?.photo_url ?? '';
}

interface ExpertSwipeDeckProps {
  users: ExpertUser[];
  onRemoveTop: () => void;
  onMatch: (matchId: number | null) => void;
  onOpenProfile: (user: ExpertUser) => void;
  isSendingInterest: boolean;
  setIsSendingInterest: (v: boolean) => void;
}

export function ExpertSwipeDeck({
  users,
  onRemoveTop,
  onMatch,
  onOpenProfile,
  isSendingInterest,
  setIsSendingInterest,
}: ExpertSwipeDeckProps) {
  const [drag, setDrag] = useState({ x: 0, startX: 0, isDragging: false });
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);

  const top = users[0];
  const rest = users.slice(1);

  const sendInterest = useCallback(async () => {
    if (!top || isSendingInterest) return;
    setIsSendingInterest(true);
    try {
      const res = await api.post<{ ok: boolean; matched: boolean; matchId?: number }>(
        '/api/tinder-do-fluxo/interest',
        { toUserId: top.id, type: 'EXPERT' }
      );
      if (res?.matched && res.matchId != null) {
        onMatch(res.matchId);
      }
    } catch {
      // could re-add card on error; for now we already removed from deck
    } finally {
      setIsSendingInterest(false);
    }
  }, [top, isSendingInterest, setIsSendingInterest, onMatch]);

  const goNext = useCallback(() => {
    if (!top) return;
    setExitDir('left');
    setTimeout(() => {
      onRemoveTop();
      setExitDir(null);
    }, 200);
  }, [top, onRemoveTop]);

  const handleSwipeRight = useCallback(() => {
    if (!top || isSendingInterest) return;
    setExitDir('right');
    setTimeout(() => {
      onRemoveTop();
      setExitDir(null);
      sendInterest();
    }, 200);
  }, [top, isSendingInterest, onRemoveTop, sendInterest]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDrag({ x: 0, startX: e.touches[0].clientX, isDragging: true });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!drag.isDragging) return;
    const dx = e.touches[0].clientX - drag.startX;
    setDrag((d) => ({ ...d, x: dx }));
  };
  const handleTouchEnd = () => {
    if (!drag.isDragging) return;
    const threshold = 80;
    if (drag.x > threshold) {
      handleSwipeRight();
    } else if (drag.x < -threshold) {
      goNext();
    }
    setDrag({ x: 0, startX: 0, isDragging: false });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrag({ x: 0, startX: e.clientX, isDragging: true });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drag.isDragging) return;
    const dx = e.clientX - drag.startX;
    setDrag((d) => ({ ...d, x: dx }));
  };
  const handleMouseUp = () => {
    if (!drag.isDragging) return;
    const threshold = 80;
    if (drag.x > threshold) {
      handleSwipeRight();
    } else if (drag.x < -threshold) {
      goNext();
    }
    setDrag({ x: 0, startX: 0, isDragging: false });
  };

  const handleMouseLeave = () => {
    if (drag.isDragging) setDrag({ x: 0, startX: 0, isDragging: false });
  };

  if (!top) return null;

  const exitClass = exitDir === 'left' ? 'tinder-card-exit-left' : exitDir === 'right' ? 'tinder-card-exit-right' : '';
  const translateX = exitDir ? (exitDir === 'right' ? 400 : -400) : drag.x;

  return (
    <div className="tinder-deck-wrap">
      <div className="tinder-deck">
        {rest.slice(0, 2).map((u, i) => (
          <div
            key={u.id}
            className="tinder-card tinder-card-back"
            style={{ zIndex: 10 - (i + 1), transform: `scale(${1 - (i + 1) * 0.04}) translateY(${(i + 1) * 8}px)` }}
          >
            <div style={{ fontWeight: 700 }}>{u.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getTypeLabel(u)}</div>
          </div>
        ))}
        <div
          className={`tinder-card tinder-card-top ${exitClass}`}
          style={{
            zIndex: 10,
            transform: `translateX(${translateX}px) rotate(${translateX * 0.03}deg)`,
            transition: exitDir ? 'transform 0.2s ease-out' : 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="tinder-card-inner">
            <div className="tinder-card-header">
              <span className="tinder-card-type">{getTypeLabel(top)}</span>
              <h3 className="tinder-card-name">{top.name}</h3>
            </div>
            <div className="tinder-card-photo">
              {getPhotoUrl(top) ? (
                <img src={getPhotoUrl(top)} alt="" className="tinder-card-avatar-img" />
              ) : (
                <span className="tinder-card-avatar-placeholder">{top.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <p className="tinder-card-objective">
              {getExpertProfile(top)?.goal_text || 'Sem objetivo cadastrado'}
            </p>
            {getCity(top) ? (
              <p className="tinder-card-city">{getCity(top)}</p>
            ) : null}
            <div className="tinder-card-tags">
              {getTags(top).map((tag) => (
                <span key={tag} className="tinder-tag">{tag}</span>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-outline tinder-card-ver-perfil"
              onClick={() => onOpenProfile(top)}
            >
              Ver perfil
            </button>
          </div>
        </div>
      </div>
      <div className="tinder-deck-actions">
        <button
          type="button"
          className="tinder-btn tinder-btn-nope"
          onClick={goNext}
          disabled={isSendingInterest}
          aria-label="Próximo"
        >
          ❌
        </button>
        <button
          type="button"
          className="tinder-btn tinder-btn-like"
          onClick={handleSwipeRight}
          disabled={isSendingInterest}
          aria-label="Possível parceria"
        >
          ❤️
        </button>
      </div>
    </div>
  );
}
