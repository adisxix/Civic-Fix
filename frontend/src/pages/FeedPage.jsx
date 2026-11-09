import React, { useState } from 'react';
import { Search, List, Map as MapIcon, SlidersHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { IssueCard } from '../components/shared/IssueCard';
import { useGetIssuesQuery, useGetMetaQuery } from '../features/api/civicApi';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setFilter } from '../features/issues/filtersSlice';

export function FeedPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [userCoords, setUserCoords] = useState(null);

  const { data: metaData } = useGetMetaQuery();
  const categories = metaData?.data?.categories || [];
  const statuses = metaData?.data?.statuses || [];

  const queryParams = {
    category: filters.category || undefined,
    status: filters.status || undefined,
    q: filters.q || undefined,
    sort: filters.sort,
    page: filters.page,
    limit: 20,
    lat: userCoords?.lat,
    lng: userCoords?.lng,
    radius: userCoords ? 5000 : undefined,
  };

  const { data: issuesData, isLoading } = useGetIssuesQuery(queryParams);
  const issues = issuesData?.data || [];
  const total = issuesData?.meta?.total || 0;

  const handleNearestSort = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        dispatch(setFilter({ key: 'sort', value: 'nearest' }));
      },
      () => {
        alert('Location access was denied. Cannot sort by nearest.');
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink">Public Issues Feed</h1>
          <p className="text-xs text-moss">Ward 14 (Central Market) & surrounding neighbourhoods</p>
        </div>

        <div className="flex items-center gap-2">
          {/* List / Map toggle */}
          <div className="flex rounded-xl bg-mist p-1 border border-sage-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-white text-forest-800 shadow-xs' : 'text-moss'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'map' ? 'bg-white text-forest-800 shadow-xs' : 'text-moss'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>

          <Button variant="lime" size="sm" onClick={() => navigate('/app/report')}>
            <Plus className="w-4 h-4" /> Report Issue
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-sage-300 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-moss absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title or #CF-xxx..."
              value={filters.q}
              onChange={(e) => dispatch(setFilter({ key: 'q', value: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-xs bg-mist/50 border border-sage-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Category */}
          <select
            value={filters.category || ''}
            onChange={(e) =>
              dispatch(setFilter({ key: 'category', value: e.target.value || null }))
            }
            className="w-full px-3 py-2 text-xs bg-mist/50 border border-sage-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.status || ''}
            onChange={(e) => dispatch(setFilter({ key: 'status', value: e.target.value || null }))}
            className="w-full px-3 py-2 text-xs bg-mist/50 border border-sage-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-forest-600"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => {
              if (e.target.value === 'nearest') {
                handleNearestSort();
              } else {
                dispatch(setFilter({ key: 'sort', value: e.target.value }));
              }
            }}
            className="w-full px-3 py-2 text-xs bg-mist/50 border border-sage-300 rounded-xl text-ink focus:outline-none focus:ring-2 focus:ring-forest-600 font-medium"
          >
            <option value="recent">Most Recent</option>
            <option value="supported">Most Supported</option>
            <option value="nearest">Nearest to Me (GPS)</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Content list or empty state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-48 bg-white/70 animate-pulse rounded-2xl border border-sage-200"
            />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sage-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-mist text-forest-800 mx-auto flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">No issues match your current filters</h3>
          <p className="text-xs text-moss max-w-sm mx-auto">
            Try resetting your search query or category filter to browse neighbourhood reports.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch(setFilter({ key: 'q', value: '' }))}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-moss font-semibold">
            Showing {issues.length} of {total} community issues
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedPage;
