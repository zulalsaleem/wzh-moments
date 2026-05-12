import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import endpoints from '../api/endpoints';

export function useEvents(filters = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status)   params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search)   params.append('search', filters.search);
      if (filters.page)     params.append('page', filters.page);
      if (filters.limit)    params.append('limit', filters.limit);

      const res = await api.get(`${endpoints.events.list}?${params}`);
      const data = res.data;

      setEvents(data.events ?? data);
      setPagination({
        page: data.page ?? 1,
        totalPages: data.totalPages ?? 1,
        total: data.total ?? (data.events?.length ?? 0),
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch events';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.category, filters.search, filters.page, filters.limit]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return { events, loading, error, pagination, refetch: fetchEvents };
}

export function useEvent(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoints.events.getById(eventId));
      setEvent(res.data.event ?? res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Event not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  /** Apply a progress:update socket payload without refetching */
  const applyProgressUpdate = useCallback((data) => {
    if (!data) return;
    setEvent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        timeline: data.timeline ?? prev.timeline,
        completionPercentage: data.completionPercentage ?? prev.completionPercentage,
      };
    });
  }, []);

  /** Apply a booking:created / booking:cancelled payload */
  const applyAttendeeUpdate = useCallback((data) => {
    if (!data) return;
    setEvent((prev) => {
      if (!prev) return prev;
      return { ...prev, currentAttendees: data.currentAttendees };
    });
  }, []);

  return { event, loading, error, refetch: fetchEvent, applyProgressUpdate, applyAttendeeUpdate };
}
