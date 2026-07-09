'use client';

import { useState } from 'react';
import type { AxiosError } from 'axios';

import { cn } from '@/libs/utils';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import type { Category } from '@/types';

import { useCategories } from '../../hooks/useCategories';
import { useCreateCategory } from '../../hooks/useCreateCategory';
import { useDeleteCategory } from '../../hooks/useDeleteCategory';
import { useUpdateCategory } from '../../hooks/useUpdateCategory';

interface CategoryModalProps {
  onClose: () => void;
}

export function CategoryModal({ onClose }: CategoryModalProps) {
  const { data: categories = [], isLoading } = useCategories();
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();
  const { mutate: deleteCategory } = useDeleteCategory();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);

  function handleCreate() {
    const name = newName.trim();
    if (!name || isCreating) return;
    createCategory({ name }, { onSuccess: () => setNewName('') });
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setDeleteError(null);
    setDeleteErrorId(null);
  }

  function handleUpdate() {
    if (!editingId || !editingName.trim()) return;
    updateCategory(
      { id: editingId, name: editingName.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleDelete(id: string) {
    setDeleteError(null);
    setDeleteErrorId(null);
    deleteCategory(id, {
      onError: (err) => {
        const msg =
          (err as AxiosError<{ message: string }>).response?.data?.message ??
          'Failed to delete category.';
        setDeleteError(msg);
        setDeleteErrorId(id);
      },
    });
  }

  return (
    <Modal open onClose={onClose} maxWidth="440px">
      <ModalHead tag="◈" title="Manage Categories" />
      <ModalBody>
        {/* Add new */}
        <div className="modal-field">
          <div className="modal-label">Add Category</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="modal-input"
              style={{ flex: 1 }}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name..."
              disabled={isCreating}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className={cn(addBtn, (!newName.trim() || isCreating) && addBtnDisabled)}
            >
              {isCreating ? '...' : '+ Add'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0 10px' }} />

        {/* List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {isLoading ? (
            <div
              style={{
                color: 'var(--text-lo)',
                fontSize: 12,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              Loading...
            </div>
          ) : categories.length === 0 ? (
            <div
              style={{
                color: 'var(--text-lo)',
                fontSize: 12,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No categories yet.
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id}>
                <div className={catRow}>
                  {editingId === cat.id ? (
                    <input
                      className={cn('modal-input', catEditInput)}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className={catName}>{cat.name}</span>
                  )}

                  <div className={catActions}>
                    {editingId === cat.id ? (
                      <>
                        <button
                          type="button"
                          className={cn(catBtn, catBtnSave)}
                          onClick={handleUpdate}
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          className={catBtn}
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={catBtn}
                          onClick={() => startEdit(cat)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className={cn(catBtn, catBtnDelete)}
                          onClick={() => handleDelete(cat.id)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {deleteErrorId === cat.id && deleteError && (
                  <div className={errorMsg}>⚠ {deleteError}</div>
                )}
              </div>
            ))
          )}
        </div>
      </ModalBody>
      <ModalFoot>
        <button type="button" className="modal-btn cancel" onClick={onClose}>
          Close
        </button>
      </ModalFoot>
    </Modal>
  );
}

const addBtn =
  'px-3 h-[34px] rounded-[var(--r-sm)] text-[11px] font-bold font-[var(--font-title)] tracking-[0.08em] bg-[oklch(0.74_0.17_85_/_0.15)] border border-[oklch(0.74_0.17_85_/_0.5)] text-[var(--gold)] cursor-pointer transition-all hover:bg-[oklch(0.74_0.17_85_/_0.25)] shrink-0';
const addBtnDisabled = 'opacity-40 cursor-not-allowed';

const catRow =
  'flex items-center gap-2 px-3 py-[7px] rounded-[var(--r-sm)] bg-[var(--panel2)] border border-[var(--border)] group';
const catName = 'flex-1 text-[12px] text-[var(--text-hi)] font-[var(--font-body)]';
const catEditInput = 'flex-1 h-[26px] py-0 px-2 text-[12px]';
const catActions = 'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0';
const catBtn =
  'w-[22px] h-[22px] rounded-[var(--r-sm)] flex items-center justify-center text-[10px] text-[var(--text-mid)] bg-[var(--panel3)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-hi)] hover:border-[var(--border-hi)] transition-all';
const catBtnSave = 'hover:text-[var(--mint)] hover:border-[var(--mint)]';
const catBtnDelete = 'hover:text-[var(--rose)] hover:border-[var(--rose)]';

const errorMsg =
  'mt-1 px-3 py-[5px] text-[10px] text-[var(--rose)] bg-[oklch(0.62_0.24_22_/_0.1)] border border-[oklch(0.62_0.24_22_/_0.3)] rounded-[var(--r-sm)]';
