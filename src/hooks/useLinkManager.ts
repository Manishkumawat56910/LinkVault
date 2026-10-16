import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchWithAuth } from '../lib/api';
import { Link as LinkModel } from '../types/models';

export function useLinkManager() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [links, setLinks] = useState<LinkModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetchWithAuth(user, '/api/links');
      if (response.ok) {
        const data = await response.json();
        setLinks(data);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = async (newLink: { title: string; url: string }) => {
    if (!user) return false;
    try {
      const response = await fetchWithAuth(user, '/api/links', {
        method: 'POST',
        body: JSON.stringify(newLink)
      });
      if (response.ok) {
        await fetchLinks();
        showToast('Link added successfully!', 'success');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showToast(errorData.error || 'Failed to save link', 'error');
        return false;
      }
    } catch (error) {
      showToast('Network error: Could not save link', 'error');
      return false;
    }
  };

  const toggleLinkStatus = async (link: LinkModel) => {
    if (!user || !link.id) return false;
    try {
      const response = await fetchWithAuth(user, `/api/links/${link.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !link.isActive })
      });
      if (response.ok) {
        setLinks(prev => prev.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
        showToast(link.isActive ? 'Link hidden' : 'Link visible', 'info');
        return true;
      }
      return false;
    } catch (error) {
      showToast('Failed to update link', 'error');
      return false;
    }
  };

  const deleteLink = async (id: string) => {
    if (!user) return false;
    try {
      const response = await fetchWithAuth(user, `/api/links/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLinks(prev => prev.filter(l => l.id !== id));
        showToast('Link deleted', 'success');
        return true;
      }
      return false;
    } catch (error) {
      showToast('Failed to delete link', 'error');
      return false;
    }
  };

  const saveEdit = async (editingId: string, editForm: { title: string; url: string }) => {
    if (!user) return false;
    try {
      const response = await fetchWithAuth(user, `/api/links/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        setLinks(prev => prev.map(l => l.id === editingId ? { ...l, ...editForm } : l));
        showToast('Link updated!', 'success');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showToast(errorData.error || 'Failed to update link', 'error');
        return false;
      }
    } catch (error) {
      showToast('Failed to update link', 'error');
      return false;
    }
  };

  const handleReorder = (newLinks: LinkModel[]) => {
    setLinks(newLinks);
    if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
    reorderTimerRef.current = setTimeout(async () => {
      if (!user) return;
      try {
        await fetchWithAuth(user, '/api/links/reorder', {
          method: 'PUT',
          body: JSON.stringify({ linkIds: newLinks.map(l => l.id) })
        });
      } catch (error) {
        console.error('Error saving reorder:', error);
      }
    }, 500);
  };

  return {
    links,
    loading,
    addLink,
    toggleLinkStatus,
    deleteLink,
    saveEdit,
    handleReorder
  };
}
